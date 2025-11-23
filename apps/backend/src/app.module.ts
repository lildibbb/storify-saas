import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageModule } from './storage/storage.module';
import configuration from './config/configuration';
import { StorageOptions } from './storage/interfaces';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
    }),
    StorageModule.registerAsync({
      imports: [ConfigService],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): StorageOptions => {
        const storageConfig = configService.get<StorageOptions>('aws.storage');
        if (!storageConfig) {
          throw new Error('Storage config not found');
        }
        return storageConfig;
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
