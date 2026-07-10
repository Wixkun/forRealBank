import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { NewsStatus } from '@forreal/domain';

const NEWS_STATUS_VALUES = Object.values(NewsStatus);
const MAX_CONTENT_LENGTH = 20000;

// Création manuelle d'une actualité (multipart : les fichiers sont traités à
// part par l'intercepteur, le corps ne contient que les champs texte).
export class CreateNewsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CONTENT_LENGTH)
  content!: string;

  @IsOptional()
  @IsIn(NEWS_STATUS_VALUES)
  status?: NewsStatus;
}

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CONTENT_LENGTH)
  content?: string;
}
