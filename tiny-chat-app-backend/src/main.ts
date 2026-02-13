import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { json } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      whitelist: true,
    }),
  );

  app.use(compression());
  app.use(helmet());
  app.enableCors({ origin: true });
  app.use(json({ limit: '500kb' }));

  const appConfig = await app.resolve(ConfigService);
  const version = appConfig.getOrThrow<string>('version');

  // Swagger
  const title = 'Tiny Chat Application';
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription('The Tiny Chat App API description')
    .setVersion(version)
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api', app, documentFactory);

  const port = process.env.PORT ?? 3001;

  await app.listen(port);

  Logger.log(`${title} is running on: http://localhost:${port}`);

  return app;
}
void bootstrap();
