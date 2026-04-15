<template>
  <span>{{ displayText }}<span v-if="!done && animate" class="cursor"></span></span>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

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

function startTyping() {
  if (timer) clearInterval(timer)
  done.value = false
  timer = setInterval(() => {
    if (charIndex < props.text.length) {
      // Type 2 chars at a time for speed
      const end = Math.min(charIndex + 2, props.text.length)
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

// Support streaming: when text grows, keep typing
watch(() => props.text, (newText) => {
  if (!started || !props.animate) {
    displayText.value = newText
    if (!props.animate) emit('complete')
    return
  }
  // If text grew and we were done, restart typing from where we left off
  if (done.value && newText.length > charIndex) {
    done.value = false
    startTyping()
  }
  // If timer is already running, it will pick up the new length automatically
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: #9ca3af;
  margin-left: 1px;
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
