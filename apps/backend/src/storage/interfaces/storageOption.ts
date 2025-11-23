import { ModuleMetadata, Type } from '@nestjs/common';

export interface DiskOptions {
  driver: 's3' | 'local';
  profile?: string;
  region?: string;
  bucket?: string;
  basePath?: string;
  endpoint?: string;
  cdnEndpoint?: string;
  s3ForcePathStyle?: boolean;
  publicPath?: string;
  baseUrl?: string;
  accessKeyId?: string;
  accessSecretKey?: string;
  visibility?: 'public' | 'private';
}

export interface StorageOptions {
  default?: string;
  disks: Record<string, DiskOptions>;
}

export interface StorageOptionsFactory {
  createStorageOptions(): Promise<StorageOptions> | StorageOptions;
}

export interface StorageAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useExisting?: Type<StorageOptions>;
  useClass?: Type<StorageOptions>;
  useFactory?: (...args: any[]) => Promise<StorageOptions> | StorageOptions;
  inject?: any[];
}
