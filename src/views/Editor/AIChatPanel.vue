<template>
  <div class="ai-chat-panel" :style="{ width: panelWidth + 'px' }">
    <!-- Resize handle -->
    <div class="resize-handle" @mousedown="startResize"></div>

    <!-- Header -->
    <div class="panel-header">
      <div class="header-info">
        <div class="avatar">AI</div>
        <div class="header-text">
          <div class="name">子言助手</div>
          <div class="status">在线</div>
        </div>
      </div>
      <div class="close-btn" @click="closePanel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    </div>

    <!-- Messages -->
    <div class="messages" ref="messagesRef">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="msg-row"
        :class="{ 'msg-user': msg.type === 'user', 'msg-ai': msg.type === 'ai' }"
      >
        <div class="msg-bubble" :class="msg.type">
          <div class="msg-tool-tag" v-if="msg.tool">{{ msg.tool }}</div>
          <div class="msg-text">
            <TypeWriter :text="msg.content" :animate="msg.type === 'ai'" :key="msg.id + msg.content.length" @complete="msg._btnsVisible = true" />
          </div>
          <img v-if="msg.image" :src="msg.image" class="msg-image" />
        </div>
        <div class="msg-buttons" v-if="msg._btnsVisible && msg.buttons?.length">
          <button
            v-for="(btn, i) in msg.buttons"
            :key="i"
            class="msg-btn"
            @click="handleButton(btn.action)"
          >{{ btn.label }}</button>
        </div>
        <div class="msg-time">{{ formatTime(msg.timestamp) }}</div>
      </div>
    </div>

    <!-- Settings Panel -->
    <transition name="slide-up">
      <div class="settings-panel" v-if="showSettings && currentToolSettings">
        <div class="settings-header">
          <span class="settings-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {{ currentTool }} · 高级配置
          </span>
          <span class="settings-close" @click="showSettings = false">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
        </div>
        <div v-for="s in currentToolSettings" :key="s.key" class="setting-group">
          <div class="setting-label">{{ s.label }}</div>
          <div class="setting-options">
            <button
              v-for="o in s.options"
              :key="o"
              class="setting-opt"
              :class="{ active: settings[s.key] === o }"
              @click="updateSetting(s.key, o)"
            >{{ o }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="tool-btn" @click="fileInputRef?.click()" title="上传文件">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <div class="tool-dropdown" @mouseenter="toolMenuOpen = true" @mouseleave="toolMenuOpen = false">
          <button class="tool-btn with-text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            <span>工具</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="dropdown-menu" v-if="toolMenuOpen">
            <div
              v-for="t in toolList"
              :key="t"
              class="dropdown-item"
              @click="selectTool(t)"
            >
              <component :is="toolIconComponents[t]" />
              {{ t }}
            </div>
          </div>
        </div>
      </div>
      <div class="toolbar-right">
        <div class="help-dropdown">
          <button class="tool-btn with-text" @click="helpOpen = !helpOpen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>帮助</span>
          </button>
          <div class="help-menu" v-if="helpOpen">
            <div class="help-header">
              <span>示例问题</span>
              <span class="help-close" @click="helpOpen = false">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </span>
            </div>
            <div
              v-for="q in helpQuestions"
              :key="q"
              class="help-item"
              @click="inputText = q; helpOpen = false"
            >"{{ q }}"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tool Tag -->
    <div class="tool-tag-row" v-if="currentTool">
      <div class="tool-tag">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        {{ currentTool }}
        <span class="tag-close" @click="clearTool">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </span>
      </div>
      <button class="more-settings-btn" :class="{ active: showSettings }" @click="showSettings = !showSettings">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        更多设置
      </button>
    </div>

    <!-- Input -->
    <div class="input-area">
      <input
        v-model="inputText"
        @keydown.enter="send"
        :placeholder="currentTool ? `输入您的需求，${currentTool}...` : '输入消息...'"
        class="chat-input"
      />
      <button class="send-btn" :disabled="!inputText.trim() || isStreaming" @click="send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      @change="handleFileUpload"
      style="display: none"
      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted, onUnmounted, reactive, h } from 'vue'
import { nanoid } from 'nanoid'
import { useMainStore, useSlidesStore } from '@/store'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import TypeWriter from './TypeWriter.vue'
import type { Slide, PPTTextElement } from '@/types/slides'

const LLM_API_KEY = 'sk-CUBymvpjvH47EGAca1tygKVCtIGBgvVFJwKWTfJxyv8yGK7A'
const STORAGE_KEY_WIDTH = 'ai-chat-panel-width'

interface MsgButton { label: string; action: string }
interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  buttons?: MsgButton[]
  tool?: string
  image?: string
  _btnsVisible: boolean
}
interface SettingItem { key: string; label: string; options: string[] }

// SVG icon components (line style)
const iconLightbulb = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('path', { d: 'M9 18h6' }), h('path', { d: 'M10 22h4' }), h('path', { d: 'M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z' })])
const iconSearch = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('circle', { cx: 11, cy: 11, r: 8 }), h('line', { x1: 21, y1: 21, x2: '16.65', y2: '16.65' })])
const iconFileText = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('path', { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' }), h('polyline', { points: '14 2 14 8 20 8' }), h('line', { x1: 16, y1: 13, x2: 8, y2: 13 }), h('line', { x1: 16, y1: 17, x2: 8, y2: 17 })])
const iconUsers = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('path', { d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' }), h('circle', { cx: 9, cy: 7, r: 4 }), h('path', { d: 'M23 21v-2a4 4 0 00-3-3.87' }), h('path', { d: 'M16 3.13a4 4 0 010 7.75' })])
const iconList = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('line', { x1: 8, y1: 6, x2: 21, y2: 6 }), h('line', { x1: 8, y1: 12, x2: 21, y2: 12 }), h('line', { x1: 8, y1: 18, x2: 21, y2: 18 }), h('line', { x1: 3, y1: 6, x2: '3.01', y2: 6 }), h('line', { x1: 3, y1: 12, x2: '3.01', y2: 12 }), h('line', { x1: 3, y1: 18, x2: '3.01', y2: 18 })])
const iconMic = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('path', { d: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z' }), h('path', { d: 'M19 10v2a7 7 0 01-14 0v-2' }), h('line', { x1: 12, y1: 19, x2: 12, y2: 23 }), h('line', { x1: 8, y1: 23, x2: 16, y2: 23 })])

const toolIconComponents: Record<string, any> = {
  '生成课堂引入': iconLightbulb, '搜索背景知识': iconSearch, '例题生成': iconFileText,
  '互动环节设计': iconUsers, '总结要点': iconList, '生成演讲稿': iconMic,
}

const TOOL_SETTINGS: Record<string, SettingItem[]> = {
  '生成课堂引入': [
    { key: 'introType', label: '导入类型', options: ['情境导入', '问题导入', '案例导入', '时事导入'] },
    { key: 'difficulty', label: '难度', options: ['简单', '适中', '进阶'] },
  ],
  '搜索背景知识': [
    { key: 'sourceType', label: '资料来源', options: ['外研社素材库', '全网搜索', '学术资源'] },
    { key: 'difficulty', label: '内容难度', options: ['简单', '中等', '拔高'] },
  ],
  '例题生成': [
    { key: 'qtype', label: '题型', options: ['选择题', '填空题', '判断题', '简答题'] },
    { key: 'difficulty', label: '难度', options: ['基础', '中等', '拔高'] },
    { key: 'count', label: '数量', options: ['1题', '2题', '3题', '5题'] },
  ],
  '互动环节设计': [
    { key: 'form', label: '互动形式', options: ['小组讨论', '角色扮演', '辩论赛', '游戏竞赛'] },
    { key: 'duration', label: '时长', options: ['5分钟', '10分钟', '15分钟', '20分钟'] },
  ],
  '总结要点': [
    { key: 'scope', label: '总结范围', options: ['全部课件', '当前页', '选中内容'] },
    { key: 'format', label: '输出格式', options: ['要点列表', '思维导图', '表格对比'] },
  ],
  '生成演讲稿': [
    { key: 'style', label: '风格', options: ['正式', '轻松活泼', '互动式', '故事型'] },
    { key: 'duration', label: '时长', options: ['3分钟', '5分钟', '10分钟'] },
  ],
}

const toolList = ['生成课堂引入', '搜索背景知识', '例题生成', '互动环节设计', '总结要点', '生成演讲稿']
const helpQuestions = ['把这段文字难度调低', '再给我生成一页相似题', '给我找一些爱迪生的英文背景资料', '从俄乌冲突引入本节课要学的Russia这个单词']

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { addSlidesFromData, addElementsFromData } = useAddSlidesOrElements()
const { addHistorySnapshot } = useHistorySnapshot()

const lastAIContent = ref('')
const messages = ref<Message[]>([])
const inputText = ref('')
const currentTool = ref<string | null>(null)
const showSettings = ref(false)
const settings = reactive<Record<string, string>>({})
const toolMenuOpen = ref(false)
const helpOpen = ref(false)
const isStreaming = ref(false)
const messagesRef = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()
const currentToolSettings = ref<SettingItem[] | null>(null)

// Chat history for LLM context
const chatHistory = ref<{ role: string; content: string }[]>([
  { role: 'system', content: '你是"子言"，一个专业的课件制作AI助手。你帮助老师搜索优质素材、修改课件内容、设计课堂活动、生成课堂引入、例题、演讲稿等。回答要简洁实用，适合直接插入PPT。如果生成的内容适合插入PPT，请用「」包裹可插入的内容。' },
])

// Resizable panel width
const panelWidth = ref(parseInt(localStorage.getItem(STORAGE_KEY_WIDTH) || '320'))
const isResizing = ref(false)

function startResize(e: MouseEvent) {
  e.preventDefault()
  isResizing.value = true
  const startX = e.clientX
  const startWidth = panelWidth.value

  const onMouseMove = (ev: MouseEvent) => {
    const delta = startX - ev.clientX
    const newWidth = Math.max(260, Math.min(600, startWidth + delta))
    panelWidth.value = newWidth
  }
  const onMouseUp = () => {
    isResizing.value = false
    localStorage.setItem(STORAGE_KEY_WIDTH, panelWidth.value.toString())
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function addMsg(msg: Omit<Message, 'id' | 'timestamp' | '_btnsVisible'>) {
  messages.value.push({
    id: Date.now().toString() + Math.random(),
    timestamp: new Date(),
    _btnsVisible: msg.type === 'user',
    ...msg,
  })
  if (msg.type === 'ai' && msg.content) {
    const match = msg.content.match(/「([^」]+)」/)
    if (match) lastAIContent.value = match[1]
    else lastAIContent.value = msg.content
  }
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function buildPrompt(t: string, s: Record<string, string>): string {
  switch (t) {
    case '生成课堂引入': return `请结合${s.introType || '情境导入'}方式，设计一段${s.difficulty || '适中'}难度的课堂引入`
    case '搜索背景知识': return `搜索${s.difficulty || '简单'}难度的背景知识，来源：${s.sourceType || '外研社素材库'}`
    case '例题生成': return `生成${s.count || '2题'}${s.qtype || '选择题'}，难度${s.difficulty || '基础'}`
    case '互动环节设计': return `设计一个${s.form || '小组讨论'}互动环节，时长${s.duration || '10分钟'}`
    case '总结要点': return `帮我总结${s.scope || '全部课件'}的知识要点，格式：${s.format || '要点列表'}`
    case '生成演讲稿': return `请生成一份${s.style || '正式'}风格、${s.duration || '5分钟'}的演讲稿`
    default: return ''
  }
}

function selectTool(t: string) {
  currentTool.value = t
  toolMenuOpen.value = false
  showSettings.value = true
  currentToolSettings.value = TOOL_SETTINGS[t] || null
  const defs: Record<string, string> = {}
  TOOL_SETTINGS[t]?.forEach(s => { defs[s.key] = s.options[0] })
  Object.keys(settings).forEach(k => delete settings[k])
  Object.assign(settings, defs)
  inputText.value = buildPrompt(t, defs)
}

function clearTool() {
  currentTool.value = null
  showSettings.value = false
  currentToolSettings.value = null
  Object.keys(settings).forEach(k => delete settings[k])
}

function updateSetting(key: string, val: string) {
  settings[key] = val
  if (currentTool.value) inputText.value = buildPrompt(currentTool.value, settings)
}

function closePanel() {
  mainStore.setAIChatPanelState(false)
}

async function callLLM(userMessage: string): Promise<void> {
  chatHistory.value.push({ role: 'user', content: userMessage })

  const aiMsg: Message = {
    id: Date.now().toString() + Math.random(),
    type: 'ai',
    content: '',
    timestamp: new Date(),
    _btnsVisible: false,
  }
  messages.value.push(aiMsg)
  isStreaming.value = true

  try {
    const response = await fetch('/llm/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: chatHistory.value,
        stream: true,
      }),
    })

    if (!response.ok) {
      aiMsg.content = '抱歉，AI 服务暂时不可用，请稍后再试。'
      aiMsg._btnsVisible = true
      isStreaming.value = false
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              aiMsg.content = fullContent
              scrollToBottom()
            }
          }
          catch {}
        }
      }
    }

    chatHistory.value.push({ role: 'assistant', content: fullContent })

    // Extract insertable content
    const match = fullContent.match(/「([^」]+)」/)
    if (match) {
      lastAIContent.value = match[1]
      aiMsg.buttons = [{ label: '插入到PPT', action: 'insert' }, { label: '新建页插入', action: 'agree' }]
    }
    else {
      lastAIContent.value = fullContent
    }
  }
  catch (err) {
    aiMsg.content = '网络错误，请检查连接后重试。'
  }
  finally {
    aiMsg._btnsVisible = true
    isStreaming.value = false
    scrollToBottom()
  }
}

async function send() {
  if (!inputText.value.trim() || isStreaming.value) return
  const txt = inputText.value
  const ct = currentTool.value
  addMsg({ type: 'user', content: txt, tool: ct || undefined })
  inputText.value = ''
  clearTool()

  await callLLM(txt)
}

function insertTextToCurrentSlide(text: string) {
  const textEl: PPTTextElement = {
    type: 'text',
    id: nanoid(10),
    width: 800,
    height: 200,
    left: 100,
    top: 300,
    rotate: 0,
    content: `<p style="text-align: left;"><span style="font-size: 18px; color: #333;">${text.replace(/\n/g, '</span></p><p style="text-align: left;"><span style="font-size: 18px; color: #333;">')}</span></p>`,
    defaultFontName: '',
    defaultColor: '#333',
    lineHeight: 1.5,
    fill: '',
    outline: { color: '', width: 0, style: 'solid' },
  }
  addElementsFromData([textEl])
}

function insertTextAsNewSlide(text: string) {
  const newSlide: Slide = {
    id: nanoid(10),
    elements: [{
      type: 'text',
      id: nanoid(10),
      width: 800,
      height: 400,
      left: 100,
      top: 80,
      rotate: 0,
      content: `<p style="text-align: left;"><span style="font-size: 20px; color: #333;">${text.replace(/\n/g, '</span></p><p style="text-align: left;"><span style="font-size: 20px; color: #333;">')}</span></p>`,
      defaultFontName: '',
      defaultColor: '#333',
      lineHeight: 1.5,
      fill: '',
      outline: { color: '', width: 0, style: 'solid' },
    } as PPTTextElement],
    background: { type: 'solid', color: '#ffffff' },
  }
  addSlidesFromData([newSlide])
}

function insertToNotes(text: string) {
  const currentSlide = slidesStore.currentSlide
  if (currentSlide) {
    const remark = currentSlide.remark ? currentSlide.remark + '\n\n' + text : text
    slidesStore.updateSlide({ remark })
    addHistorySnapshot()
  }
}

function handleButton(action: string) {
  const content = lastAIContent.value
  const actions: Record<string, () => void> = {
    'agree': () => {
      insertTextAsNewSlide(content)
      addMsg({ type: 'ai', content: '已为您创建新的一页PPT并插入内容。' })
    },
    'insert': () => {
      insertTextToCurrentSlide(content)
      addMsg({ type: 'ai', content: '内容已插入当前页面，还有其他需要帮忙的吗？' })
    },
    'replace-text': () => {
      insertTextToCurrentSlide(content)
      addMsg({ type: 'ai', content: '文本已插入到当前页面，还有其他需要帮忙的吗？' })
    },
    'insert-note': () => {
      insertToNotes(content)
      addMsg({ type: 'ai', content: '演讲稿已插入到对应页面的备注中，还有其他需要帮忙的吗？' })
    },
    'reject': () => addMsg({ type: 'ai', content: '好的，已取消操作。还有其他需要帮忙的吗？' }),
  }
  actions[action]?.()
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const f = target.files?.[0]
  if (f) {
    addMsg({ type: 'user', content: `已上传文件：${f.name}` })
    setTimeout(() => addMsg({ type: 'ai', content: '我已收到您上传的文件，正在分析内容。请稍等片刻...' }), 500)
  }
}

onMounted(() => {
  setTimeout(() => {
    addMsg({ type: 'ai', content: '老师您好，我是子言，我可以帮您\n「搜索优质素材」\n「修改课件内容」\n「设计课堂活动」等等.\n有什么需要帮忙的，直接告诉我即可。' })
  }, 300)
})
</script>

<style lang="scss" scoped>
.ai-chat-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  font-size: 13px;
  position: relative;
  min-width: 260px;
}

.resize-handle {
  position: absolute;
  left: -3px;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  &:hover { background: rgba(139, 92, 246, 0.15); }
}

.panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(to right, #f5f3ff, #eff6ff);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .header-info { display: flex; align-items: center; gap: 8px; }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #a78bfa, #60a5fa);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 11px; font-weight: 600;
  }
  .name { font-weight: 500; color: #111; font-size: 13px; }
  .status { font-size: 11px; color: #999; }
  .close-btn {
    cursor: pointer; color: #999; padding: 4px;
    display: flex; align-items: center;
    &:hover { color: #333; }
  }
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;

  .msg-row { margin-bottom: 12px; }
  .msg-user { display: flex; flex-direction: column; align-items: flex-end; }
  .msg-ai { display: flex; flex-direction: column; align-items: flex-start; }

  .msg-bubble {
    border-radius: 12px;
    padding: 8px 12px;
    max-width: 95%;
    word-break: break-word;

    &.user { background: #3b82f6; color: #fff; }
    &.ai { background: #f3f4f6; color: #111; }
  }
  .msg-tool-tag {
    display: inline-block;
    background: #ede9fe; color: #7c3aed;
    font-size: 10px; padding: 1px 6px;
    border-radius: 8px; margin-bottom: 4px;
  }
  .msg-text {
    white-space: pre-wrap;
    line-height: 1.5;
    font-size: 12.5px;
  }
  .msg-image {
    margin-top: 8px; border-radius: 6px;
    width: 100%; max-height: 150px; object-fit: cover;
  }
  .msg-buttons {
    display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;
  }
  .msg-btn {
    padding: 4px 10px; background: #fff;
    border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 11px; color: #374151; cursor: pointer;
    &:hover { background: #f9fafb; border-color: #9ca3af; }
  }
  .msg-time {
    font-size: 10px; color: #9ca3af;
    margin-top: 2px; padding: 0 4px;
  }
}

.settings-panel {
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 10px 12px;
  max-height: 180px;
  overflow-y: auto;
  flex-shrink: 0;

  .settings-header {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 8px;
  }
  .settings-title {
    font-size: 11px; font-weight: 500; color: #7c3aed;
    display: flex; align-items: center; gap: 4px;
  }
  .settings-close {
    cursor: pointer; color: #9ca3af; display: flex;
    &:hover { color: #666; }
  }
  .setting-group { margin-bottom: 8px; }
  .setting-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
  .setting-options { display: flex; flex-wrap: wrap; gap: 4px; }
  .setting-opt {
    padding: 3px 8px; border-radius: 12px; font-size: 10px;
    border: 1px solid #d1d5db; background: #fff; color: #4b5563;
    cursor: pointer; transition: all 0.15s;
    &:hover { border-color: #a78bfa; color: #7c3aed; }
    &.active { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
  }
}

.toolbar {
  padding: 6px 12px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  .toolbar-left, .toolbar-right { display: flex; gap: 6px; }
}

.tool-btn {
  padding: 5px 6px; background: #fff;
  border: 1px solid #d1d5db; border-radius: 6px;
  cursor: pointer; font-size: 11px; color: #374151;
  display: flex; align-items: center; gap: 3px;
  &:hover { background: #f3f4f6; border-color: #9ca3af; }
  &.with-text { padding: 5px 8px; }
}

.tool-dropdown, .help-dropdown { position: relative; }
.dropdown-menu {
  position: absolute; bottom: 100%; left: 0;
  margin-bottom: 4px; width: 150px;
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden; z-index: 10;
}
.dropdown-item {
  padding: 6px 10px; font-size: 12px; color: #374151;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  &:hover { background: #f3f4f6; }
}

.help-menu {
  position: absolute; bottom: 100%; right: 0;
  margin-bottom: 6px; width: 260px;
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 10px; z-index: 10;

  .help-header {
    display: flex; justify-content: space-between;
    font-size: 12px; font-weight: 500; margin-bottom: 6px;
  }
  .help-close { cursor: pointer; color: #999; display: flex; &:hover { color: #333; } }
  .help-item {
    padding: 6px; background: #f9fafb; border-radius: 4px;
    font-size: 11px; color: #4b5563; cursor: pointer; margin-bottom: 4px;
    &:hover { background: #f3f4f6; }
  }
}

.tool-tag-row {
  padding: 4px 12px;
  display: flex; align-items: center; gap: 6px;
  flex-shrink: 0;
}
.tool-tag {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 8px; background: #f5f3ff;
  border: 1px solid #ddd6fe; border-radius: 12px;
  font-size: 10px; color: #7c3aed;
  .tag-close { cursor: pointer; margin-left: 2px; display: flex; &:hover { color: #5b21b6; } }
}
.more-settings-btn {
  padding: 3px 8px; border-radius: 12px; font-size: 10px;
  border: 1px solid #d1d5db; background: #fff; color: #6b7280;
  cursor: pointer; display: flex; align-items: center; gap: 3px;
  &:hover { border-color: #9ca3af; color: #374151; }
  &.active { background: #e5e7eb; color: #374151; }
}

.input-area {
  padding: 10px 12px;
  border-top: 1px solid #e5e7eb;
  display: flex; align-items: center; gap: 6px;
  flex-shrink: 0;
}
.chat-input {
  flex: 1; height: 34px; padding: 0 10px;
  border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 12px; outline: none;
  &:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
}
.send-btn {
  width: 34px; height: 34px; border-radius: 6px;
  background: #8b5cf6; color: #fff; border: none;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
  &:hover { background: #7c3aed; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from, .slide-up-leave-to { max-height: 0; opacity: 0; overflow: hidden; }
</style>
