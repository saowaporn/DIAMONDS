import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import express = require('express');
import { AppModule } from './app.module';
import { resolveCorsOrigin } from './common/utils/cors';

const server = express();
let bootstrapped: Promise<void> | null = null;

async function bootstrapServer(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.enableCors({
    origin: resolveCorsOrigin(process.env.ALLOWED_ORIGIN),
  });

  app.setGlobalPrefix('api');

  await app.init();
}

export default async function handler(req: Request, res: Response) {
  if (!bootstrapped) {
    bootstrapped = bootstrapServer();
  }

  await bootstrapped;
  server(req, res);
}
