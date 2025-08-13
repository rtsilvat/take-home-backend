import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logsDirPath = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDirPath)) {
    fs.mkdirSync(logsDirPath, { recursive: true });
  }

  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf((info) => {
            const level = String(info.level);
            const timestamp = String(info.timestamp);
            const contextStr = info.context
              ? ` [${JSON.stringify(info.context)}]`
              : '';
            const message =
              typeof info.message === 'string'
                ? info.message
                : JSON.stringify(info.message);
            return `${timestamp} [${level}]${contextStr} ${message}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: path.join(logsDirPath, 'app.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, { logger });

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: false,
    }),
  );

  const configService = app.get(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ambev API')
    .setDescription('API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const portFromEnv = configService.get<number>('PORT');
  await app.listen(portFromEnv ?? 3001);
}
void bootstrap();
