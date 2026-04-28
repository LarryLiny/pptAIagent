<template>
  <div class="management-layout">
    <!-- Top Header Bar -->
    <header class="top-header">
      <div class="header-left">
        <!-- Empty or logo area -->
      </div>
      <div class="header-right">
        <span class="header-link">U校园数据</span>
        <span class="header-link">使用帮助</span>
        <span class="header-link">我的消息</span>
        <div class="user-info">
          <div class="user-avatar">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <circle cx="16" cy="16" r="15" fill="#e8e8e8" />
              <circle cx="16" cy="12" r="5" fill="#bbb" />
              <path d="M6 28c0-6 4.5-10 10-10s10 4 10 10" fill="#bbb" />
            </svg>
          </div>
          <span class="user-name">体验教师8</span>
        </div>
      </div>
    </header>

    <!-- Main Body: Sidebar + Content -->
    <div class="main-body">
      <Sidebar />
      <div class="content-area">
        <BreadcrumbNav :items="breadcrumbItems" />
        <div class="page-content">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import BreadcrumbNav from './BreadcrumbNav.vue'
import { getTextbooks } from '@/mock/lessonPrep'
import type { BreadcrumbItem } from '@/types/lessonPrep'

const route = useRoute()
const textbookName = ref('')

// Watch textbookId param and load textbook name
watch(
  () => route.params.textbookId,
  async (textbookId) => {
    if (textbookId && typeof textbookId === 'string') {
      const textbooks = await getTextbooks()
      const found = textbooks.find(t => t.id === textbookId)
      textbookName.value = found ? found.name : '未知教材'
    }
    else {
      textbookName.value = ''
    }
  },
  { immediate: true },
)

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const path = route.path

  // Placeholder pages
  if (path.startsWith('/placeholder/')) {
    return [{ label: '功能开发中' }]
  }

  // TextbookDetail: /lesson-prep/:textbookId
  if (route.params.textbookId) {
    return [
      { label: '我的教学' },
      { label: '备授课管理', route: '/lesson-prep' },
      { label: textbookName.value || '加载中...' },
    ]
  }

  // TextbookList: /lesson-prep
  return [
    { label: '我的教学' },
    { label: '备授课管理' },
  ]
})
</script>

<style lang="scss" scoped>
.management-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-link {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #4080ff;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
}

.user-name {
  font-size: 13px;
  color: #333;
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}
</style>
