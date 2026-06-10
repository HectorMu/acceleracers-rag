import { useState, useCallback, useEffect } from 'react'
import type { Message } from './useChatStream.js'

export interface Conversation {
  id: string
  title: string
  createdAt: number
  messages: Message[]
}

const STORAGE_KEY = 'acceleracers_convos'
const MAX_CONVOS = 50

let idCounter = 0
function genId(): string {
  return `${Date.now()}-${++idCounter}`
}

function load(): Conversation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function save(convos: Conversation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convos.slice(-MAX_CONVOS))) } catch {}
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => load())
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    save(conversations)
  }, [conversations])

  const activeConversation = conversations.find(c => c.id === activeId) || null

  const createConversation = useCallback(() => {
    const id = genId()
    const newConvo: Conversation = { id, title: 'New chat', createdAt: Date.now(), messages: [] }
    setConversations(prev => [newConvo, ...prev])
    setActiveId(id)
    return id
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    setActiveId(prev => prev === id ? null : prev)
  }, [])

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c))
  }, [])

  const addMessage = useCallback((id: string, message: Message) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== id) return c
      const messages = [...c.messages, message]
      const title = c.messages.length === 0 && message.role === 'user'
        ? message.content.slice(0, 60)
        : c.title
      return { ...c, messages, title }
    }))
  }, [])

  const updateLastMessage = useCallback((id: string, content: string, sources?: Message['sources']) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== id || c.messages.length === 0) return c
      const messages = [...c.messages]
      const last = { ...messages[messages.length - 1], content, sources }
      messages[messages.length - 1] = last
      return { ...c, messages }
    }))
  }, [])

  const switchConversation = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  return {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    addMessage,
    updateLastMessage,
    switchConversation,
  }
}
