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

onMounted(() => {
  if (!props.animate || started) {
    displayText.value = props.text
    done.value = true
    emit('complete')
    return
  }
  started = true
  displayText.value = ''
  done.value = false
  let i = 0
  timer = setInterval(() => {
    if (i < props.text.length) {
      displayText.value = props.text.slice(0, i + 1)
      i++
    }
    else {
      done.value = true
      if (timer) clearInterval(timer)
      emit('complete')
    }
  }, 30)
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
