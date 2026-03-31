import {
  BadRequestException,
  ConflictException,
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
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
}

type MappedHttpException =
  | BadRequestException
  | ConflictException
  | UnauthorizedException
  | InternalServerErrorException
  | HttpException;

const ERROR_EXCEPTION_MAP: Partial<
  Record<
    AuthErrorCode,
    [typeof BadRequestException | typeof ConflictException | typeof UnauthorizedException, string]
  >
> = {
  [AuthErrorCode.EMAIL_ALREADY_REGISTERED]: [ConflictException, 'Email already registered'],
  [AuthErrorCode.EMAIL_TAKEN]: [ConflictException, 'Email already registered'],
  [AuthErrorCode.INVALID_FULL_NAME]: [BadRequestException, 'First and last name are required'],
  [AuthErrorCode.INVALID_NAME]: [BadRequestException, 'First and last name are required'],
  [AuthErrorCode.INVALID_CREDENTIALS]: [UnauthorizedException, 'Invalid email or password'],
  [AuthErrorCode.WEAK_PASSWORD]: [
    BadRequestException,
    'Password must be at least 12 characters and include uppercase, lowercase, number and symbol',
  ],
};

export class AuthErrorMapper {
  static mapToHttpException(error: unknown): MappedHttpException {
    if (!(error instanceof Error)) {
      return new InternalServerErrorException('An unexpected error occurred');
    }

    const errorMessage = error.message as AuthErrorCode;
    if (errorMessage === AuthErrorCode.ACCOUNT_LOCKED) {
      // 423 Locked = "compte temporairement verrouillé"
      return new HttpException('Account temporarily locked, try later', 423);
    }

    const mapped = ERROR_EXCEPTION_MAP[errorMessage];
    const [ExceptionClass, message] = mapped || [InternalServerErrorException, error.message];

    return new ExceptionClass(message);
  }
}
