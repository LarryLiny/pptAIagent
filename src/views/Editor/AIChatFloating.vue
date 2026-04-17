<template>
  <div v-if="floatingOpen && activeSession" class="floating-backdrop" @mousedown.self="closeFloating">
    <div
      class="floating-chat"
      :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
      ref="chatRef"
    >
      <!-- Drag handle / header -->
      <div class="float-header" @mousedown="startDrag">
        <div class="float-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>{{ activeSession.title }}</span>
        </div>
        <div class="float-close" @click="closeFloating" @mousedown.stop>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
      </div>

      <!-- Messages -->
      <div class="float-messages" ref="messagesRef">
        <div class="welcome-msg" v-if="!activeSession.messages.length">
          <div class="welcome-text">有什么需要帮忙的？</div>
        </div>
        <div
          v-for="msg in activeSession.messages"
          :key="msg.id"
          class="msg-row"
          :class="{ 'msg-user': msg.type === 'user', 'msg-ai': msg.type === 'ai' }"
        >
          <div class="msg-bubble" :class="msg.type">
            <div class="msg-text" v-if="msg.content">
              <TypeWriter :text="msg.content" :animate="msg.type === 'ai'" :key="msg.id + msg.content.length" @complete="msg._btnsVisible = true" />
            </div>
            <div class="msg-thinking" v-else-if="msg.type === 'ai'">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
          <div class="msg-actions" v-if="msg._btnsVisible && msg.buttons?.length">
            <button v-for="(btn, i) in msg.buttons" :key="i" class="action-btn" @click="handleButton(btn.action, msg.content)">{{ btn.label }}</button>
          </div>
        </div>
      </div>

      <!-- Tools bar -->
      <div class="float-tools">
        <div class="tool-dropdown-wrap" @mouseenter="openToolMenu" @mouseleave="closeToolMenuDelay">
          <button class="tool-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            工具
          </button>
          <div class="tool-menu" v-if="toolMenuOpen" @mouseenter="openToolMenu" @mouseleave="closeToolMenuDelay">
            <div v-for="t in toolList" :key="t" class="tool-item" @click="selectTool(t)">{{ t }}</div>
          </div>
        </div>
        <div class="tool-tag" v-if="currentTool">
          {{ currentTool }}
          <span class="tag-x" @click="currentTool = null">×</span>
        </div>
        <div class="bound-hint" v-if="activeSession.elementId">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          绑定元素
        </div>
      </div>

      <!-- Input -->
      <div class="float-input">
        <input
          v-model="inputText"
          @keydown.enter="send"
          :placeholder="currentTool ? `输入需求，${currentTool}...` : '输入消息...'"
          class="input-field"
          ref="inputRef"
        />
        <button
          class="mic-btn"
          :class="{ recording: isRecording }"
          @click="toggleVoice"
          v-if="hasSpeechRecognition"
        >
          <svg v-if="!isRecording" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        </button>
        <button class="send-btn" :disabled="!inputText.trim() || isStreaming" @click="send">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { nanoid } from 'nanoid'
import { useMainStore, useSlidesStore } from '@/store'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import TypeWriter from './TypeWriter.vue'
import { describeCurrentSlide, pptTools, executeTool } from './aiPptTools'
import {
  floatingOpen, activeSessionId, sessions,
  getActiveSession, addMessageToSession, saveSessions,
  closeFloating as closeFloat,
} from './aiChatStore'
import type { Slide, PPTTextElement } from '@/types/slides'

const LLM_API_URL = import.meta.env.DEV ? '/llm/v1/chat/completions' : 'https://modelproxy.unipus.cn/v1/chat/completions'
const LLM_API_KEY = 'sk-CUBymvpjvH47EGAca1tygKVCtIGBgvVFJwKWTfJxyv8yGK7A'
const LLM_MODEL = 'gpt-4o-mini'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { addSlidesFromData, addElementsFromData } = useAddSlidesOrElements()
const { addHistorySnapshot } = useHistorySnapshot()

const inputText = ref('')
const isStreaming = ref(false)
const messagesRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const chatRef = ref<HTMLElement>()
const toolMenuOpen = ref(false)
const currentTool = ref<string | null>(null)
let toolMenuTimer: ReturnType<typeof setTimeout> | null = null

const toolList = ['生成课堂引入', '搜索背景知识', '例题生成', '互动环节设计', '总结要点', '生成演讲稿']

const TOOL_PROMPTS: Record<string, string> = {
  '生成课堂引入': '请结合情境导入方式，设计一段适中难度的课堂引入',
  '搜索背景知识': '搜索简单难度的背景知识',
  '例题生成': '生成2题选择题，难度基础',
  '互动环节设计': '设计一个小组讨论互动环节，时长10分钟',
  '总结要点': '帮我总结全部课件的知识要点，格式：要点列表',
  '生成演讲稿': '请生成一份正式风格、5分钟的演讲稿',
}

// Voice recognition
const isRecording = ref(false)
const hasSpeechRecognition = ref(false)
let recognition: any = null

function initSpeechRecognition() {
  const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
  if (!SR) return
  hasSpeechRecognition.value = true
  recognition = new SR()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = true
  recognition.onresult = (e: any) => {
    inputText.value = Array.from(e.results).map((r: any) => r[0].transcript).join('')
  }
  recognition.onend = () => { isRecording.value = false }
  recognition.onerror = () => { isRecording.value = false }
}

function toggleVoice() {
  if (!recognition) return
  if (isRecording.value) { recognition.stop(); isRecording.value = false }
  else { recognition.start(); isRecording.value = true }
}

const activeSession = computed(() => getActiveSession())

// Dragging
const pos = ref({ x: Math.max(100, window.innerWidth - 520), y: 80 })

function startDrag(e: MouseEvent) {
  const startX = e.clientX - pos.value.x
  const startY = e.clientY - pos.value.y
  const onMove = (ev: MouseEvent) => {
    pos.value.x = Math.max(0, Math.min(window.innerWidth - 400, ev.clientX - startX))
    pos.value.y = Math.max(0, Math.min(window.innerHeight - 200, ev.clientY - startY))
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function closeFloating() { closeFloat() }

function openToolMenu() {
  if (toolMenuTimer) { clearTimeout(toolMenuTimer); toolMenuTimer = null }
  toolMenuOpen.value = true
}
function closeToolMenuDelay() {
  toolMenuTimer = setTimeout(() => { toolMenuOpen.value = false }, 150)
}
function selectTool(t: string) {
  currentTool.value = t
  toolMenuOpen.value = false
  inputText.value = TOOL_PROMPTS[t] || ''
  nextTick(() => inputRef.value?.focus())
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}

// LLM chat history per session
function buildChatHistory() {
  const session = activeSession.value
  if (!session) return []

  const systemPrompt = `你是"子言"，一个专业的PPT课件制作AI助手。你帮助老师搜索优质素材、修改课件内容、设计课堂活动、生成课堂引入、例题、演讲稿等。
你可以通过工具直接操作PPT：修改元素位置/尺寸/内容/样式、添加文字和图片、新建页面、删除元素、修改背景和备注。
画布尺寸固定为 1000×562 像素(16:9)。
当用户要求调整格式、排版、布局时，请使用工具直接操作，操作完成后简短告知用户做了什么。
回复要简洁。`

  const msgs: any[] = [{ role: 'system', content: systemPrompt }]
  for (const m of session.messages) {
    msgs.push({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })
  }
  return msgs
}

async function send() {
  if (!inputText.value.trim() || isStreaming.value || !activeSession.value) return
  const txt = inputText.value
  const sessionId = activeSession.value.id
  const tool = currentTool.value

  const userContent = tool ? `[工具: ${tool}] ${txt}` : txt
  addMessageToSession(sessionId, { type: 'user', content: userContent, tool: tool || undefined })
  inputText.value = ''
  currentTool.value = null
  scrollToBottom()

  // Add thinking placeholder
  const aiMsg = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    type: 'ai' as const,
    content: '',
    timestamp: new Date(),
    _btnsVisible: false,
  }
  const session = sessions.value.find(s => s.id === sessionId)
  if (!session) return
  session.messages.push(aiMsg)
  isStreaming.value = true
  scrollToBottom()

  try {
    const slideContext = describeCurrentSlide()
    const chatHistory = buildChatHistory()
    // Replace last user msg with enriched version
    chatHistory[chatHistory.length - 1] = {
      role: 'user',
      content: `[当前幻灯片]\n${slideContext}\n\n[用户请求]\n${userContent}`,
    }

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
      body: JSON.stringify({ model: LLM_MODEL, messages: chatHistory, tools: pptTools, tool_choice: 'auto' }),
    })

    if (!response.ok) {
      aiMsg.content = '服务暂时不可用，请稍后再试。'
      aiMsg._btnsVisible = true
      isStreaming.value = false
      saveSessions()
      return
    }

    const result = await response.json()
    const choice = result.choices?.[0]

    if (choice?.message?.tool_calls?.length) {
      const toolCalls = choice.message.tool_calls
      for (const tc of toolCalls) {
        let args: Record<string, any> = {}
        try { args = JSON.parse(tc.function.arguments) } catch {}
        executeTool(tc.function.name, args)
      }

      // Get summary
      const summaryMsgs = [...chatHistory, choice.message]
      for (const tc of toolCalls) {
        let args: Record<string, any> = {}
        try { args = JSON.parse(tc.function.arguments) } catch {}
        summaryMsgs.push({ role: 'tool', content: executeTool(tc.function.name, args), tool_call_id: tc.id })
      }

      const summaryResp = await fetch(LLM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
        body: JSON.stringify({ model: LLM_MODEL, messages: summaryMsgs, stream: true }),
      })

      if (summaryResp.ok) {
        await streamInto(summaryResp, aiMsg)
      }
      else {
        aiMsg.content = '已按照您的要求调整。'
      }
      aiMsg.buttons = [{ label: '撤销', action: 'undo' }]
    }
    else {
      aiMsg.content = choice?.message?.content || ''
      aiMsg.buttons = [
        { label: '插入当前页', action: 'insert' },
        { label: '新建页插入', action: 'agree' },
      ]
    }
  }
  catch {
    aiMsg.content = '网络错误，请重试。'
  }
  finally {
    aiMsg._btnsVisible = true
    isStreaming.value = false
    scrollToBottom()
    saveSessions()
  }
}

async function streamInto(response: Response, aiMsg: any) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let full = ''
  if (!reader) return
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content
        if (delta) { full += delta; aiMsg.content = full; scrollToBottom() }
      } catch {}
    }
  }
}

// Insert helpers (simplified)
function mdBodyToHtml(md: string, fontSize: number): string {
  return md.split('\n').filter(l => l.trim()).map(line => {
    let t = line.trim()
      .replace(/^#{2,3}\s+(.+)/, `<span style="font-size:${fontSize+2}px;font-weight:bold;color:#1a1a2e;">$1</span>`)
      .replace(/^[-*+]\s+(.+)/, `<span style="font-size:${fontSize}px;color:#333;">• $1</span>`)
    if (!t.startsWith('<span')) t = `<span style="font-size:${fontSize}px;color:#333;">${t}</span>`
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
    return `<p style="text-align:left;">${t}</p>`
  }).join('')
}

function buildSlideElements(content: string): PPTTextElement[] {
  const lines = content.split('\n').filter(l => l.trim())
  const firstLine = lines[0] || ''
  const hMatch = firstLine.match(/^#{1,2}\s+(.+)/)
  const title = hMatch ? hMatch[1].replace(/\*\*/g, '') : (firstLine.length < 50 && lines.length > 1 ? firstLine.replace(/^[#*\s]+/, '') : '')
  const body = title ? lines.slice(1).join('\n').trim() : content.trim()
  const els: PPTTextElement[] = []
  const W = 880, MX = 60, MT = 50

  if (title) {
    els.push({ type: 'text', id: nanoid(10), left: MX, top: MT, width: W, height: 52, rotate: 0,
      content: `<p style="text-align:left;"><span style="font-size:28px;font-weight:bold;color:#1a1a2e;">${title}</span></p>`,
      defaultFontName: '', defaultColor: '#1a1a2e', lineHeight: 1.3, fill: '', outline: { color: '', width: 0, style: 'solid' } })
  }
  if (body) {
    const fs = body.length < 200 ? 16 : body.length < 400 ? 15 : 14
    const top = title ? MT + 68 : MT
    const h = 562 - top - 36
    els.push({ type: 'text', id: nanoid(10), left: MX, top, width: W, height: h, rotate: 0,
      content: mdBodyToHtml(body, fs),
      defaultFontName: '', defaultColor: '#333', lineHeight: 1.6, paragraphSpace: 4, fill: '', outline: { color: '', width: 0, style: 'solid' } })
  }
  return els
}

function handleButton(action: string, content: string) {
  if (action === 'undo') {
    // Trigger PPTist undo via keyboard shortcut simulation
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
    return
  }
  if (action === 'insert') {
    const els = buildSlideElements(content)
    for (const el of els) addElementsFromData([el])
  }
  else if (action === 'agree') {
    const els = buildSlideElements(content)
    addSlidesFromData([{ id: nanoid(10), elements: els, background: { type: 'solid', color: '#fff' } }])
  }
}

// Check for pending message from sidebar
watch(floatingOpen, (open) => {
  if (open) {
    nextTick(() => {
      inputRef.value?.focus()
      scrollToBottom()
      // Check pending message
      const pending = sessionStorage.getItem('ai-pending-msg')
      if (pending) {
        sessionStorage.removeItem('ai-pending-msg')
        const { sessionId, text } = JSON.parse(pending)
        if (sessionId === activeSessionId.value) {
          inputText.value = text
          nextTick(() => send())
        }
      }
    })
  }
})

onMounted(() => {
  pos.value.x = Math.max(100, window.innerWidth - 520)
  initSpeechRecognition()
})
</script>

<style lang="scss" scoped>
.floating-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
}
.floating-chat {
  pointer-events: all;
  position: absolute;
  width: 400px; max-height: 680px;
  background: #fff; border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.float-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: linear-gradient(135deg, #f5f3ff, #eff6ff);
  cursor: move; user-select: none; flex-shrink: 0;
  border-bottom: 1px solid #e5e7eb;

  .float-title {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 500; color: #333;
  }
  .float-close {
    cursor: pointer; color: #999; display: flex; padding: 2px;
    &:hover { color: #333; }
  }
}

.float-messages {
  flex: 1; overflow-y: auto; padding: 12px; min-height: 120px; max-height: 480px;

  .welcome-msg {
    text-align: center; padding: 30px 0;
    .welcome-text { color: #9ca3af; font-size: 13px; }
  }

  .msg-row { margin-bottom: 10px; }
  .msg-user { display: flex; flex-direction: column; align-items: flex-end; }
  .msg-ai { display: flex; flex-direction: column; align-items: flex-start; }

  .msg-bubble {
    border-radius: 10px; padding: 8px 12px; max-width: 90%; word-break: break-word;
    &.user { background: #3b82f6; color: #fff; font-size: 12.5px; }
    &.ai { background: #f3f4f6; color: #111; font-size: 12.5px; }
  }
  .msg-text { line-height: 1.5; }
  .msg-thinking {
    display: flex; gap: 4px; padding: 4px 0;
    .dot {
      width: 5px; height: 5px; border-radius: 50%; background: #9ca3af;
      animation: bounce 1.4s infinite ease-in-out both;
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
  @keyframes bounce {
    0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  .msg-actions {
    display: flex; gap: 6px; margin-top: 6px;
  }
  .action-btn {
    padding: 3px 10px; background: #fff; border: 1px solid #d1d5db;
    border-radius: 6px; font-size: 11px; color: #374151; cursor: pointer;
    &:hover { background: #f9fafb; border-color: #9ca3af; }
  }
}

.float-tools {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-top: 1px solid #f0f0f0;
  flex-shrink: 0;

  .tool-chip {
    display: flex; align-items: center; gap: 3px;
    padding: 3px 8px; border: 1px solid #d1d5db; border-radius: 4px;
    font-size: 11px; color: #6b7280; background: #fff; cursor: pointer;
    &:hover { background: #f3f4f6; }
  }
  .tool-tag {
    display: flex; align-items: center; gap: 3px;
    padding: 2px 8px; background: #f5f3ff; border: 1px solid #ddd6fe;
    border-radius: 10px; font-size: 10px; color: #7c3aed;
    .tag-x { cursor: pointer; &:hover { color: #5b21b6; } }
  }
  .bound-hint {
    display: flex; align-items: center; gap: 3px;
    font-size: 10px; color: #8b5cf6; margin-left: auto;
  }
}

.tool-dropdown-wrap { position: relative; }
.tool-menu {
  position: absolute; bottom: calc(100% + 4px); left: 0;
  width: 140px; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden; z-index: 10;
  padding-bottom: 0;

  &::after {
    content: ''; position: absolute; bottom: -6px; left: 0;
    width: 100%; height: 6px;
  }
}
.tool-item {
  padding: 6px 10px; font-size: 12px; color: #374151; cursor: pointer;
  &:hover { background: #f3f4f6; }
}

.float-input {
  display: flex; gap: 6px; padding: 10px 14px;
  border-top: 1px solid #e5e7eb; flex-shrink: 0;

  .input-field {
    flex: 1; height: 34px; padding: 0 10px;
    border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 12px; outline: none;
    &:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.15); }
  }
  .send-btn {
    width: 34px; height: 34px; border-radius: 6px;
    background: #8b5cf6; color: #fff; border: none;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
    &:hover { background: #7c3aed; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
  .mic-btn {
    width: 34px; height: 34px; border-radius: 6px;
    background: #fff; color: #6b7280; border: 1px solid #d1d5db;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
    &:hover { background: #f3f4f6; }
    &.recording {
      background: #ef4444; color: #fff; border-color: #ef4444;
      animation: mic-pulse 1.5s infinite;
    }
  }
  @keyframes mic-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
    50% { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
  }
}
</style>
