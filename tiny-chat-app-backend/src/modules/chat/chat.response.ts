import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatResponse {
  @ApiPropertyOptional({
    description: 'Session id used for conversation memory.',
    example: 'user-1',
    type: String,
  })
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Model used to generate the reply (when AI is enabled).',
    example: 'Qwen/Qwen2.5-7B-Instruct',
    type: String,
  })
  model?: string;

  @ApiProperty({
    description: 'Reply from the server',
    example: 'This is a reply from the server',
    type: String,
  })
  reply!: string;

  @ApiPropertyOptional({
    description: 'Number of messages kept in memory for this session.',
    example: 2,
    type: Number,
  })
  messagesInMemory?: number;

  @ApiPropertyOptional({
    description: 'RAG sources used (if enabled and matched).',
    type: Array,
  })
  ragSources?: Array<{ source: string; line: number }>;

  @ApiPropertyOptional({
    description: 'Web search sources used (if enabled).',
    type: Array,
  })
  webSources?: Array<{ title: string; link: string; snippet: string }>;
}

export class ClearChatResponse {
  @ApiProperty({
    description: 'Session id that was requested to clear.',
    example: 'user-1',
    type: String,
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Whether the session existed and was removed.',
    example: true,
    type: Boolean,
  })
  cleared!: boolean;
}
