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
          <div class="msg-bubble" :class="[msg.type, { 'slide-content': msg._isSlideContent }]">
            <div class="slide-content-badge" v-if="msg._isSlideContent">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              PPT 内容预览
              <span class="slide-label" v-if="msg._slideLabel">{{ msg._slideLabel }}</span>
            </div>
            <span class="msg-tool-icon" v-if="msg.tool && !msg._isSlideContent" v-html="TOOL_ICONS[msg.tool]"></span>
            <div class="msg-text" v-if="msg.content">
              <TypeWriter :text="msg.content" :animate="msg.type === 'ai' && !msg._btnsVisible" :key="msg.id + msg.content.length" @complete="msg._btnsVisible = true" />
            </div>
            <div class="msg-thinking" v-else-if="msg.type === 'ai'">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
            <!-- Image grid for search results -->
            <div class="img-grid" v-if="msg.images?.length">
              <div class="img-card" v-for="img in msg.images" :key="img.src" @click="insertImage(img.src)">
                <img :src="img.preview || img.src" loading="lazy" />
                <div class="img-overlay">
                  <span>插入到PPT</span>
                </div>
              </div>
            </div>
          </div>
          <div class="msg-actions" v-if="msg._btnsVisible && msg.buttons?.length">
            <button v-for="(btn, i) in msg.buttons" :key="i" class="action-btn" @click="handleButton(btn.action, msg.content)">{{ btn.label }}</button>
          </div>
        </div>
      </div>

      <!-- Tools bar -->
      <div class="float-tools">
        <div class="tool-settings-panel" v-if="showSettings && currentToolSettings">
          <div class="settings-header">
            <span class="settings-title">更多设置</span>
            <span class="settings-close" @click="showSettings = false">×</span>
          </div>
          <div v-for="s in currentToolSettings" :key="s.key" class="setting-row">
            <span class="setting-label">{{ s.label }}</span>
            <div class="setting-opts">
              <button v-for="o in s.options" :key="o" class="setting-opt" :class="{ active: toolSettings[s.key] === o }" @click="updateToolSetting(s.key, o)">{{ o }}</button>
            </div>
          </div>
        </div>
        <div class="tool-dropdown-wrap" @mouseenter="openToolMenu" @mouseleave="closeToolMenuDelay">
          <button class="tool-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            工具
          </button>
          <div class="tool-menu" v-if="toolMenuOpen" @mouseenter="openToolMenu" @mouseleave="closeToolMenuDelay">
            <div v-for="t in toolList" :key="t" class="tool-item" @click="selectTool(t)">
              <span class="tool-item-icon" v-html="TOOL_ICONS[t]"></span>
              {{ t }}
            </div>
          </div>
        </div>
        <button class="settings-btn" v-if="currentTool" @click="showSettings = !showSettings" :class="{ active: showSettings }">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          更多设置
        </button>
        <div class="tool-tag" v-if="currentTool">
          <span v-html="TOOL_ICONS[currentTool]"></span>
          {{ currentTool }}
          <span class="tag-x" @click="clearTool">×</span>
        </div>
        <div class="bound-hint" v-if="activeSession?.elementId">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          绑定元素
        </div>
      </div>

      <!-- Input -->
      <div class="float-input">
        <div class="input-wrap" @click="focusInput">
          <template v-if="currentTool">
            <span class="input-chip tool-chip-tag" v-html="TOOL_ICONS[currentTool]" @click.stop="showSettings = !showSettings"></span>
            <span class="input-chip" v-for="(val, key) in toolSettings" :key="key" @click.stop="showSettings = !showSettings">{{ val }}</span>
          </template>
          <input
            v-model="inputText"
            @keydown.enter="send"
            :placeholder="currentTool ? '补充需求（可选）...' : '输入消息...'"
            class="input-field"
            ref="inputRef"
          />
        </div>
        <button
          class="mic-btn"
          :class="{ recording: isRecording }"
          @click="toggleVoice"
        >
          <svg v-if="!isRecording" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        </button>
        <button class="send-btn" :disabled="(!inputText.trim() && !currentTool) || isStreaming" @click="send">
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
import useCreateElement from '@/hooks/useCreateElement'
import TypeWriter from './TypeWriter.vue'
import { describeCurrentSlide, pptTools, executeTool, SYSTEM_PROMPT, searchImages } from './aiPptTools'
import type { SearchedImage } from './aiPptTools'
import { tryLocalCommand } from './aiLocalCommands'
import {
  floatingOpen, activeSessionId, sessions,
  getActiveSession, addMessageToSession, saveSessions,
  closeFloating as closeFloat,
} from './aiChatStore'
import type { MsgButton } from './aiChatStore'
import { buildTemplatedSlide, describeTemplates, analyzeTemplates } from './aiSlideTemplate'
import type { Slide, PPTTextElement } from '@/types/slides'

const LLM_API_URL = import.meta.env.DEV ? '/llm/v1/chat/completions' : 'https://modelproxy.unipus.cn/v1/chat/completions'
const LLM_API_KEY = 'sk-CUBymvpjvH47EGAca1tygKVCtIGBgvVFJwKWTfJxyv8yGK7A'
const LLM_MODEL = 'qwen-plus'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { addSlidesFromData, addElementsFromData } = useAddSlidesOrElements()
const { addHistorySnapshot } = useHistorySnapshot()
const { createImageElement } = useCreateElement()

const inputText = ref('')
const isStreaming = ref(false)
const messagesRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const chatRef = ref<HTMLElement>()
const toolMenuOpen = ref(false)
const currentTool = ref<string | null>(null)
let toolMenuTimer: ReturnType<typeof setTimeout> | null = null

const toolList = ['生成课堂引入', '搜索背景知识', '例题生成', '互动环节设计', '总结要点', '生成演讲稿']

const TOOL_ICONS: Record<string, string> = {
  '生成课堂引入': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>',
  '搜索背景知识': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  '例题生成': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  '互动环节设计': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  '总结要点': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  '生成演讲稿': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
}

const TOOL_PROMPTS: Record<string, string> = {
  '生成课堂引入': '请结合情境导入方式，设计一段适中难度的课堂引入',
  '搜索背景知识': '搜索简单难度的背景知识',
  '例题生成': '生成2题选择题，难度基础',
  '互动环节设计': '设计一个小组讨论互动环节，时长10分钟',
  '总结要点': '帮我总结全部课件的知识要点，格式：要点列表',
  '生成演讲稿': '请生成一份正式风格、5分钟的演讲稿',
}

interface SettingItem { key: string; label: string; options: string[] }
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

const showSettings = ref(false)
const toolSettings = ref<Record<string, string>>({})
const currentToolSettings = computed(() => currentTool.value ? TOOL_SETTINGS[currentTool.value] || null : null)

// Voice recognition
const isRecording = ref(false)
const hasSpeechRecognition = ref(true) // Show button always, handle errors gracefully
let recognition: any = null

function initSpeechRecognition() {
  const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
  if (!SR) {
    hasSpeechRecognition.value = false
    return
  }
  // Don't create instance here — create fresh one each time in toggleVoice
}

function createRecognition() {
  const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.lang = 'zh-CN'
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1

  rec.onresult = (e: any) => {
    let transcript = ''
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript
    }
    if (transcript) inputText.value = transcript
  }
  rec.onend = () => {
    isRecording.value = false
    recognition = null
  }
  rec.onerror = (e: any) => {
    console.warn('Speech recognition error:', e.error)
    isRecording.value = false
    recognition = null
  }
  return rec
}

function toggleVoice() {
  if (isRecording.value && recognition) {
    recognition.stop()
    isRecording.value = false
    return
  }
  // Create fresh instance each time (Chrome requires this after onend)
  recognition = createRecognition()
  if (!recognition) return
  try {
    recognition.start()
    isRecording.value = true
  }
  catch (e) {
    console.warn('Speech recognition start failed:', e)
    isRecording.value = false
  }
}

const activeSession = computed(() => getActiveSession())

// Dragging
const pos = ref({ x: Math.max(100, window.innerWidth - 520), y: 80 })

function startDrag(e: MouseEvent) {
  const startX = e.clientX - pos.value.x
  const startY = e.clientY - pos.value.y
  const onMove = (ev: MouseEvent) => {
    pos.value.x = Math.max(0, Math.min(window.innerWidth - 440, ev.clientX - startX))
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
  showSettings.value = false
  // Init default settings
  const defs: Record<string, string> = {}
  const settings = TOOL_SETTINGS[t]
  if (settings) settings.forEach(s => { defs[s.key] = s.options[0] })
  toolSettings.value = defs
  inputText.value = ''  // Clear input — chips show the settings
  nextTick(() => inputRef.value?.focus())
}

function clearTool() {
  currentTool.value = null
  showSettings.value = false
  toolSettings.value = {}
  inputText.value = ''
}

function updateToolSetting(key: string, val: string) {
  toolSettings.value = { ...toolSettings.value, [key]: val }
  // Chips update automatically via reactive binding, no need to touch inputText
}

// Full prompt sent to AI (hidden from user)
function buildToolPrompt(tool: string, s: Record<string, string>): string {
  switch (tool) {
    case '生成课堂引入': return `运用 POA 产出导向法的"驱动"环节 + 场景教学法，以${s.introType || '情境导入'}方式，设计一段${s.difficulty || '适中'}难度的课堂引入。
要求：
1. 创设一个贴近学生真实生活的交际场景，让学生意识到"我需要学这个才能完成这个任务"（POA 驱动原则）；
2. 场景要具体、可感知，避免抽象说教（场景教学法）；
3. 自然引出本节课核心教学目标，为后续"促成"和"产出"环节铺垫；
4. 适配大学英语课堂，语言风格贴近学生生活与认知水平。`

    case '搜索背景知识': return `运用场景教学法，为大学英语课堂准备${s.difficulty || '适中'}难度的背景知识，来源：${s.sourceType || '外研社素材库'}。
要求：
1. 选择能创设真实语言使用场景的素材，帮助学生在情境中理解语言的形式、意义和用法；
2. 标注素材与本节课知识点的关联，说明如何用这个素材创设教学场景；
3. 素材需适配大学生认知水平，兼顾文化背景与语言学习需求。`

    case '例题生成': return `运用场景教学法创设真实语境 + POA"促成"原则提供语言支架，生成${s.count || '2题'}${s.qtype || '选择题'}，难度${s.difficulty || '基础'}。
要求：
1. 每道题必须嵌入一个真实交际场景（如职场邮件、社交对话、学术讨论），避免脱离语境的孤立语法题；
2. 题目设计体现"促成"梯度：从理解 → 模仿 → 应用，为学生的最终产出搭建支架；
3. 提供答案与解析，解析需说明该语言点在真实场景中的使用规律。`

    case '互动环节设计': return `运用 PBL 项目式学习 + POA"产出"导向，设计一个${s.form || '小组讨论'}互动环节，时长${s.duration || '10分钟'}。
要求：
1. 以一个真实问题或微型项目为驱动（PBL），让学生在解决问题中运用目标语言；
2. 明确最终产出形式（如一段对话、一份方案、一次汇报），体现 POA 的产出导向；
3. 提供清晰的操作步骤、角色分工和语言支架（关键句型/词汇提示）；
4. 设置分层参与方式，基础学生可借助支架完成，优秀学生可自由发挥。`

    case '总结要点': return `运用 POA"评价"框架，帮我总结${s.scope || '全部课件'}的知识要点，格式：${s.format || '要点列表'}。
要求：
1. 按「驱动场景回顾 → 语言知识梳理 → 产出能力检验」的逻辑组织（POA 教学闭环）；
2. 区分核心知识点（必须能在真实场景中运用）与拓展内容（了解即可）；
3. 每个要点标注"能做什么"（如：学完后能用英语描述一次旅行经历），体现产出导向。`

    case '生成演讲稿': return `运用场景教学法 + POA 产出导向，生成一份${s.style || '正式'}风格、${s.duration || '5分钟'}的演讲稿。
要求：
1. 演讲稿本身就是一个真实的语言产出任务（POA 产出），内容围绕本节课主题；
2. 融入具体场景和案例，让演讲内容生动可感（场景教学法）；
3. 结构清晰（观点-论据-总结），提供关键句型提示，方便不同水平学生参考；
4. 保留个性化表达空间，鼓励学生在框架基础上融入自己的观点和经历。`

    default: return ''
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}

function focusInput() {
  inputRef.value?.focus()
}

// LLM chat history per session
function buildChatHistory() {
  const session = activeSession.value
  if (!session) return []

  // Inject template info into system prompt
  const templateInfo = describeTemplates()
  const fullSystemPrompt = SYSTEM_PROMPT + `\n\n## 当前PPT模板信息\n${templateInfo}\n\n根据生成内容的类型，自动选择对应模板：\n- 只有标题 → 使用title模板\n- 标题+正文 → 使用content模板\n- 多个短条目 → 使用toc(目录)模板`

  const msgs: any[] = [{ role: 'system', content: fullSystemPrompt }]
  // Only include last 10 messages to save tokens
  const recent = session.messages.slice(-10)
  for (const m of recent) {
    msgs.push({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })
  }
  return msgs
}

async function send() {
  if ((!inputText.value.trim() && !currentTool.value) || isStreaming.value || !activeSession.value) return

  // Stop recording if active
  if (isRecording.value && recognition) {
    recognition.stop()
    isRecording.value = false
  }

  const txt = inputText.value
  const sessionId = activeSession.value.id
  const tool = currentTool.value
  const toolSettingsSnapshot = { ...toolSettings.value }
  const selectedElId = mainStore.handleElementId || undefined

  // Build what the user sees in chat (chips summary + extra text)
  let displayText: string
  let aiContent: string

  if (tool) {
    const chipValues = Object.values(toolSettingsSnapshot).join('，')
    const userExtra = txt.trim()
    displayText = userExtra ? `${tool}：${chipValues}｜${userExtra}` : `${tool}：${chipValues}`
    const fullPrompt = buildToolPrompt(tool, toolSettingsSnapshot)
    aiContent = userExtra ? `${fullPrompt}\n\n补充要求：${userExtra}` : fullPrompt
  }
  else {
    displayText = txt
    aiContent = txt
  }

  // Show short display text in chat bubble
  addMessageToSession(sessionId, { type: 'user', content: displayText, tool: tool || undefined })
  inputText.value = ''
  clearTool()
  scrollToBottom()

  // --- Try local command first (zero latency, zero tokens) ---
  if (!tool && selectedElId) {
    const localResult = tryLocalCommand(txt)
    if (localResult.handled) {
      const session = sessions.value.find(s => s.id === sessionId)
      if (session) {
        session.messages.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          type: 'ai',
          content: localResult.message,
          timestamp: new Date(),
          _btnsVisible: true,
          buttons: [{ label: '撤销', action: 'undo' }],
        })
        saveSessions()
        scrollToBottom()
      }
      return
    }
  }

  // Add thinking placeholder — use reactive for proper Vue tracking
  const aiMsgId = Date.now().toString() + Math.random().toString(36).slice(2)
  const session = sessions.value.find(s => s.id === sessionId)
  if (!session) return
  session.messages.push({
    id: aiMsgId,
    type: 'ai',
    content: '',
    timestamp: new Date(),
    _btnsVisible: false,
  })
  // Get reactive reference to the message in the array
  const aiMsg = session.messages[session.messages.length - 1]
  isStreaming.value = true
  scrollToBottom()

  try {
    const slideContext = describeCurrentSlide(selectedElId)
    const chatHistory = buildChatHistory()
    // Replace last user msg with enriched version
    chatHistory[chatHistory.length - 1] = {
      role: 'user',
      content: `[当前幻灯片]\n${slideContext}\n\n[用户请求]\n${aiContent}`,
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

      // Check if any tool call is search_images
      const searchCall = toolCalls.find((tc: any) => tc.function.name === 'search_images')
      if (searchCall) {
        let args: Record<string, any> = {}
        try { args = JSON.parse(searchCall.function.arguments) } catch {}
        const images = await searchImages(args.query || '', args.orientation || 'landscape')
        if (images.length) {
          aiMsg.content = `为您找到以下图片（关键词: ${args.query}），点击选择插入：`
          aiMsg.images = images
          aiMsg.buttons = []
        }
        else {
          aiMsg.content = `未找到相关图片，请换个关键词试试。`
        }
      }
      else {
        // Execute non-image tool calls
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
    }
    else {
      const fullText = choice?.message?.content || ''

      // Check if response contains PPT content separator
      if (fullText.includes('---PPT_CONTENT---')) {
        const [chatPart, pptPart] = fullText.split('---PPT_CONTENT---')
        // First message: AI's natural language reply (strip content type marker)
        const { content: chatContent } = parseContentType(chatPart)
        aiMsg.content = chatContent
        aiMsg.buttons = []

        // Parse content type from the PPT part (marker is at the very end)
        const { content: cleanPptPart, contentType } = parseContentType(pptPart || '')

        // Split by ---PPT_SLIDE--- for multi-slide support
        const slides = cleanPptPart.split('---PPT_SLIDE---').map(s => s.trim()).filter(Boolean)

        for (let i = 0; i < slides.length; i++) {
          const slideContent = slides[i]
          if (!slideContent) continue
          const slideLabel = slides.length > 1 ? `${i + 1}/${slides.length}` : ''
          session.messages.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2) + i,
            type: 'ai',
            content: slideContent,
            timestamp: new Date(),
            _btnsVisible: true,
            _isSlideContent: contentType === 'slide',
            _slideLabel: slideLabel,
            buttons: getButtonsForType(contentType),
          })
        }
      }
      else {
        // No separator — parse content type from the full text
        const { content: cleanText, contentType } = parseContentType(fullText)
        aiMsg.content = cleanText
        aiMsg.buttons = getButtonsForType(contentType)
      }
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

// Parse content into title + body
function parseContent(content: string): { title: string; body: string } {
  const lines = content.split('\n').filter(l => l.trim())
  const firstLine = lines[0] || ''
  const hMatch = firstLine.match(/^#{1,2}\s+(.+)/)
  const title = hMatch ? hMatch[1].replace(/\*\*/g, '') : (firstLine.length < 50 && lines.length > 1 ? firstLine.replace(/^[#*\s]+/, '') : '')
  const body = title ? lines.slice(1).join('\n').trim() : content.trim()
  return { title, body }
}

// Strip content type marker from text and return the type
function parseContentType(text: string): { content: string; contentType: 'chat' | 'slide' | 'note' } {
  const marker = text.match(/---CONTENT_TYPE:(chat|slide|note)---\s*$/)
  if (marker) {
    return {
      content: text.replace(/\s*---CONTENT_TYPE:(chat|slide|note)---\s*$/, '').trim(),
      contentType: marker[1] as 'chat' | 'slide' | 'note',
    }
  }
  // Fallback: no marker found, try to guess
  return { content: text.trim(), contentType: 'chat' }
}

// Get buttons based on content type
function getButtonsForType(contentType: 'chat' | 'slide' | 'note'): MsgButton[] {
  switch (contentType) {
    case 'slide':
      return [
        { label: '插入当前页', action: 'insert' },
        { label: '新建页插入', action: 'agree' },
      ]
    case 'note':
      return [
        { label: '插入为备注', action: 'note' },
        { label: '新建页插入', action: 'agree' },
      ]
    case 'chat':
    default:
      return []
  }
}

function insertImage(src: string) {
  // Use createImageElement which auto-sizes and centers
  try {
    createImageElement(src)
  }
  catch {
    // Fallback: insert with fixed dimensions if getImageSize fails
    const { addHistorySnapshot: snap } = useHistorySnapshot()
    slidesStore.addElement({
      type: 'image',
      id: nanoid(10),
      src,
      width: 400,
      height: 300,
      left: 300,
      top: 130,
      fixedRatio: true,
      rotate: 0,
    })
    mainStore.setActiveElementIdList([])
    snap()
  }
  const session = getActiveSession()
  if (session) {
    session.messages.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      type: 'ai',
      content: '图片已插入到当前页面。',
      timestamp: new Date(),
      _btnsVisible: true,
    })
    saveSessions()
    scrollToBottom()
  }
}

function handleButton(action: string, content: string) {
  if (action === 'undo') {
    const { undo } = useHistorySnapshot()
    undo()
    return
  }

  const { title, body } = parseContent(content)

  if (action === 'insert') {
    const slide = buildTemplatedSlide(title, body)
    const textEls = slide.elements.filter(el => el.type === 'text')
    for (const el of textEls) addElementsFromData([el])
  }
  else if (action === 'agree') {
    const slide = buildTemplatedSlide(title, body)
    addSlidesFromData([slide])
  }
  else if (action === 'note') {
    // Insert content as speaker notes (备注) on the current slide
    const currentSlide = slidesStore.currentSlide
    if (currentSlide) {
      // Strip markdown formatting for plain-text notes
      const noteText = content
        .replace(/^#{1,3}\s+/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .trim()
      const existingNotes = currentSlide.remark || ''
      const newNotes = existingNotes ? `${existingNotes}\n\n${noteText}` : noteText
      slidesStore.updateSlide({ remark: newNotes })
      addHistorySnapshot()
    }
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
  pos.value.x = Math.max(100, window.innerWidth - 560)
  initSpeechRecognition()
  // Pre-analyze templates on mount
  analyzeTemplates()
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
  width: 440px; max-height: 720px;
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
    font-size: 14px; font-weight: 500; color: #333;
  }
  .float-close {
    cursor: pointer; color: #999; display: flex; padding: 2px;
    &:hover { color: #333; }
  }
}

.float-messages {
  flex: 1; overflow-y: auto; padding: 14px; min-height: 200px; max-height: 500px;

  .welcome-msg {
    text-align: center; padding: 30px 0;
    .welcome-text { color: #9ca3af; font-size: 14px; }
  }

  .msg-row { margin-bottom: 10px; }
  .msg-user { display: flex; flex-direction: column; align-items: flex-end; }
  .msg-ai { display: flex; flex-direction: column; align-items: flex-start; }

  .msg-bubble {
    border-radius: 10px; padding: 10px 14px; max-width: 90%; word-break: break-word;
    &.user { background: #3b82f6; color: #fff; font-size: 14px; }
    &.ai { background: #f3f4f6; color: #111; font-size: 14px; }
    &.slide-content {
      background: #fff; border: 1.5px solid #8b5cf6; border-radius: 8px;
      padding: 12px 14px;
    }
  }
  .slide-content-badge {
    display: flex; align-items: center; gap: 4px;
    font-size: 12px; color: #8b5cf6; font-weight: 500;
    margin-bottom: 6px; padding-bottom: 6px;
    border-bottom: 1px solid #ede9fe;

    .slide-label {
      margin-left: auto;
      font-size: 11px; color: #a78bfa; font-weight: 400;
      background: #f5f3ff; padding: 1px 6px; border-radius: 8px;
    }
  }
  .msg-tool-icon {
    display: inline-flex; vertical-align: middle; margin-right: 4px; opacity: 0.7;
  }
  .img-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
    margin-top: 8px;
  }
  .img-card {
    position: relative; border-radius: 6px; overflow: hidden;
    cursor: pointer; aspect-ratio: 16/10;

    img {
      width: 100%; height: 100%; object-fit: cover;
      display: block;
    }
    .img-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.15s;
      span {
        color: #fff; font-size: 12px; font-weight: 500;
        padding: 4px 12px; background: rgba(139,92,246,0.8);
        border-radius: 4px;
      }
    }
    &:hover .img-overlay { opacity: 1; }
  }
  .msg-text { line-height: 1.6; }
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
    padding: 4px 12px; background: #fff; border: 1px solid #d1d5db;
    border-radius: 6px; font-size: 12px; color: #374151; cursor: pointer;
    &:hover { background: #f9fafb; border-color: #9ca3af; }
  }
}

.tool-settings-panel {
  position: absolute; bottom: 100%; left: 0; right: 0;
  z-index: 20;
  background: #fff; border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.06);
  padding: 10px 14px 14px; overflow-y: auto;
  max-height: 200px;

  .settings-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 8px;
    .settings-title { font-size: 13px; font-weight: 500; color: #333; }
    .settings-close { cursor: pointer; color: #999; font-size: 16px; &:hover { color: #333; } }
  }
  .setting-row {
    display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
    &:last-child { margin-bottom: 0; }
  }
  .setting-label { font-size: 12px; color: #6b7280; white-space: nowrap; min-width: 50px; }
  .setting-opts { display: flex; flex-wrap: wrap; gap: 5px; }
  .setting-opt {
    padding: 4px 12px; border-radius: 12px; font-size: 12px;
    border: 1px solid #d1d5db; background: #fff; color: #4b5563;
    cursor: pointer; transition: all 0.15s;
    &:hover { border-color: #a78bfa; color: #7c3aed; }
    &.active { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
  }
}

.float-tools {
  position: relative;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-top: 1px solid #f0f0f0;
  flex-shrink: 0;

  .tool-chip {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; border: 1px solid #d1d5db; border-radius: 4px;
    font-size: 12px; color: #6b7280; background: #fff; cursor: pointer;
    &:hover { background: #f3f4f6; }
  }
  .tool-tag {
    display: flex; align-items: center; gap: 4px;
    padding: 3px 10px; background: #f5f3ff; border: 1px solid #ddd6fe;
    border-radius: 10px; font-size: 12px; color: #7c3aed;
    .tag-x { cursor: pointer; &:hover { color: #5b21b6; } }
  }
  .settings-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 4px; font-size: 12px;
    border: 1px solid #d1d5db; background: #fff; color: #6b7280;
    cursor: pointer; white-space: nowrap;
    &:hover { background: #f3f4f6; border-color: #9ca3af; color: #374151; }
    &.active { background: #ede9fe; border-color: #c4b5fd; color: #7c3aed; }
  }
  .bound-hint {
    display: flex; align-items: center; gap: 4px;
    font-size: 12px; color: #8b5cf6; margin-left: auto;
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
  padding: 7px 12px; font-size: 13px; color: #374151; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  &:hover { background: #f3f4f6; }
  .tool-item-icon { display: flex; align-items: center; color: #9ca3af; }
}

.float-input {
  display: flex; gap: 6px; padding: 10px 14px;
  border-top: 1px solid #e5e7eb; flex-shrink: 0;
  align-items: flex-end;

  .input-wrap {
    flex: 1; min-height: 34px; padding: 4px 8px;
    border: 1px solid #d1d5db; border-radius: 6px;
    display: flex; flex-wrap: wrap; align-items: center; gap: 4px;
    cursor: text;
    &:focus-within { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.15); }
  }
  .input-chip {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 3px 8px; background: #ede9fe; color: #7c3aed;
    border-radius: 4px; font-size: 12px; font-weight: 500;
    white-space: nowrap; flex-shrink: 0; cursor: pointer;
    &:hover { background: #ddd6fe; }
  }
  .tool-chip-tag {
    padding: 2px 4px; background: #8b5cf6; color: #fff; border-radius: 4px;
  }
  .input-field {
    flex: 1; min-width: 60px; height: 28px; padding: 0 4px;
    border: none; outline: none; font-size: 14px;
    background: transparent;
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
