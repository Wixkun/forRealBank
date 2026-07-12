import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBeneficiaryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  // Longueur permissive : l'IBAN saisi peut contenir des espaces, la
  // normalisation et la validation stricte sont faites par le service.
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  iban!: string;
}

// Seul le libellé est modifiable : changer l'IBAN équivaut à un autre
// bénéficiaire (supprimer + recréer).
export class UpdateBeneficiaryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;
}
