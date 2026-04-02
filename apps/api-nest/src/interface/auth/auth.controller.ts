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
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserUseCase } from '@forreal/application';
import { LoginUserUseCase } from '@forreal/application';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ITokenService } from '@forreal/domain';
import { IUserRepository } from '@forreal/domain';
import { AuthErrorMapper } from './error-mapper';
import { MonitoringService } from '../../metrics/monitoring.service';

const isProduction = process.env.NODE_ENV === 'production';
const TOKEN_EXPIRY_MS = 15 * 60 * 1000;

// Rate limit simple en mémoire (par IP) pour /auth/login.
// Note: si tu scales sur plusieurs instances, remplace par Redis.
const LOGIN_RATE_LIMIT = { windowMs: 60_000, max: 10 } as const;
type RateRec = { count: number; resetAt: number };
const loginAttemptsByIp = new Map<string, RateRec>();

function getRequestIp(req: Request): string {
  // trust proxy peut être activé en prod (main.ts). On check x-forwarded-for.
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
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,

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
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      enforceLoginRateLimit(req);

      // Blocage immédiat si l'utilisateur est banni
      const candidate = await this.userRepository.findByEmail(dto.email.trim().toLowerCase()).catch(() => null);
      if (candidate?.isBanned) {
        this.monitoring.recordAuthAttempt('/auth/login', false);
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

      this.monitoring.recordAuthAttempt('/auth/login', true);
      return { success: true, message: 'Login successful' };
    } catch (error) {
      if (!(error instanceof ForbiddenException)) {
        this.monitoring.recordAuthAttempt('/auth/login', false);
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

      // Si l'utilisateur est banni, on renvoie 403 (même message que RolesGuard)
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
