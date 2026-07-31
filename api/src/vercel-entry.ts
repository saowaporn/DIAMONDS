import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import express = require('express');
import { AppModule } from './app.module';

const server = express();
let bootstrapped: Promise<void> | null = null;

async function bootstrapServer(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN || true,
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
