import { join } from 'path';

export default () => ({
  node_env: process.env.NODE_ENV || 'production',
  version: '1.0.0',
  port: parseInt(process.env.PORT!, 10) || 3002,
  app_url: process.env.APP_URL || 'http://localhost:3002',
  web_frontend_url: process.env.WEB_FRONTEND_URL || 'http://localhost:3000',
  dashboard_frontend_url:
    process.env.DASHBOARD_FRONTEND_URL || 'http://localhost:3001',

  aws: {
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    access_key: process.env.AWS_ACCESS_KEY,
    secret_key: process.env.AWS_SECRET_KEY,

    storage: {
      disks: {
        default: {
          driver: 's3',
          bucket: process.env.S3_BUCKET,
          accessKeyId: process.env.AWS_ACCESS_KEY,
          accessSecretKey: process.env.AWS_SECRET_KEY,
          endpoint: process.env.AWS_ENDPOINT,
          region: process.env.AWS_REGION,
          s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || true,
          visibility: 'public',
        },
      },
    },
  },
});
