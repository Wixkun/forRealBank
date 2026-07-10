import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

// Limite haute de taille d'un message : borne les payloads (mémoire / abus).
const MAX_MESSAGE_LENGTH = 4000;

export class CreateConversationDto {
  @IsIn(['PRIVATE', 'GROUP'])
  type!: 'PRIVATE' | 'GROUP';
}

export class SendMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_MESSAGE_LENGTH)
  content!: string;
}

export class AddParticipantDto {
  @IsUUID()
  userId!: string;
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
