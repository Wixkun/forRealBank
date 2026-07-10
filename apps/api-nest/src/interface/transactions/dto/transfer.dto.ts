import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class TransferDto {
  @IsIn(['bank', 'investment'])
  sourceType!: 'bank' | 'investment';

  @IsUUID()
  sourceAccountId!: string;

  // Destination : soit un compte interne (UUID), soit un IBAN externe.
  @ValidateIf((o: TransferDto) => !o.destinationIban)
  @IsUUID()
  destinationAccountId?: string;

  @ValidateIf((o: TransferDto) => !o.destinationAccountId)
  @IsString()
  @MaxLength(34)
  destinationIban?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  @Max(1_000_000_000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;
}
