import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import RateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalPipes(new ValidationPipe());

  app.useLogger(app.get(Logger));

  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  app.use(
    helmet(),
    RateLimit({
      windowMs: 15 * 60 * 1000,
      limit: Number(process.env.RATE_LIMIT_MAX),
    }),
  );

  // added via prefix , due to no versionity, otherwise it should be added to swagger config
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Message System')
    .setDescription('Avito Real Message API')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: false,
    },
  });

  await app.listen(process.env.PORT ?? 9000);
}
bootstrap();
