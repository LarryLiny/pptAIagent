<template>
  <div class="ai-sidebar">
    <!-- New chat button -->
    <div class="new-chat" @click="startNewChat">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span>新建对话</span>
    </div>

    <!-- History list -->
    <div class="history-list">
      <div class="history-label" v-if="sessions.length">历史记录</div>
      <div
        v-for="session in sessions"
        :key="session.id"
        class="history-item"
        :class="{ active: activeSessionId === session.id && floatingOpen }"
        @click="openChat(session.id)"
      >
        <div class="item-icon">
          <svg v-if="session.elementId" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <div class="item-content">
          <div class="item-title">{{ session.title }}</div>
          <div class="item-meta">{{ session.messages.length }} 条消息 · {{ formatDate(session.createdAt) }}</div>
        </div>
      </div>
      <div class="empty-hint" v-if="!sessions.length">暂无对话记录<br/>在下方输入开始对话</div>
    </div>

    <!-- Quick input at bottom -->
    <div class="quick-input">
      <div class="input-hint">{{ selectedHint }}</div>
      <div class="input-row">
        <input
          v-model="quickInput"
          @keydown.enter="sendQuick"
          placeholder="给 AI 发指令..."
          class="input-field"
        />
        <button
          class="voice-btn"
          :class="{ recording: isRecording }"
          @click="toggleVoice"
          v-if="hasSpeechRecognition"
        >
          <svg v-if="!isRecording" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        </button>
        <button class="send-btn" :disabled="!quickInput.trim()" @click="sendQuick">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import {
  sessions, activeSessionId, floatingOpen,
  createSession, openSession, restoreSessions,
} from './aiChatStore'

const mainStore = useMainStore()
const { handleElementId } = storeToRefs(mainStore)

const quickInput = ref('')
const isRecording = ref(false)
const hasSpeechRecognition = ref(false)
let recognition: any = null

const selectedHint = computed(() => {
  if (handleElementId.value) return '✦ 已选中元素，AI 将直接操作'
  return '✦ 输入指令，AI 为你服务'
})

function formatDate(d: Date) {
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function sendQuick() {
  if (!quickInput.value.trim()) return
  const elementId = handleElementId.value || undefined
  const session = createSession(elementId)
  sessionStorage.setItem('ai-pending-msg', JSON.stringify({
    sessionId: session.id,
    text: quickInput.value,
  }))
  quickInput.value = ''
}

function startNewChat() {
  createSession()
}

function openChat(id: string) {
  openSession(id)
}

function initSpeechRecognition() {
  const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
  if (!SR) return
  hasSpeechRecognition.value = true
  recognition = new SR()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = true
  recognition.onresult = (e: any) => {
    quickInput.value = Array.from(e.results).map((r: any) => r[0].transcript).join('')
  }
  recognition.onend = () => { isRecording.value = false }
  recognition.onerror = () => { isRecording.value = false }
}

function toggleVoice() {
  if (!recognition) return
  if (isRecording.value) { recognition.stop(); isRecording.value = false }
  else { recognition.start(); isRecording.value = true }
}

onMounted(() => {
  restoreSessions()
  initSpeechRecognition()
})
</script>

<style lang="scss" scoped>
.ai-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.new-chat {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; margin: 8px 10px 4px;
  border: 1px dashed #d1d5db; border-radius: 6px;
  color: #6b7280; cursor: pointer; font-size: 12px;
  flex-shrink: 0;
  &:hover { background: #f9fafb; border-color: #9ca3af; color: #374151; }
}

.history-list {
  flex: 1; overflow-y: auto; padding: 0 10px;

  .history-label {
    font-size: 10px; color: #9ca3af; padding: 6px 2px 4px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
}

.history-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px; border-radius: 6px; cursor: pointer;
  margin-bottom: 2px;
  &:hover { background: #f3f4f6; }
  &.active { background: #ede9fe; }

  .item-icon {
    width: 20px; height: 20px; border-radius: 4px;
    background: #f3f4f6; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; margin-top: 1px;
    color: #6b7280;
  }
  .item-content { flex: 1; min-width: 0; }
  .item-title {
    font-size: 12px; color: #333; line-height: 1.3;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .item-meta { font-size: 10px; color: #9ca3af; margin-top: 2px; }
}

.empty-hint {
  text-align: center; color: #9ca3af; padding: 40px 0; font-size: 11px; line-height: 1.8;
}

.quick-input {
  padding: 10px;
  border-top: 1px solid #eee;
  flex-shrink: 0;

  .input-hint {
    font-size: 10px; color: #9ca3af; margin-bottom: 6px; padding: 0 2px;
  }
  .input-row {
    display: flex; gap: 4px;
  }
  .input-field {
    flex: 1; height: 32px; padding: 0 8px;
    border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 12px; outline: none;
    &:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.15); }
  }
}

.voice-btn, .send-btn {
  width: 32px; height: 32px; border-radius: 6px;
  border: 1px solid #d1d5db; background: #fff;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; color: #6b7280;
  &:hover { background: #f3f4f6; border-color: #9ca3af; }
}
.send-btn {
  background: #8b5cf6; color: #fff; border-color: #8b5cf6;
  &:hover { background: #7c3aed; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
.voice-btn.recording {
  background: #ef4444; color: #fff; border-color: #ef4444;
  animation: pulse-rec 1.5s infinite;
}
@keyframes pulse-rec {
  0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
  50% { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
}
</style>
