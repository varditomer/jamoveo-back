import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Set global prefix for API routes
  app.setGlobalPrefix('api');

  // Enable CORS with specific allowed origins
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Production static file serving
  if (process.env.NODE_ENV === 'production') {
    app.useStaticAssets(join(__dirname, '..', 'public'));
    logger.log('Running in production mode');
  } else {
    logger.log('Running in development mode');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Server is running on port: ${port}`);
}
bootstrap();
