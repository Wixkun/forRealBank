import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateCardSettingsDto {
  @IsOptional()
  @IsBoolean()
  onlinePaymentsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  contactlessEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  internationalPaymentsEnabled?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
  @Max(20000)
  spendingLimit?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(5000)
  withdrawalLimit?: number;
}
