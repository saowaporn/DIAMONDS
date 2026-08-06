import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolveCorsOrigin } from './common/utils/cors';

function resolvePort(): number {
  const rawPort = Number(process.env.PORT);
  return Number.isInteger(rawPort) && rawPort > 0 && rawPort < 65536 ? rawPort : 3001;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: resolveCorsOrigin(process.env.ALLOWED_ORIGIN),
  });

  app.setGlobalPrefix('api');

  const port = resolvePort();
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${port}`);
}

bootstrap();
