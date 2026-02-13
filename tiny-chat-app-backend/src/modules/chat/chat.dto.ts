import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { CHAT_MESSAGE_LENGTH } from './chat.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiPropertyOptional({
    description:
      'Session id to keep conversation context in memory. If omitted, "default" is used.',
    example: 'user-1',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({
    description: 'Message from the chat',
    example: 'Hello from the chat',
    type: String,
    minLength: CHAT_MESSAGE_LENGTH.MIN,
    maxLength: CHAT_MESSAGE_LENGTH.MAX,
  })
  @IsString()
  @Length(CHAT_MESSAGE_LENGTH.MIN, CHAT_MESSAGE_LENGTH.MAX)
  message!: string;

  @ApiPropertyOptional({
    description: 'Additional system instruction (optional).',
    example: 'Answer in short bullets',
    type: String,
  })
  @IsOptional()
  @IsString()
  systemInstruction?: string;

  @ApiPropertyOptional({
    description:
      'Enable/disable RAG from local files under ./rag (defaults from env AI_ENABLE_RAG).',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  useRag?: boolean;

  @ApiPropertyOptional({
    description:
      'Enable/disable web search (defaults from env AI_ENABLE_WEB_SEARCH).',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  useWebSearch?: boolean;
}
