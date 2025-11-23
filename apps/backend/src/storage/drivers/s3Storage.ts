import {
  StorageDriver,
  DiskOptions,
  FileOptions,
  FileMetadataResponse,
  PutFileResponse,
  RenameFileResponse,
  UploadPartResponse,
  ListObjectsResponse,
  GetFileResponse,
  GetFileStreamResponse,
} from '../interfaces';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CompletedPart,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getMimeFromExtension } from '../helpers';
import _ from 'lodash';
import { Readable } from 'stream';

export class S3Storage implements StorageDriver {
  private readonly disk: string;
  private config: DiskOptions;
  private client: S3Client;

  private signedUrlCache: Map<string, { url: string; expires: number }> =
    new Map();

  constructor(disk: string, config: DiskOptions) {
    this.disk = disk;
    this.config = config;

    if (!this.config.region) {
      throw new Error(`S3 region is required for disk '${disk}'.`);
    }
    if (!this.config.accessKeyId) {
      throw new Error(`S3 accessKeyId is required for disk '${disk}'.`);
    }
    if (!this.config.accessSecretKey) {
      throw new Error(`S3 accessSecretKey is required for disk '${disk}'.`);
    }

    // Initialize S3 client
    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.accessSecretKey,
      },
      forcePathStyle: this.config.s3ForcePathStyle,
    });
  }

  /**
   * Put file content to the path specified.
   *
   * @param path
   * @param fileContent
   */
  async put(
    path: string,
    fileContent: any,
    options?: FileOptions,
  ): Promise<PutFileResponse> {
    const { mimeType } = options || {};
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: path,
      Body: fileContent,
      ContentType: mimeType ? mimeType : getMimeFromExtension(path),
      // ACL: this.config.visibility === 'public' ? 'public-read' : 'private', // use IAM policy instead
    });

    await this.client.send(command);
    return { url: this.url(path), path };
  }

  /**
   * Initiates a multipart upload and returns an upload ID
   *
   * @param path
   */
  async createMultipartUpload(
    path: string,
    options?: FileOptions,
  ): Promise<string> {
    const { mimeType } = options || {};
    const command = new CreateMultipartUploadCommand({
      Bucket: this.config.bucket,
      Key: path,
      ContentType: mimeType ? mimeType : getMimeFromExtension(path),
      ACL: this.config.visibility === 'public' ? 'public-read' : 'private',
    });

    const res = await this.client.send(command);
    if (!res.UploadId) {
      throw new Error(
        'Failed to create multipart upload: UploadId is missing.',
      );
    }
    return res.UploadId;
  }

  /**
   * Uploads a file content by part
   *
   * @param path
   * @param fileContent
   * @param uploadId
   * @param partNumber
   */
  async uploadByPart(
    path: string,
    fileContent: any,
    uploadId: string,
    partNumber: number,
  ): Promise<UploadPartResponse> {
    const command = new UploadPartCommand({
      Bucket: this.config.bucket,
      Key: path,
      UploadId: uploadId,
      Body: fileContent,
      PartNumber: partNumber,
    });

    const res = await this.client.send(command);
    if (!res.ETag) {
      throw new Error('Failed to upload part: ETag is missing.');
    }
    return { ETag: res.ETag, PartNumber: partNumber };
  }

  /**
   * Complete the multipart upload
   *
   * @param path
   * @param uploadId
   * @param multipartUpload
   */
  async completeMultipartUpload(
    path: string,
    uploadId: string,
    multipartUpload: UploadPartResponse[],
  ): Promise<PutFileResponse> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.config.bucket,
      Key: path,
      UploadId: uploadId,
      MultipartUpload: {
        // Parts must be sorted by PartNumber
        Parts: _.orderBy(
          multipartUpload,
          ['PartNumber'],
          ['asc'],
        ) as CompletedPart[],
      },
    });

    await this.client.send(command);
    return { url: this.url(path), path };
  }

  /**
   * Abort the multipart upload (if multipart upload failed)
   *
   * @param path
   * @param uploadId
   */
  async abortMultipartUpload(path: string, uploadId: string): Promise<boolean> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.config.bucket,
      Key: path,
      UploadId: uploadId,
    });

    try {
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Signed Urls - synchronous version required by interface
   * Uses caching to avoid generating new URLs on every call
   *
   * @param path
   * @param expireInMinutes
   */
  signedUrl(path: string, expireInMinutes = 20): string {
    const cacheKey = `${path}:${expireInMinutes}`;
    const now = Date.now();
    const cached = this.signedUrlCache.get(cacheKey);

    if (cached && now < cached.expires - 5 * 60 * 1000) {
      return cached.url;
    }

    const expiresAt = now + expireInMinutes * 60 * 1000;
    let signedUrl = '';

    if (this.config.endpoint) {
      signedUrl = `${this.config.endpoint}/${this.config.bucket}/${path}`;
    } else {
      signedUrl = `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${path}`;
    }

    // Store in cache
    this.signedUrlCache.set(cacheKey, { url: signedUrl, expires: expiresAt });

    return signedUrl;
  }

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(path: string): Promise<GetFileResponse> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket || '',
        Key: path,
      });
      const res = await this.client.send(command);

      // Convert stream to buffer
      if (res.Body) {
        return await this.streamToBuffer(res.Body as ReadableStream);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert ReadableStream to Buffer
   * @param stream
   */
  private async streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    // Read all chunks
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Get file stream stored at the specified path.
   * This must be synchronous according to the interface.
   *
   * @param path
   */
  getStream(path: string): GetFileStreamResponse {
    // Create a readable stream that will be populated asynchronously
    const nodeStream = new Readable({
      read() {}, // No-op implementation required
    });

    // Start async process to fetch data
    (async () => {
      try {
        const command = new GetObjectCommand({
          Bucket: this.config.bucket || '',
          Key: path,
        });

        const res = await this.client.send(command);

        if (res.Body) {
          const reader = (res.Body as ReadableStream).getReader();

          // Process function to push data into the readable stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              nodeStream.push(null); // No more data
              break;
            }
            nodeStream.push(Buffer.from(value));
          }
        } else {
          nodeStream.push(null); // Empty response
        }
      } catch (err) {
        nodeStream.emit('error', err);
        nodeStream.push(null);
      }
    })();

    return nodeStream;
  }

  /**
   * List all files stored at the specified path.
   *
   * @param path
   */
  async listObjects(path: string): Promise<ListObjectsResponse[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket || '',
      Prefix: path,
    });

    try {
      const results = await this.client.send(command);

      // Return empty array if result invalid
      if (!results || !results.Contents || !Array.isArray(results.Contents))
        return [];

      // Check whether there is result that is not within the path (Just in case)
      const hvContentThatIsNotWithinPath = results.Contents.some(
        (item) => !item.Key || !item.Key.startsWith(path),
      );

      if (hvContentThatIsNotWithinPath) return [];

      const newResults: ListObjectsResponse[] = results.Contents.filter(
        (item) => item.Key && item.LastModified && item.Size !== undefined,
      ).map((item) => {
        return {
          Key: item.Key!,
          LastModified: item.LastModified!,
          Size: item.Size!,
        };
      });

      return newResults;
    } catch (e) {
      return [];
    }
  }

  /**
   * Check if file exists at the path.
   *
   * @param path
   */
  async exists(path: string): Promise<boolean> {
    const meta = await this.meta(path);
    return meta ? true : false;
  }

  /**
   * Get object's metadata
   * @param path
   */
  async meta(path: string): Promise<FileMetadataResponse> {
    const command = new HeadObjectCommand({
      Bucket: this.config.bucket,
      Key: path,
    });

    try {
      const res = await this.client.send(command);
      return {
        path: path,
        contentType: res.ContentType || 'application/octet-stream',
        contentLength: res.ContentLength || 0,
        lastModified: res.LastModified || new Date(),
      };
    } catch (e) {
      // Return empty metadata object instead of null to match interface
      return {
        path: path,
        contentType: '',
        contentLength: 0,
        lastModified: new Date(0),
      };
    }
  }

  /**
   * Check if file is missing at the path.
   *
   * @param path
   */
  async missing(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
      });
      await this.client.send(command);
      return false; // File exists
    } catch (e) {
      return true; // File doesn't exist
    }
  }

  /**
   * Get URL for path mentioned.
   * This must be synchronous according to the interface.
   *
   * @param path
   */
  url(path: string): string {
    if (this.config.visibility === 'private') return '';

    // Get the base signed URL without query parameters
    const baseUrl = this.signedUrl(path, 20).split('?')[0];
    return baseUrl;
  }

  /**
   * Helper method for getting signed URLs asynchronously
   * This is used internally but not exposed in the interface
   *
   * @param path
   * @param expireInMinutes
   */
  private async getSignedUrlAsync(
    path: string,
    expireInMinutes = 20,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: path,
    });

    const signedUrl = await getSignedUrl(this.client, command, {
      expiresIn: 60 * expireInMinutes,
    });

    return signedUrl;
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async delete(path: string): Promise<boolean> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket || '',
      Key: path,
    });

    try {
      await this.client.send(command);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Delete files in batches from the given paths.
   *
   * @param paths
   */
  async deleteInBatches(paths: string[]): Promise<boolean> {
    const batchSize = 1000; // Max number of objects per delete request
    const totalPaths = paths.length;

    for (let i = 0; i < totalPaths; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);

      const command = new DeleteObjectsCommand({
        Bucket: this.config.bucket || '',
        Delete: {
          Objects: batch.map((path) => ({ Key: path })),
          Quiet: false, // set to true for minimal response
        },
      });

      try {
        await this.client.send(command);
      } catch (err) {
        return false;
      }
    }
    return true;
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async deletePath(path: string): Promise<boolean> {
    try {
      const contents = await this.listObjects(path);

      // Delete the object
      for (const content of contents) {
        await this.delete(content.Key);
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Copy file internally in the same disk
   *
   * @param path
   * @param newPath
   */
  async copy(path: string, newPath: string): Promise<RenameFileResponse> {
    const command = new CopyObjectCommand({
      Bucket: this.config.bucket || '',
      CopySource: `${this.config.bucket}/${path}`,
      Key: newPath,
    });

    await this.client.send(command);
    return { path: newPath, url: this.url(newPath) };
  }

  /**
   * Move file internally in the same disk
   *
   * @param path
   * @param newPath
   */
  async move(path: string, newPath: string): Promise<RenameFileResponse> {
    await this.copy(path, newPath);
    await this.delete(path);
    return { path: newPath, url: this.url(newPath) };
  }

  /**
   * Get instance of driver's client.
   */
  getClient(): S3Client {
    return this.client;
  }

  /**
   * Get config of the driver's instance.
   */
  getConfig(): Record<string, any> {
    return this.config;
  }
}
