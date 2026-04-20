import { ref, reactive } from 'vue'

export interface MsgButton { label: string; action: string }
export interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  buttons?: MsgButton[]
  tool?: string
  _btnsVisible: boolean
}

export interface ChatSession {
  id: string
  title: string
  elementId?: string // bound element id, if any
  messages: ChatMessage[]
  createdAt: Date
}

// Global reactive state
export const sessions = ref<ChatSession[]>([])
export const activeSessionId = ref<string | null>(null)
export const floatingOpen = ref(false)

const STORAGE_KEY = 'ai-chat-sessions'

export function getActiveSession(): ChatSession | null {
  return sessions.value.find(s => s.id === activeSessionId.value) || null
}

export function createSession(elementId?: string): ChatSession {
  const session: ChatSession = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    title: elementId ? '元素调整' : '新对话',
    elementId,
    messages: [],
    createdAt: new Date(),
  }
  sessions.value.unshift(session)
  activeSessionId.value = session.id
  floatingOpen.value = true
  // Don't save yet — only save when first message is added
  return session
}

export function openSession(id: string) {
  activeSessionId.value = id
  floatingOpen.value = true
}

export function closeFloating() {
  floatingOpen.value = false
}

export function updateSessionTitle(id: string, title: string) {
  const s = sessions.value.find(s => s.id === id)
  if (s) {
    s.title = title
    saveSessions()
  }
}

export function addMessageToSession(sessionId: string, msg: Omit<ChatMessage, 'id' | 'timestamp' | '_btnsVisible'>) {
  const session = sessions.value.find(s => s.id === sessionId)
  if (!session) return
  session.messages.push({
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    timestamp: new Date(),
    _btnsVisible: msg.type === 'user',
    ...msg,
  })
  // Auto-title from first user message
  if (session.title === '新对话' || session.title === '元素调整') {
    const firstUser = session.messages.find(m => m.type === 'user')
    if (firstUser) {
      session.title = firstUser.content.slice(0, 20) + (firstUser.content.length > 20 ? '...' : '')
    }
  }
  saveSessions()
}

export function saveSessions() {
  try {
    const data = sessions.value.map(s => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      messages: s.messages.map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
    }))
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  catch {}
}

export function restoreSessions() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    sessions.value = data.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      messages: s.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        _btnsVisible: true,
      })),
    }))
  }
  catch {}
}
