import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Authentication error codes
 * Enumeration of all possible authentication-related errors
 * @enum AuthErrorCode
 */
export enum AuthErrorCode {
  /** Email address is already registered in the system */
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  /** Email address is already taken */
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  /** Full name (first and last) is invalid or missing */
  INVALID_FULL_NAME = 'INVALID_FULL_NAME',
  /** Name field is invalid or missing */
  INVALID_NAME = 'INVALID_NAME',
  /** Email or password credentials are invalid */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
}

type HttpException = BadRequestException | ConflictException | UnauthorizedException | InternalServerErrorException;

const ERROR_EXCEPTION_MAP: Record<AuthErrorCode, [typeof BadRequestException | typeof ConflictException | typeof UnauthorizedException, string]> = {
  [AuthErrorCode.EMAIL_ALREADY_REGISTERED]: [ConflictException, 'Email already registered'],
  [AuthErrorCode.EMAIL_TAKEN]: [ConflictException, 'Email already registered'],
  [AuthErrorCode.INVALID_FULL_NAME]: [BadRequestException, 'First and last name are required'],
  [AuthErrorCode.INVALID_NAME]: [BadRequestException, 'First and last name are required'],
  [AuthErrorCode.INVALID_CREDENTIALS]: [UnauthorizedException, 'Invalid email or password'],
};

/**
 * Authentication Error Mapper
 * Centralizes mapping of domain authentication errors to HTTP exceptions
 * Ensures consistent error responses across all authentication endpoints
 * @class AuthErrorMapper
 */
export class AuthErrorMapper {
  /**
   * Map a domain error to a corresponding HTTP exception
   * Unknown errors are mapped to InternalServerErrorException
   * @param error - The error to map (can be any type)
   * @returns Appropriate NestJS HTTP exception instance
   */
  static mapToHttpException(error: unknown): HttpException {
    if (!(error instanceof Error)) {
      return new InternalServerErrorException('An unexpected error occurred');
    }

    const errorMessage = error.message as AuthErrorCode;
    const [ExceptionClass, message] = ERROR_EXCEPTION_MAP[errorMessage] || [InternalServerErrorException, error.message];

    return new ExceptionClass(message);
  }
}
