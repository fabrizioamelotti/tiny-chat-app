import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiChatResult, AiService } from '../ai/ai.service';
import { ChatDto } from './chat.dto';
import { ChatResponse, ClearChatResponse } from './chat.response';

type AiConfig = { enabled: boolean };

@Injectable()
export class ChatService {
  constructor(
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  async getReply(body: ChatDto): Promise<ChatResponse> {
    const ai = this.configService.get<AiConfig>('ai') as AiConfig;

    if (!ai?.enabled) {
      return {
        reply: `Bot: ${body.message}`,
      };
    }

    const result: AiChatResult = await this.aiService.chat({
      sessionId: body.sessionId ?? 'default',
      message: body.message,
      systemInstruction: body.systemInstruction,
      useRag: body.useRag,
      useWebSearch: body.useWebSearch,
    });

    return {
      sessionId: result.sessionId,
      model: result.model,
      reply: result.reply,
      messagesInMemory: result.messagesInMemory,
      ragSources: result.ragSources,
      webSources: result.webSources,
    };
  }

  clearSession(sessionId: string): ClearChatResponse {
    const cleared = this.aiService.clearSession(sessionId);
    return { sessionId, cleared };
  }
}
