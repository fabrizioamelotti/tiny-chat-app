import { ChatRole } from '@/src/components/chat-box/chat.constants'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
}
