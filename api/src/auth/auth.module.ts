import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '../common/common.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    CommonModule,
    // No secret registered here: process.env.JWT_SECRET isn't guaranteed to be
    // populated yet at module-definition time (ConfigModule's dotenv loading
    // hasn't necessarily run before this file is imported). The secret is
    // passed explicitly at call time in AuthService instead, read lazily at
    // request time — same pattern GoogleSheetsService already uses for its env vars.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
