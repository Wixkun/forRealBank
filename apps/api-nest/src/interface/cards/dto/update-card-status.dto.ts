import { IsIn } from 'class-validator';

export class UpdateCardStatusDto {
  @IsIn(['active', 'frozen', 'cancelled'])
  status!: 'active' | 'frozen' | 'cancelled';
}
