import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max } from 'class-validator';

export class CreateTradingOrderDto {
  @IsUUID()
  accountId!: string;

  @IsString()
  symbol!: string;

  @IsEnum(['buy', 'sell'])
  side!: 'buy' | 'sell';

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  @Max(1_000_000)
  quantity!: number;

  @IsEnum(['market', 'limit', 'stop'])
  orderType!: 'market' | 'limit' | 'stop';

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;
}
