'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import BackendApiProvider from '@/src/sdk/backend-provider/backend-provider'
import styles from './chat-box.module.css'
import { IChatDto, IChatResponse } from '@/src/sdk/backend'
import { ChatRole } from '@/src/components/chat-box/chat.constants'
import { ChatMessage } from '@/src/components/chat-box/chat.type'
import { generateUUIDChatMessage } from '@/src/components/chat-box/chat-box.utils'

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [value, setValue] = useState<string>('')
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [useRag, setUseRag] = useState<boolean>(false)
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  const trimmed = useMemo(() => value.trim(), [value])
  const canSend = trimmed.length > 0 && !isTyping

  // Auto-scroll to the newest message / typing indicator
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isTyping])

  // Keep value focused when the component mounts
  useEffect(() => {
    focusInput()
  }, [])

  function focusInput() {
    inputRef.current?.focus()
  }

  async function sendMessage() {
    if (!trimmed) {
      setError('Message cannot be empty')
      focusInput()
      return
    }

    setError(null)
    setIsTyping(true)

    const userMsg: ChatMessage = {
      id: generateUUIDChatMessage(),
      role: ChatRole.USER,
      text: trimmed,
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const chatDto: IChatDto = {
        message: trimmed,
        useRag,
        useWebSearch,
      }
      const axiosResponse = await BackendApiProvider.chatApi.getMessage({
        iChatDto: chatDto,
      })

      const data: IChatResponse = axiosResponse.data

      const botMsg: ChatMessage = {
        id: generateUUIDChatMessage(),
        role: ChatRole.BOT,
        text: data.reply,
      }
      setMessages((prev) => [...prev, botMsg])

      // Clear & refocus value
      setValue('')
    } catch {
      setError('Connection lost, please retry')
    } finally {
      setIsTyping(false)

      // Use rAF so focus happens after React flushes updates
      requestAnimationFrame(() => focusInput())
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>Tiny Chat Application</div>

      <div className={styles.messages} aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.row} ${message.role === ChatRole.USER ? styles.rowUser : styles.rowBot}`}
          >
            <div
              className={`${styles.bubble} ${message.role === ChatRole.USER ? styles.userBubble : styles.botBubble}`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.row} ${styles.rowBot}`}>
            <div className={`${styles.bubble} ${styles.typingBubble}`}>
              Typing...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.options}>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={useRag}
            onChange={(e) => setUseRag(e.target.checked)}
            disabled={isTyping}
          />
          Use RAG
        </label>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={useWebSearch}
            onChange={(e) => setUseWebSearch(e.target.checked)}
            disabled={isTyping}
          />
          Use Web Search
        </label>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSend) {
            void sendMessage()
          }
        }}
        className={styles.form}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) {
              setError(null)
            }
          }}
          placeholder={'Type a message...'}
          className={styles.input}
          aria-label={'Message'}
          disabled={isTyping}
          maxLength={4096}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (canSend) {
                void sendMessage()
              }
            }
          }}
        />
        <button type="submit" className={styles.button} disabled={!canSend}>
          Send
        </button>
      </form>
    </div>
  )
}
