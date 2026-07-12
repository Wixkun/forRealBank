import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(12)
  months: number = 6;
}
