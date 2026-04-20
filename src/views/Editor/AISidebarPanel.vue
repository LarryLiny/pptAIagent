<template>
  <div class="ai-sidebar">
    <!-- New chat button -->
    <button class="new-chat-btn" @click="startNewChat">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      新建 AI 对话
    </button>

    <!-- History list -->
    <div class="history-list">
      <div class="history-label" v-if="visibleSessions.length">历史记录</div>
      <div
        v-for="session in visibleSessions"
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
      <div class="empty-hint" v-if="!visibleSessions.length">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <div>暂无对话记录</div>
        <div>点击上方按钮开始</div>
      </div>
    </div>

    <!-- Tips bar at bottom -->
    <div class="tips-bar" @dblclick="nextTip">
      <div class="tips-inner" ref="tipsInnerRef">
        <span class="tips-text" ref="tipsTextRef">{{ currentTip }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  sessions, activeSessionId, floatingOpen,
  createSession, openSession, restoreSessions,
} from './aiChatStore'

const TIPS = [
  'Tips：选中文字后跟我说"字号改成30"，立刻生效',
  'Tips：想用时事做课堂引入？不妨问问 AI',
  'Tips：让 AI 帮你设计课堂互动活动吧！',
  'Tips：选中元素后说"改成红色"，AI 秒改',
  'Tips：AI 可以帮你生成演讲稿并插入备注',
  'Tips：说"背景改成深蓝色"，一句话换背景',
  'Tips：让 AI 帮你出几道选择题，难度随你定',
  'Tips：选中文字说"加粗居中"，排版一步到位',
  'Tips：AI 能帮你总结课件要点，生成知识清单',
  'Tips：试试语音输入，动动嘴就能操作 PPT',
]

const currentTipIndex = ref(0)
const currentTip = computed(() => TIPS[currentTipIndex.value])
const tipsInnerRef = ref<HTMLElement>()
const tipsTextRef = ref<HTMLElement>()
let tipTimer: ReturnType<typeof setInterval> | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null

// Only show sessions that have messages
const visibleSessions = computed(() => sessions.value.filter(s => s.messages.length > 0))

function formatDate(d: Date) {
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function startNewChat() {
  createSession()
}

function openChat(id: string) {
  openSession(id)
}

function startTipsCycle() {
  tipTimer = setInterval(nextTip, 7000)
  setTimeout(checkAndScroll, 4000)
}

function nextTip() {
  currentTipIndex.value = (currentTipIndex.value + 1) % TIPS.length
  if (scrollTimer) clearTimeout(scrollTimer)
  resetScroll()
  scrollTimer = setTimeout(checkAndScroll, 4000)
}

function resetScroll() {
  if (tipsTextRef.value) {
    tipsTextRef.value.style.transform = 'translateX(0)'
    tipsTextRef.value.style.transition = 'none'
  }
}

function checkAndScroll() {
  const inner = tipsInnerRef.value
  const text = tipsTextRef.value
  if (!inner || !text) return
  const overflow = text.scrollWidth - inner.clientWidth
  if (overflow > 0) {
    const duration = overflow / 30 // 30px per second
    text.style.transition = `transform ${duration}s linear`
    text.style.transform = `translateX(-${overflow}px)`
  }
}

onMounted(() => {
  restoreSessions()
  startTipsCycle()
})

onUnmounted(() => {
  if (tipTimer) clearInterval(tipTimer)
  if (scrollTimer) clearTimeout(scrollTimer)
})
</script>

<style lang="scss" scoped>
.ai-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.new-chat-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 12px; margin: 10px 10px 6px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff; border: none; border-radius: 8px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  flex-shrink: 0; transition: all 0.15s;
  &:hover { background: linear-gradient(135deg, #7c3aed, #4f46e5); box-shadow: 0 2px 8px rgba(139,92,246,0.3); }
  &:active { transform: scale(0.98); }
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
  text-align: center; color: #9ca3af; padding: 40px 0; font-size: 11px; line-height: 2;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}

.tips-bar {
  flex-shrink: 0;
  padding: 8px 10px;
  background: #fefce8;
  border-top: 1px solid #fde68a;
  overflow: hidden;
  cursor: pointer;
  user-select: none;

  .tips-inner {
    overflow: hidden;
    white-space: nowrap;
  }
  .tips-text {
    display: inline-block;
    font-size: 11px;
    color: #6b7280;
    white-space: nowrap;
  }
}
</style>
