<template>
  <div class="ai-chat-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-info">
        <div class="avatar">AI</div>
        <div class="header-text">
          <div class="name">子言助手</div>
          <div class="status">在线</div>
        </div>
      </div>
      <div class="close-btn" @click="closePanel">✕</div>
    </div>

    <!-- Messages -->
    <div class="messages" ref="messagesRef">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="msg-row"
        :class="{ 'msg-user': msg.type === 'user', 'msg-ai': msg.type === 'ai' }"
      >
        <div class="msg-wrapper">
          <div class="msg-avatar" v-if="msg.type === 'ai'">AI</div>
          <div class="msg-body">
            <div class="msg-bubble" :class="msg.type">
              <div class="msg-tool-tag" v-if="msg.tool">{{ msg.tool }}</div>
              <div class="msg-text">
                <TypeWriter :text="msg.content" :animate="msg.type === 'ai'" :key="msg.id" @complete="msg._btnsVisible = true" />
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
          </div>
        </div>
        <div class="msg-time">{{ formatTime(msg.timestamp) }}</div>
      </div>
    </div>

    <!-- Settings Panel -->
    <transition name="slide-up">
      <div class="settings-panel" v-if="showSettings && currentToolSettings">
        <div class="settings-header">
          <span class="settings-title">✨ {{ currentTool }} · 高级配置</span>
          <span class="settings-close" @click="showSettings = false">✕</span>
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
          <span class="tool-icon">📎</span>
        </button>
        <div class="tool-dropdown" @mouseenter="toolMenuOpen = true" @mouseleave="toolMenuOpen = false">
          <button class="tool-btn with-text">
            <span class="tool-icon">🔧</span>
            <span>工具</span>
            <span class="arrow">▾</span>
          </button>
          <div class="dropdown-menu" v-if="toolMenuOpen">
            <div
              v-for="t in toolList"
              :key="t"
              class="dropdown-item"
              @click="selectTool(t)"
            >
              <span class="dropdown-icon">{{ toolIcons[t] }}</span>
              {{ t }}
            </div>
          </div>
        </div>
      </div>
      <div class="toolbar-right">
        <div class="help-dropdown">
          <button class="tool-btn with-text" @click="helpOpen = !helpOpen">
            <span class="tool-icon">❓</span>
            <span>帮助</span>
          </button>
          <div class="help-menu" v-if="helpOpen">
            <div class="help-header">
              <span>示例问题</span>
              <span class="help-close" @click="helpOpen = false">✕</span>
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
        ✨ {{ currentTool }}
        <span class="tag-close" @click="clearTool">✕</span>
      </div>
      <button class="more-settings-btn" :class="{ active: showSettings }" @click="showSettings = !showSettings">
        ⚙ 更多设置 {{ showSettings ? '▴' : '▾' }}
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
      <button class="send-btn" :disabled="!inputText.trim()" @click="send">
        <span>➤</span>
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
import { ref, nextTick, onMounted, reactive } from 'vue'
import { useMainStore, useSlidesStore } from '@/store'
import TypeWriter from './TypeWriter.vue'

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
const toolIcons: Record<string, string> = {
  '生成课堂引入': '💡', '搜索背景知识': '🔍', '例题生成': '📝',
  '互动环节设计': '👥', '总结要点': '📋', '生成演讲稿': '🎤',
}
const helpQuestions = ['把这段文字难度调低', '再给我生成一页相似题', '给我找一些爱迪生的英文背景资料', '从俄乌冲突引入本节课要学的Russia这个单词']

const mainStore = useMainStore()
const slidesStore = useSlidesStore()

const messages = ref<Message[]>([])
const inputText = ref('')
const currentTool = ref<string | null>(null)
const showSettings = ref(false)
const settings = reactive<Record<string, string>>({})
const toolMenuOpen = ref(false)
const helpOpen = ref(false)
const step = ref(0)
const messagesRef = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()

const currentToolSettings = ref<SettingItem[] | null>(null)

function addMsg(msg: Omit<Message, 'id' | 'timestamp' | '_btnsVisible'>) {
  messages.value.push({
    id: Date.now().toString() + Math.random(),
    timestamp: new Date(),
    _btnsVisible: msg.type === 'user',
    ...msg,
  })
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

function send() {
  if (!inputText.value.trim()) return
  const txt = inputText.value
  const ct = currentTool.value
  const st = { ...settings }
  addMsg({ type: 'user', content: txt, tool: ct || undefined })
  inputText.value = ''
  clearTool()

  setTimeout(() => {
    if (ct === '生成课堂引入') {
      const introType = st.introType || '情境导入'
      const diff = st.difficulty || '适中'
      addMsg({
        type: 'ai',
        content: `好的，根据当前PPT的内容，已为您生成「${introType}」风格、「${diff}」难度的课堂引入：\n\n「Good morning, class! Before we begin today's lesson on Environmental Protection, let me show you something. Last week, a massive wildfire broke out in Australia, destroying thousands of hectares of forest. What do you think caused this disaster? And more importantly — what can we do about it? Today, we'll explore these questions together and learn how to express our ideas about protecting our planet in English.」`,
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
        buttons: [{ label: '插入到PPT', action: 'insert' }, { label: '重新生成', action: 'regenerate' }],
      })
      return
    }
    if (ct === '生成演讲稿') {
      addMsg({ type: 'ai', content: '以下是为您生成的课堂演讲稿：\n\n「同学们好，今天我们来学习环境保护这一主题。大家知道，全球变暖正在影响我们的生活。接下来，我们将通过几个案例了解如何用英语表达环保理念，并探讨我们能为地球做些什么。」', buttons: [{ label: '插入到备注', action: 'insert-note' }, { label: '重新生成', action: 'regenerate-speech' }] })
      return
    }
    if (txt.includes('难度调低') || txt.includes('难度降低')) {
      addMsg({ type: 'ai', content: '好的，已根据外研社学生能力标准为您调整文本难度：\n\n「We should protect the environment. Trees give us clean air. We can save water and use less plastic. Small actions can make a big difference. Let\'s work together to keep our Earth clean and green.」', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-easy' }] })
      return
    }
    if (txt.includes('相似题')) {
      addMsg({ type: 'ai', content: '好的，已从外研社题库中为您匹配到一道相似题：\n\nChoose the correct answer:\nIf I ___ more time yesterday, I would have finished the project.\nA. have  B. had had  C. had  D. would have\n\nAnswer: B', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-quiz' }] })
      return
    }
    if (txt.includes('爱迪生') || txt.includes('Edison')) {
      addMsg({ type: 'ai', content: '为您找到以下资料：\n\n「Thomas Edison (1847–1931) was an American inventor who developed the phonograph, the motion picture camera, and the practical electric light bulb. He held over 1,000 patents. His Menlo Park laboratory was one of the first dedicated research facilities.」', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate' }] })
      return
    }
    if (txt.includes('俄乌') || txt.includes('Russia')) {
      addMsg({ type: 'ai', content: '好的，为您生成了一段引入短文：\n\n「Russia is the largest country in the world. Recently, the conflict between Russia and Ukraine has drawn global attention. This event reminds us of the importance of peace and diplomacy. Today, let\'s learn more about Russia — its geography, culture, and the word itself.」', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate' }] })
      return
    }
    if (step.value === 0) {
      addMsg({ type: 'ai', content: '好的，通过搜索外研社的素材库，推荐插入以下内容：\n\n「In recent years, the importance of environmental protection has become increasingly evident. Scientists and researchers worldwide are working together to develop sustainable solutions for our planet. Education plays a crucial role in raising awareness about environmental issues.」', buttons: [{ label: '插入', action: 'insert' }, { label: '重新生成', action: 'regenerate' }] })
      step.value = 1
    }
    else {
      addMsg({ type: 'ai', content: '好的，通过全网搜索，找到了合适的素材，将为您新建一页，然后插入内容，是否同意？', buttons: [{ label: '同意', action: 'agree' }, { label: '拒绝', action: 'reject' }] })
    }
  }, 1000)
}

function handleButton(action: string) {
  const actions: Record<string, () => void> = {
    'agree': () => setTimeout(() => addMsg({ type: 'ai', content: '已为您创建新的一页PPT并插入内容：\n\n「Thomas Edison, one of the greatest inventors in history, is best known for developing the practical electric light bulb. Born in 1847, Edison held over 1,000 patents.」' }), 800),
    'insert': () => addMsg({ type: 'ai', content: '内容已插入当前页面，还有其他需要帮忙的吗？' }),
    'replace-text': () => addMsg({ type: 'ai', content: '文本已替换到当前页面，还有其他需要帮忙的吗？' }),
    'insert-note': () => addMsg({ type: 'ai', content: '演讲稿已插入到对应页面的备注中，还有其他需要帮忙的吗？' }),
    'reject': () => addMsg({ type: 'ai', content: '好的，已取消操作。还有其他需要帮忙的吗？' }),
    'regenerate-easy': () => addMsg({ type: 'ai', content: '好的，重新生成了更简单的版本：\n\n「Our planet needs help. We can plant trees, save water, and recycle. Walking or riding a bike is good for the air. Let\'s protect our beautiful Earth together.」', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-easy' }] }),
    'regenerate-quiz': () => addMsg({ type: 'ai', content: '好的，重新生成了一道题目：\n\nI wish I ___ to the party last night.\nA. go  B. went  C. had gone  D. would go\n\nAnswer: C', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-quiz' }] }),
    'regenerate-speech': () => addMsg({ type: 'ai', content: '好的，我为您重新生成演讲稿：\n\n「各位同学，欢迎来到今天的英语课。本节课我们聚焦环境保护话题，将学习相关词汇与表达。希望大家积极参与讨论。准备好了吗？Let\'s go!」', buttons: [{ label: '插入到备注', action: 'insert-note' }, { label: '重新生成', action: 'regenerate-speech' }] }),
    'regenerate': () => addMsg({ type: 'ai', content: '好的，我为您重新生成内容：\n\n「Climate change represents one of the most pressing challenges of our time. Renewable energy sources offer promising alternatives to fossil fuels.」', buttons: [{ label: '插入', action: 'insert' }, { label: '重新生成', action: 'regenerate' }] }),
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
    addMsg({ type: 'ai', content: '老师您好，我是子言，我可以帮您 \n「搜索优质素材」 \n「修改课件内容」\n「设计课堂活动」等等. \n 有什么需要帮忙的，直接告诉我即可。\n\n例如跟我说：请结合近期时事和本节课的内容，设计一段课堂引入。' })
  }, 500)
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
}

.panel-header {
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(to right, #f5f3ff, #eff6ff);
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a78bfa, #60a5fa);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
  }
  .name { font-weight: 500; color: #111; }
  .status { font-size: 11px; color: #999; }
  .close-btn {
    cursor: pointer;
    color: #999;
    font-size: 14px;
    padding: 4px;
    &:hover { color: #333; }
  }
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  .msg-row {
    margin-bottom: 16px;
  }
  .msg-user .msg-wrapper { flex-direction: row-reverse; }
  .msg-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a78bfa, #60a5fa);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 10px;
    flex-shrink: 0;
  }
  .msg-bubble {
    border-radius: 16px;
    padding: 10px 14px;
    max-width: 85%;

    &.user {
      background: #3b82f6;
      color: #fff;
    }
    &.ai {
      background: #f3f4f6;
      color: #111;
    }
  }
  .msg-tool-tag {
    display: inline-block;
    background: #ede9fe;
    color: #7c3aed;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    margin-bottom: 6px;
  }
  .msg-text {
    white-space: pre-wrap;
    line-height: 1.6;
    font-size: 13px;
  }
  .msg-image {
    margin-top: 10px;
    border-radius: 8px;
    width: 100%;
    max-height: 180px;
    object-fit: cover;
  }
  .msg-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .msg-btn {
    padding: 6px 14px;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 12px;
    color: #374151;
    cursor: pointer;
    &:hover { background: #f9fafb; border-color: #9ca3af; }
  }
  .msg-time {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 4px;
    padding: 0 8px;
  }
  .msg-user .msg-time { text-align: right; }
}

.settings-panel {
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 12px 16px;
  max-height: 200px;
  overflow-y: auto;

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .settings-title {
    font-size: 12px;
    font-weight: 500;
    color: #7c3aed;
  }
  .settings-close {
    cursor: pointer;
    color: #9ca3af;
    &:hover { color: #666; }
  }
  .setting-group { margin-bottom: 10px; }
  .setting-label { font-size: 11px; color: #6b7280; margin-bottom: 6px; }
  .setting-options { display: flex; flex-wrap: wrap; gap: 6px; }
  .setting-opt {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    border: 1px solid #d1d5db;
    background: #fff;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { border-color: #a78bfa; color: #7c3aed; }
    &.active { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
  }
}

.toolbar {
  padding: 8px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .toolbar-left, .toolbar-right { display: flex; gap: 8px; }
}

.tool-btn {
  padding: 6px 8px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover { background: #f3f4f6; border-color: #9ca3af; }
  &.with-text { padding: 6px 10px; }
  .tool-icon { font-size: 14px; }
  .arrow { font-size: 10px; }
}

.tool-dropdown, .help-dropdown {
  position: relative;
}
.dropdown-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 4px;
  width: 160px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  z-index: 10;
}
.dropdown-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover { background: #f3f4f6; }
  .dropdown-icon { font-size: 14px; }
}

.help-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  width: 280px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 12px;
  z-index: 10;

  .help-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  .help-close { cursor: pointer; color: #999; &:hover { color: #333; } }
  .help-item {
    padding: 8px;
    background: #f9fafb;
    border-radius: 6px;
    font-size: 12px;
    color: #4b5563;
    cursor: pointer;
    margin-bottom: 6px;
    &:hover { background: #f3f4f6; }
  }
}

.tool-tag-row {
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tool-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 20px;
  font-size: 11px;
  color: #7c3aed;
  .tag-close { cursor: pointer; margin-left: 2px; &:hover { color: #5b21b6; } }
}
.more-settings-btn {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  &:hover { border-color: #9ca3af; color: #374151; }
  &.active { background: #e5e7eb; color: #374151; }
}

.input-area {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  &:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
}
.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #8b5cf6;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  &:hover { background: #7c3aed; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
