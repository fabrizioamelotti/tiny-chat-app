import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './chat.dto';
import { ChatResponse, ClearChatResponse } from './chat.response';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({
    description: 'Get message from AI',
    summary: 'Call the AI to get message from AI',
  })
  @ApiOkResponse({
    type: ChatResponse,
  })
  @Post()
  async getMessage(@Body() body: ChatDto): Promise<ChatResponse> {
    return this.chatService.getReply(body);
  }

  @ApiOperation({
    description: 'Clear one conversation session from memory',
    summary: 'Clear chat session',
  })
  @ApiOkResponse({
    type: ClearChatResponse,
  })
  @Delete(':sessionId')
  clearChat(@Param('sessionId') sessionId: string): ClearChatResponse {
    return this.chatService.clearSession(sessionId);
  }
}
