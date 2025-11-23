import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SuccessResponseInterceptor } from './interceptor/success-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3002);

  const configService = app.get(ConfigService);

  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Storify API')
      .setDescription('Storify API description')
      .setVersion('1.0')
      .addCookieAuth('connect.sid', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  app.enableCors({
    origin: true,
    credentials: true,
  });
}
bootstrap();
