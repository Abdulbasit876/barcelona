import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AdminApiBootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Barcelona Taxi Transfer - Admin & Driver API')
    .setDescription(
      'Enterprise API for Barcelona Taxi Transfer: Admin Dashboard, Driver Portal, Dispatch Engine, Financial Analytics, Approvals Queue, and Phone Push Notifications',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.ADMIN_API_PORT || 4001;
  await app.listen(port);

  logger.log(`🚀 Barcelona Admin API is running on: http://localhost:${port}/api/v1`);
  logger.log(`📑 Swagger Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
