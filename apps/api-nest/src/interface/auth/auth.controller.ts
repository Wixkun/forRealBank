import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserUseCase } from '@forreal/application/user/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '@forreal/application/user/usecases/LoginUserUseCase';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      return await this.registerUser.execute(dto);
    } catch (e) {
      if (e instanceof Error && e.message === 'EMAIL_TAKEN') {
        throw new ConflictException('Email déjà utilisé');
      }
      throw e;
    }
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    try {
      const { accessToken } = await this.loginUser.execute(dto);
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return { accessToken };
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_CREDENTIALS') {
        throw new UnauthorizedException('Identifiants invalides');
      }
      throw e;
    }
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me() {
    return { ok: true };
  }
}
