import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';

export enum AuthErrorCode {
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  INVALID_FULL_NAME = 'INVALID_FULL_NAME',
  INVALID_NAME = 'INVALID_NAME',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN',
  INVALID_EMAIL_VERIFICATION_TOKEN = 'INVALID_EMAIL_VERIFICATION_TOKEN',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  INVALID_TWO_FACTOR_CODE = 'INVALID_TWO_FACTOR_CODE',
}

type MappedHttpException =
  | BadRequestException
  | ConflictException
  | ForbiddenException
  | UnauthorizedException
  | InternalServerErrorException
  | HttpException;

const ERROR_EXCEPTION_MAP: Partial<
  Record<
    AuthErrorCode,
    [
      (
        | typeof BadRequestException
        | typeof ConflictException
        | typeof ForbiddenException
        | typeof UnauthorizedException
      ),
      string,
    ]
  >
> = {
  [AuthErrorCode.EMAIL_ALREADY_REGISTERED]: [ConflictException, 'Email already registered'],
  [AuthErrorCode.EMAIL_TAKEN]: [ConflictException, 'Email already registered'],
  [AuthErrorCode.INVALID_FULL_NAME]: [BadRequestException, 'First and last name are required'],
  [AuthErrorCode.INVALID_NAME]: [BadRequestException, 'First and last name are required'],
  [AuthErrorCode.INVALID_CREDENTIALS]: [UnauthorizedException, 'Invalid email or password'],
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: [
    ForbiddenException,
    'Email address must be verified before login',
  ],
  [AuthErrorCode.WEAK_PASSWORD]: [
    BadRequestException,
    'Password must be at least 12 characters and include uppercase, lowercase, number and symbol',
  ],
  [AuthErrorCode.INVALID_RESET_TOKEN]: [BadRequestException, 'Invalid or expired reset token'],
  [AuthErrorCode.INVALID_EMAIL_VERIFICATION_TOKEN]: [
    BadRequestException,
    'Invalid or expired email verification token',
  ],
};

export class AuthErrorMapper {
  static mapToHttpException(error: unknown): MappedHttpException {
    if (error instanceof HttpException) return error;
    if (!(error instanceof Error)) {
      return new InternalServerErrorException('An unexpected error occurred');
    }

    const errorMessage = error.message as AuthErrorCode;
    if (errorMessage === AuthErrorCode.ACCOUNT_LOCKED) {
      return new HttpException('Account temporarily locked, try later', 423);
    }
    if (errorMessage === AuthErrorCode.TWO_FACTOR_REQUIRED) {
      return new HttpException('Two-factor authentication code required', 428);
    }
    if (errorMessage === AuthErrorCode.INVALID_TWO_FACTOR_CODE) {
      return new UnauthorizedException('Invalid two-factor authentication code');
    }

    const mapped = ERROR_EXCEPTION_MAP[errorMessage];
    const [ExceptionClass, message] = mapped || [InternalServerErrorException, error.message];

    return new ExceptionClass(message);
  }
}
