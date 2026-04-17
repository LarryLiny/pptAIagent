<template>
  <span class="typewriter-wrap">
    <span class="md-content" v-html="renderedHtml"></span>
    <span v-if="!done && animate" class="cursor"></span>
  </span>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { marked } from 'marked'

// Configure marked for inline-friendly output
marked.setOptions({
  breaks: true,
  gfm: true,
})

const props = defineProps<{
  text: string
  animate: boolean
}>()

const emit = defineEmits<{
  complete: []
}>()

const displayText = ref('')
const done = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
let started = false
let charIndex = 0

const renderedHtml = computed(() => {
  try {
    return marked.parse(displayText.value) as string
  }
  catch {
    return displayText.value
  }
})

function startTyping() {
  if (timer) clearInterval(timer)
  done.value = false
  timer = setInterval(() => {
    if (charIndex < props.text.length) {
      const end = Math.min(charIndex + 3, props.text.length)
      displayText.value = props.text.slice(0, end)
      charIndex = end
    }
    else {
      done.value = true
      if (timer) clearInterval(timer)
      timer = null
      emit('complete')
    }
  }, 10)
}

onMounted(() => {
  if (!props.animate) {
    displayText.value = props.text
    done.value = true
    emit('complete')
    return
  }
  started = true
  displayText.value = ''
  charIndex = 0
  startTyping()
})

watch(() => props.text, (newText) => {
  if (!started || !props.animate) {
    displayText.value = newText
    if (!props.animate) emit('complete')
    return
  }
  if (done.value && newText.length > charIndex) {
    done.value = false
    startTyping()
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.typewriter-wrap {
  display: inline;
}
.cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: #9ca3af;
  margin-left: 1px;
  vertical-align: text-bottom;
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.md-content :deep(h1) { font-size: 1.4em; font-weight: 700; margin: 0.4em 0 0.2em; }
.md-content :deep(h2) { font-size: 1.2em; font-weight: 700; margin: 0.3em 0 0.2em; }
.md-content :deep(h3) { font-size: 1.1em; font-weight: 600; margin: 0.3em 0 0.15em; }
.md-content :deep(p) { margin: 0.3em 0; }
.md-content :deep(ul), .md-content :deep(ol) { margin: 0.3em 0; padding-left: 1.4em; }
.md-content :deep(li) { margin: 0.15em 0; }
.md-content :deep(strong) { font-weight: 700; }
.md-content :deep(em) { font-style: italic; }
.md-content :deep(code) {
  background: #f0f0f0; padding: 1px 4px; border-radius: 3px;
  font-size: 0.9em; font-family: monospace;
}
.md-content :deep(pre) {
  background: #f5f5f5; padding: 8px; border-radius: 4px;
  overflow-x: auto; margin: 0.3em 0; font-size: 0.85em;
}
.md-content :deep(blockquote) {
  border-left: 3px solid #d1d5db; padding-left: 8px;
  margin: 0.3em 0; color: #6b7280;
}
.md-content :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 0.5em 0; }
.md-content :deep(table) { border-collapse: collapse; margin: 0.3em 0; font-size: 0.9em; }
.md-content :deep(th), .md-content :deep(td) { border: 1px solid #d1d5db; padding: 3px 6px; }
.md-content :deep(th) { background: #f9fafb; font-weight: 600; }
</style>
