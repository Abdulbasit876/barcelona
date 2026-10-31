import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe signature verification
  });

  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Setup Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Barcelona Taxi Transfer API')
    .setDescription(
      'REST API and Webhook Engine for Barcelona Taxi Transfer, bookings, pricing calculations, driver tracking, and Stripe payments.',
    )
    .setVersion('1.0.0')
    .addTag('pricing')
    .addTag('bookings')
    .addTag('vehicles')
    .addTag('famous-places')
    .addTag('payments')
    .addTag('receipts')
    .addTag('driver-tracking')
    .addTag('contact')
    .addTag('health')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Barcelona Taxi Transfer API running on http://localhost:${port}`);
  logger.log(`Swagger OpenAPI Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
