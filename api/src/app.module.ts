import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { DiamondsModule } from './diamonds/diamonds.module';
import { RingSettingsModule } from './ring-settings/ring-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    DiamondsModule,
    RingSettingsModule,
  ],
})
export class AppModule {}
