import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginRequestBody {
  username?: string;
  password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginRequestBody) {
    const username = (body?.username || '').trim();
    if (!username) {
      throw new HttpException({ status: 'error', message: 'A username is required' }, HttpStatus.BAD_REQUEST);
    }

    const password = (body?.password || '').trim();
    if (!password) {
      throw new HttpException({ status: 'error', message: 'A password is required' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const { token } = await this.authService.login(username, password);
      return { status: 'success', token };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      const err = error as { message?: string };
      // eslint-disable-next-line no-console
      console.error('Error during login:', err.message);

      throw new HttpException(
        { status: 'error', message: 'Invalid username or password' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
