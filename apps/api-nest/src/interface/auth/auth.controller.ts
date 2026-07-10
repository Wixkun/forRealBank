import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  ForbiddenException,
  Req,
  Inject,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterUserUseCase } from '@forreal/application';
import { LoginUserUseCase } from '@forreal/application';
import { RequestPasswordResetUseCase, ResetPasswordUseCase } from '@forreal/application';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ITokenService } from '@forreal/domain';
import { IUserRepository } from '@forreal/domain';
import { AuthErrorMapper } from './error-mapper';
import { MonitoringService } from '../../metrics/monitoring.service';

const isProduction = process.env.NODE_ENV === 'production';
const TOKEN_EXPIRY_MS = 15 * 60 * 1000;

const LOGIN_RATE_LIMIT = { windowMs: 60_000, max: 10 } as const;
type RateRec = { count: number; resetAt: number };
const loginAttemptsByIp = new Map<string, RateRec>();

function getRequestIp(req: Request): string {
  const xff = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  return xff || req.ip || (req.socket?.remoteAddress ?? 'unknown');
}

function enforceLoginRateLimit(req: Request) {
  const ip = getRequestIp(req);
  const now = Date.now();
  const rec = loginAttemptsByIp.get(ip);
  if (!rec || rec.resetAt <= now) {
    loginAttemptsByIp.set(ip, { count: 1, resetAt: now + LOGIN_RATE_LIMIT.windowMs });
    return;
  }
  rec.count += 1;
  if (rec.count > LOGIN_RATE_LIMIT.max) {
    const retrySeconds = Math.max(1, Math.ceil((rec.resetAt - now) / 1000));
    throw new HttpException(`Too many attempts, retry in ${retrySeconds}s`, 429);
  }
}

@Controller('/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,

    @Inject(ITokenService)
    private readonly tokenService: ITokenService,

    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,

    private readonly monitoring: MonitoringService,
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
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    try {
      this.logger.log(`Forgot password requested for ${email}`);
      await this.requestPasswordResetUseCase.execute({
        email,
        locale: dto.locale,
      });
      this.logger.log(`Forgot password flow completed for ${email}`);

      return {
        success: true,
        message: 'If an account exists for this email, a reset link has been sent',
      };
    } catch (error) {
      this.logger.error(`Forgot password failed for ${email}`, error);
      throw AuthErrorMapper.mapToHttpException(error);
    }
  }

  @HttpCode(200)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      await this.resetPasswordUseCase.execute({
        token: dto.token,
        password: dto.password,
      });

      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      throw AuthErrorMapper.mapToHttpException(error);
    }
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      enforceLoginRateLimit(req);

      const candidate = await this.userRepository
        .findByEmail(dto.email.trim().toLowerCase())
        .catch(() => null);
      if (candidate?.isBanned) {
        this.monitoring.recordLoginAttempt('failure');
        throw new ForbiddenException('Account banned');
      }

      const { accessToken } = await this.loginUserUseCase.execute(dto);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        maxAge: TOKEN_EXPIRY_MS,
      });

      this.monitoring.recordLoginAttempt('success');
      return { success: true, message: 'Login successful' };
    } catch (error) {
      if (!(error instanceof ForbiddenException)) {
        this.monitoring.recordLoginAttempt('failure');
      }
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

      if (user.isBanned) {
        throw new ForbiddenException('Account banned');
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
