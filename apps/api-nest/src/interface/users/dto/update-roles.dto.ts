import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { RoleName } from '@forreal/domain/user/RoleName';

export class UpdateRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RoleName, { each: true })
  roles!: RoleName[];
}
