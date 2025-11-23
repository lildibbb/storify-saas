import { StorageDriver } from './interfaces';
import { S3Storage } from './drivers/s3Storage';

export class DriverManager {
  private readonly driverMap: { [key: string]: any } = {
    s3: S3Storage,
  };

  getDriver(disk: string, config: Record<string, any>): StorageDriver {
    const driver = this.driverMap[config.driver];
    return new driver(disk, config);
  }
}
