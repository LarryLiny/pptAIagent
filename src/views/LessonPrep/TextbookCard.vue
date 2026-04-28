<template>
  <div class="textbook-card" @click="$emit('click', textbook.id)">
    <!-- Cover Image Area -->
    <div class="cover-area">
      <img
        :src="textbook.coverImage"
        :alt="textbook.name"
        class="cover-image"
        @error="onImageError"
      />
      <!-- Delisted Badge -->
      <span v-if="textbook.isDelisted" class="delisted-badge">已下架</span>
    </div>

    <!-- Info Area -->
    <div class="info-area">
      <div class="textbook-name" :title="textbook.name">{{ textbook.name }}</div>
      <div class="meta-row">
        <span class="courseware-count">课件数：{{ textbook.coursewareCount }}</span>
        <button
          class="favorite-btn"
          :class="{ favorited: textbook.isFavorited }"
          :title="textbook.isFavorited ? '取消收藏' : '收藏'"
          @click.stop="$emit('toggle-favorite', textbook.id)"
        >
          <!-- Filled star when favorited -->
          <svg v-if="textbook.isFavorited" viewBox="0 0 20 20" width="18" height="18">
            <path
              d="M10 1l2.5 5.1 5.6.8-4.1 3.9 1 5.6L10 13.4l-5 2.6 1-5.6L2 6.9l5.6-.8L10 1z"
              fill="#f5a623"
            />
          </svg>
          <!-- Outlined star when not favorited -->
          <svg v-else viewBox="0 0 20 20" width="18" height="18">
            <path
              d="M10 1l2.5 5.1 5.6.8-4.1 3.9 1 5.6L10 13.4l-5 2.6 1-5.6L2 6.9l5.6-.8L10 1z"
              fill="none"
              stroke="#ccc"
              stroke-width="1.2"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Textbook } from '@/types/lessonPrep'

defineProps<{
  textbook: Textbook
}>()

defineEmits<{
  (e: 'toggle-favorite', id: string): void
  (e: 'click', id: string): void
}>()

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  // Hide the broken image and show gradient placeholder via CSS
  img.style.display = 'none'
  img.parentElement?.classList.add('placeholder')
}
</script>

<style lang="scss" scoped>
.textbook-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.cover-area {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: #f0f0f0;

  &.placeholder {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.delisted-badge {
  position: absolute;
  top: 12px;
  left: -28px;
  width: 100px;
  text-align: center;
  padding: 4px 0;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 12px;
  transform: rotate(-45deg);
  letter-spacing: 1px;
}

.info-area {
  padding: 12px;
}

.textbook-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.courseware-count {
  font-size: 13px;
  color: #999;
}

.favorite-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  line-height: 1;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.15);
  }
}
</style>
