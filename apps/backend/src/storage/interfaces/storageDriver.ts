import {
  GetFileResponse,
  FileMetadataResponse,
  PutFileResponse,
  RenameFileResponse,
  FileOptions,
  UploadPartResponse,
  GetFileStreamResponse,
  ListObjectsResponse,
} from '.';

export interface StorageDriver {
  /**
   * Put file content to the path specified.
   *
   * @param path
   * @param fileContent
   */
  put(
    path: string,
    fileContent: any,
    options?: FileOptions,
  ): Promise<PutFileResponse>;

  /**
   * Initiates a multipart upload and returns an upload ID
   *
   * @param path
   */
  createMultipartUpload(path: string, options?: FileOptions): Promise<string>;

  /**
   * Uploads a file content by part
   *
   * @param path
   * @param fileContent
   * @param uploadId
   * @param partNumber
   */
  uploadByPart(
    path: string,
    fileContent: any,
    uploadId: string,
    partNumber: number,
  ): Promise<UploadPartResponse>;

  /**
   * Complete the multipart upload
   *
   * @param path
   * @param uploadId
   * @param multipartUpload
   */
  completeMultipartUpload(
    path: string,
    uploadId: string,
    multipartUpload: UploadPartResponse[],
  ): Promise<PutFileResponse>;

  /**
   * Abort the multipart upload (if multipart upload failed)
   *
   * @param path
   * @param uploadId
   */
  abortMultipartUpload(path: string, uploadId: string): Promise<boolean>;

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  get(path: string): Promise<GetFileResponse>;

  /**
   * Get file stream stored at the specified path.
   *
   * @param path
   */
  getStream(path: string): GetFileStreamResponse;

  /**
   * List file stored at the specified path.
   *
   * @param path
   */
  listObjects(path: string): Promise<ListObjectsResponse[]>;

  /**
   * Check if file exists at the path.
   *
   * @param path
   */
  exists(path: string): Promise<boolean>;

  /**
   * Check if file is missing at the path.
   *
   * @param path
   */
  missing(path: string): Promise<boolean>;

  /**
   * Get URL for path mentioned.
   *
   * @param path
   */
  url(path: string): string;

  /**
   * Get Signed Urls
   * @param path
   * @param expireInMinutes
   */
  signedUrl(path: string, expireInMinutes: number): string;

  /**
   * Get object's metadata
   * @param path
   */
  meta(path: string): Promise<FileMetadataResponse>;

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  delete(path: string): Promise<boolean>;

  /**
   * Delete files in batches from the given paths.
   *
   * @param paths
   */
  deleteInBatches(paths: string[]): Promise<boolean>;

  /**
   * Delete all files at the given path.
   *
   * @param path
   */
  deletePath(path: string): Promise<boolean>;

  /**
   * Copy file internally in the same disk
   *
   * @param path
   * @param newPath
   */
  copy(path: string, newPath: string): Promise<RenameFileResponse>;

  /**
   * Move file internally in the same disk
   *
   * @param path
   * @param newPath
   */
  move(path: string, newPath: string): Promise<RenameFileResponse>;

  // /**
  //  * Copy object from one path to the same path but on a different disk
  //  *
  //  * @param filePath
  //  * @param destinationDisk
  //  * @returns
  //  */
  // copyToDisk(filePath: string, destinationDisk: string): Promise<boolean>;

  // /**
  //  * Copy object from one path to the same path but on a different disk
  //  *
  //  * @param filePath
  //  * @param destinationDisk
  //  * @returns
  //  */
  // moveToDisk(filePath: string, destinationDisk: string): Promise<boolean>;

  /**
   * Get instance of driver's client.
   */
  getClient(): any;

  /**
   * Get config of the driver's instance.
   */
  getConfig(): Record<string, any>;
}
