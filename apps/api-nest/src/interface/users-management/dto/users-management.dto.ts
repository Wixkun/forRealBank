import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class DirectoryQueryDto {
  @IsIn(['ADVISOR', 'CLIENT'])
  role!: 'ADVISOR' | 'CLIENT';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class TransactionsRangeQueryDto {
  // Dates au format YYYY-MM-DD (bornes de période inclusives).
  @IsOptional()
  @IsString()
  @MaxLength(10)
  from?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  to?: string;
}

export class ReassignAdvisorDto {
  @IsUUID()
  advisorId!: string;
}

export class BanRequestAttachmentDto {
  @IsString()
  @MaxLength(300)
  url!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsInt()
  @Min(0)
  size!: number;

  @IsString()
  @MaxLength(100)
  mimeType!: string;
}

export class CreateBanRequestDto {
  @IsUUID()
  clientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => BanRequestAttachmentDto)
  attachments?: BanRequestAttachmentDto[];
}

export class RejectBanRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
