import { Controller, Get, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { RingSettingsService } from './ring-settings.service';

@Controller('products')
export class RingSettingsController {
  constructor(private readonly ringSettingsService: RingSettingsService) {}

  @Get('settings')
  async getSettings() {
    try {
      const data = await this.ringSettingsService.getAllFormatted();
      return { status: 'success', count: data.length, data };
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const googleErrorMessage = err.response?.data?.error?.message;
      // eslint-disable-next-line no-console
      console.error('Error reading ring settings:', googleErrorMessage || err.message);

      throw new HttpException(
        { status: 'error', message: 'Unable to load ring setting data from Google Sheet' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('settings/cache/clear')
  @HttpCode(HttpStatus.OK)
  clearCache() {
    this.ringSettingsService.clearCache();
    return { status: 'success', message: 'Ring setting cache cleared' };
  }
}
