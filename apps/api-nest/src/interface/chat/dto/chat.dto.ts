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

// Limite haute de taille d'un message : borne les payloads (mémoire / abus).
const MAX_MESSAGE_LENGTH = 4000;

export class OpenPrivateConversationDto {
  @IsUUID()
  targetUserId!: string;
}

export class SendMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_MESSAGE_LENGTH)
  content!: string;
}

export class LinkAdvisorClientDto {
  @IsUUID()
  advisorId!: string;

  @IsUUID()
  clientId!: string;
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
