import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class OpenPrivateConversationDto {
  @IsUUID()
  targetUserId!: string;
}

export class UpdateConversationStateDto {
  @IsUUID()
  lastReadMessageId!: string;
}

export class MuteConversationDto {
  @IsOptional()
  @IsString()
  mutedUntil?: string;
}

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  // Au moins 2 autres participants (le créateur est ajouté d'office).
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(49)
  @IsUUID('all', { each: true })
  participantIds!: string[];
}
