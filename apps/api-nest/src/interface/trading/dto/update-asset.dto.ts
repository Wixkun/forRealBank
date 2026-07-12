import { IsBoolean } from 'class-validator';

export class UpdateMarketAssetDto {
  @IsBoolean()
  isTradable!: boolean;
}
