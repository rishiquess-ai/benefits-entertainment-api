import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Checks each request body against its DTO class (e.g. EmployeeDetailsDto).
  // whitelist + forbidNonWhitelisted: a body with unknown fields gets a 400.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Runs onModuleDestroy (closing database connections) when the app is stopped.
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
