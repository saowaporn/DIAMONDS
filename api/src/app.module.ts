import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { DiamondsModule } from './diamonds/diamonds.module';
import { RingSettingsModule } from './ring-settings/ring-settings.module';
import { ConsultModule } from './consult/consult.module';
import { OrdersModule } from './orders/orders.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    DiamondsModule,
    RingSettingsModule,
    ConsultModule,
    OrdersModule,
    ContactModule,
  ],
})
export class AppModule {}
