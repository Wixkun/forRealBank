import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  twoFactorCode?: string;
}
