import { Readable } from 'stream';

export * from './storageDriver';
export * from './fileOption';
export * from './storageOption';

export interface FileMetadataResponse {
  path?: string;
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
}

export type GetFileResponse = Buffer | null;

export type GetFileStreamResponse = Readable | null;

export interface PutFileResponse {
  path?: string;
  url?: string;
}

export interface RenameFileResponse {
  path?: string;
  url?: string;
}

export interface UploadPartResponse {
  ETag: string;
  PartNumber: number;
}

export interface ListObjectsResponse {
  Key: string;
  LastModified: Date;
  Size: number;
}
