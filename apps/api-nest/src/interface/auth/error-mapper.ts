import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

export enum AuthErrorCode {
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  INVALID_FULL_NAME = 'INVALID_FULL_NAME',
  INVALID_NAME = 'INVALID_NAME',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
}

type HttpException =
  | BadRequestException
  | ConflictException
  | UnauthorizedException
  | InternalServerErrorException;

const ERROR_EXCEPTION_MAP: Record<
  AuthErrorCode,
  [typeof BadRequestException | typeof ConflictException | typeof UnauthorizedException, string]
> = {
  [AuthErrorCode.EMAIL_ALREADY_REGISTERED]: [ConflictException, 'Email already registered'],
  [AuthErrorCode.EMAIL_TAKEN]: [ConflictException, 'Email already registered'],
  [AuthErrorCode.INVALID_FULL_NAME]: [BadRequestException, 'First and last name are required'],
  [AuthErrorCode.INVALID_NAME]: [BadRequestException, 'First and last name are required'],
  [AuthErrorCode.INVALID_CREDENTIALS]: [UnauthorizedException, 'Invalid email or password'],
};

export class AuthErrorMapper {
  static mapToHttpException(error: unknown): HttpException {
    if (!(error instanceof Error)) {
      return new InternalServerErrorException('An unexpected error occurred');
    }

    const errorMessage = error.message as AuthErrorCode;
    const [ExceptionClass, message] = ERROR_EXCEPTION_MAP[errorMessage] || [
      InternalServerErrorException,
      error.message,
    ];

    return new ExceptionClass(message);
  }
}
