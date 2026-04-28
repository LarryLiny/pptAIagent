<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-show="visible" class="chapter-modal-overlay" @keyup.esc="emit('close')" tabindex="-1" ref="overlayRef">
        <div class="chapter-modal-mask" @click="emit('close')"></div>
        <Transition name="modal-zoom">
          <div v-show="visible" class="chapter-modal">
            <div class="modal-header">
              <h3 class="modal-title">选择章节</h3>
              <button class="close-btn" @click="emit('close')">
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="#999" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <div v-if="chapters.length === 0" class="empty-hint">暂无章节数据</div>
              <ul v-else class="chapter-list">
                <li
                  v-for="chapter in chapters"
                  :key="chapter.id"
                  class="chapter-item"
                  :class="{ selected: selectedChapterId === chapter.id }"
                  @click="selectedChapterId = chapter.id"
                >
                  <span class="radio-indicator">
                    <span v-if="selectedChapterId === chapter.id" class="radio-dot"></span>
                  </span>
                  <span class="chapter-name">{{ chapter.name }}</span>
                </li>
              </ul>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="emit('close')">取消</button>
              <button class="btn-confirm" :disabled="!selectedChapterId" @click="handleConfirm">生成</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, useTemplateRef } from 'vue'
import type { Chapter } from '@/types/lessonPrep'

const props = defineProps<{
  visible: boolean
  textbookId: string
  chapters: Chapter[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', chapterId: string): void
}>()

const overlayRef = useTemplateRef<HTMLDivElement>('overlayRef')
const selectedChapterId = ref('')

watch(() => props.visible, (val) => {
  if (val) {
    selectedChapterId.value = ''
    nextTick(() => overlayRef.value?.focus())
  }
})

function handleConfirm() {
  if (selectedChapterId.value) {
    emit('confirm', selectedChapterId.value)
  }
}
</script>

<style lang="scss" scoped>
.chapter-modal-overlay,
.chapter-modal-mask {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5000;
}

.chapter-modal-overlay {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: 0;
  border: 0;
}

.chapter-modal-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.25);
}

.chapter-modal {
  position: relative;
  z-index: 5001;
  width: 480px;
  max-height: 70vh;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f0f0f0;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.empty-hint {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 40px 0;
}

.chapter-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  &.selected {
    background: #ecf5ff;
  }
}

.radio-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1.5px solid #dcdfe6;
  border-radius: 50%;
  flex-shrink: 0;
  transition: border-color 0.2s;

  .selected & {
    border-color: #409eff;
  }
}

.radio-dot {
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
}

.chapter-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

.btn-cancel {
  padding: 8px 20px;
  font-size: 13px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #409eff;
    border-color: #c6e2ff;
    background: #ecf5ff;
  }
}

.btn-confirm {
  padding: 8px 20px;
  font-size: 13px;
  color: #fff;
  background: #409eff;
  border: 1px solid #409eff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #66b1ff;
    border-color: #66b1ff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.modal-fade-enter-active {
  animation: modal-fade-in 0.25s both ease-in;
}
.modal-fade-leave-active {
  animation: modal-fade-out 0.25s both ease-out;
}
.modal-zoom-enter-active {
  animation: modal-zoom-in 0.25s both cubic-bezier(0.4, 0, 0, 1.5);
}
.modal-zoom-leave-active {
  animation: modal-zoom-out 0.25s both;
}

@keyframes modal-fade-in {
  from { opacity: 0; }
}
@keyframes modal-fade-out {
  to { opacity: 0; }
}
@keyframes modal-zoom-in {
  from { transform: scale3d(0.3, 0.3, 0.3); }
}
@keyframes modal-zoom-out {
  to { transform: scale3d(0.3, 0.3, 0.3); }
}
</style>
