import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  Req,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserUseCase } from '@forreal/application/user/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '@forreal/application/user/usecases/LoginUserUseCase';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ITokenService } from '@forreal/domain/user/ports/ITokenService';
import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { AuthErrorMapper } from './error-mapper';

const isProduction = process.env.NODE_ENV === 'production';
const TOKEN_EXPIRY_MS = 15 * 60 * 1000;

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,

    @Inject(ITokenService)
    private readonly tokenService: ITokenService,

    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  @HttpCode(201)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      await this.registerUserUseCase.execute({
        email: dto.email.trim().toLowerCase(),
        password: dto.password,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
      });

      return { success: true, message: 'User successfully registered' };
    } catch (error) {
      throw AuthErrorMapper.mapToHttpException(error);
    }
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    try {
      const { accessToken } = await this.loginUserUseCase.execute(dto);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        maxAge: TOKEN_EXPIRY_MS,
      });

      return { success: true, message: 'Login successful' };
    } catch (error) {
      throw AuthErrorMapper.mapToHttpException(error);
    }
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    return { success: true, message: 'Logout successful' };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getAuthenticatedUser(@Req() req: Request) {
    const token = req.cookies?.['access_token'];
    if (!token) throw new UnauthorizedException('Missing access token');

    try {
      const decodedToken = await this.tokenService.verify(token);
      const user = await this.userRepository.findById(decodedToken.userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: Array.from(user.roles),
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      console.error('[Auth.me] Error verifying token:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
