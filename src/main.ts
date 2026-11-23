import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors();
  app.enableShutdownHooks();
  configureApp(app);

  const doc = new DocumentBuilder()
    .setTitle('OneAtlas API')
    .setDescription('AI model discovery & intelligence platform: models, labs, providers, pricing, benchmarks, rankings.')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API on :${port}  |  Swagger on /docs`);
}
bootstrap();
