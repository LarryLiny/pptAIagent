<template>
  <div class="textbook-list-page">
    <!-- Top bar: tabs left, search right -->
    <div class="top-bar">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          全部
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'favorite' }"
          @click="activeTab = 'favorite'"
        >
          收藏
        </button>
      </div>
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 20 20" width="16" height="16">
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="#999" stroke-width="1.5" />
          <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="#999" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="请输入教程名称"
          class="search-input"
        />
      </div>
    </div>

    <!-- Card grid or empty state -->
    <div v-if="filteredTextbooks.length > 0" class="card-grid">
      <TextbookCard
        v-for="tb in filteredTextbooks"
        :key="tb.id"
        :textbook="tb"
        @toggle-favorite="handleToggleFavorite"
        @click="handleCardClick"
      />
    </div>
    <div v-else class="empty-state">
      未找到相关内容
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Textbook } from '@/types/lessonPrep'
import { getTextbooks } from '@/mock/lessonPrep'
import TextbookCard from './TextbookCard.vue'

const router = useRouter()

const textbooks = ref<Textbook[]>([])
const searchKeyword = ref('')
const activeTab = ref<'all' | 'favorite'>('all')

const filteredTextbooks = computed(() => {
  let list = textbooks.value
  if (activeTab.value === 'favorite') {
    list = list.filter(tb => tb.isFavorited)
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter(tb => tb.name.toLowerCase().includes(keyword))
  }
  return list
})

function handleToggleFavorite(id: string) {
  const tb = textbooks.value.find(t => t.id === id)
  if (tb) {
    tb.isFavorited = !tb.isFavorited
  }
}

function handleCardClick(id: string) {
  router.push(`/lesson-prep/${id}`)
}

onMounted(async () => {
  textbooks.value = await getTextbooks()
})
</script>

<style lang="scss" scoped>
.textbook-list-page {
  padding: 20px 24px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 0;
}

.tab-btn {
  position: relative;
  padding: 8px 20px;
  font-size: 14px;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: #409eff;
    transition: width 0.2s;
  }

  &.active {
    color: #409eff;
    font-weight: 600;

    &::after {
      width: 60%;
    }
  }

  &:hover:not(.active) {
    color: #333;
  }
}

.search-box {
  position: relative;
  width: 240px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  font-size: 13px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &::placeholder {
    color: #c0c4cc;
  }

  &:focus {
    border-color: #409eff;
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  font-size: 14px;
  color: #999;
}
</style>
