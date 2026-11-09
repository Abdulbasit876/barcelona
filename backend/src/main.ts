import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('UnifiedBackendBootstrap');
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe signature verification
  });

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Setup Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Barcelona Taxi Transfer - Unified API')
    .setDescription(
      'Unified REST API and Webhook Engine for Barcelona Taxi Transfer: Customer Bookings, Admin Dashboard, Driver Portal, Dispatch Engine, Financial Analytics, and Payments.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('pricing')
    .addTag('bookings')
    .addTag('vehicles')
    .addTag('famous-places')
    .addTag('payments')
    .addTag('receipts')
    .addTag('driver-tracking')
    .addTag('contact')
    .addTag('health')
    .addTag('Authentication')
    .addTag('Bookings Administration')
    .addTag('Approvals')
    .addTag('Drivers')
    .addTag('Dispatch Engine')
    .addTag('Driver Portal')
    .addTag('Financial & Operational Analytics')
    .addTag('Settings')
    .addTag('Notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || process.env.ADMIN_API_PORT || 4001;
  await app.listen(port);

  logger.log(`🚀 Unified Barcelona Backend is running on: http://localhost:${port}`);
  logger.log(`📑 Swagger Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();

