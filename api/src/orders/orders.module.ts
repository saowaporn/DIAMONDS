import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [CommonModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
