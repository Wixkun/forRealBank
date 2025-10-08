import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  ConflictException,
  UnauthorizedException,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserUseCase } from '@forreal/application/user/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '@forreal/application/user/usecases/LoginUserUseCase';
import { JwtAuthGuard } from './jwt-auth.guard';

const isProduction = process.env.NODE_ENV === 'production';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @HttpCode(201)
  @Post('register')
  async register(@Body() registerData: RegisterDto) {
    try {
      await this.registerUserUseCase.execute({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
      });
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'EMAIL_ALREADY_REGISTERED' || error.message === 'EMAIL_TAKEN') {
          throw new ConflictException('Email already registered');
        }
        if (error.message === 'INVALID_FULL_NAME' || error.message === 'INVALID_NAME') {
          throw new BadRequestException('First name and last name are required');
        }
      }
      throw error;
    }
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() loginData: LoginDto, @Res({ passthrough: true }) response: Response) {
    try {
      const { accessToken } = await this.loginUserUseCase.execute(loginData);

      response.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw error;
    }
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getAuthenticatedUser() {
    return { success: true };
  }
}
