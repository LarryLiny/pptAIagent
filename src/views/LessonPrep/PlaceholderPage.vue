<template>
  <div class="placeholder-page">
    <div class="placeholder-content">
      <svg class="placeholder-icon" viewBox="0 0 120 120" width="120" height="120">
        <rect x="20" y="30" width="80" height="60" rx="6" fill="#e8eeff" stroke="#4080ff" stroke-width="1.5" />
        <rect x="32" y="44" width="36" height="4" rx="2" fill="#a0b8ff" />
        <rect x="32" y="54" width="56" height="4" rx="2" fill="#c8d8ff" />
        <rect x="32" y="64" width="48" height="4" rx="2" fill="#c8d8ff" />
        <circle cx="85" cy="75" r="18" fill="#f0f5ff" stroke="#4080ff" stroke-width="1.5" />
        <path d="M79 75h12M85 69v12" stroke="#4080ff" stroke-width="2" stroke-linecap="round" />
      </svg>
      <h2 class="placeholder-title">功能开发中</h2>
      <p class="placeholder-desc">「{{ featureLabel }}」模块正在建设中，敬请期待</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const menuKeyLabelMap: Record<string, string> = {
  home: '首页',
  'class-center': '班课中心',
  supplement: '补充资源',
  homework: '作业',
  'question-bank': '题库',
  assessment: '考核方案',
  grades: '综合成绩',
  analytics: '学情分析',
}

const featureLabel = computed(() => {
  const key = route.params.menuKey as string
  return menuKeyLabelMap[key] || key || '未知功能'
})
</script>

<style lang="scss" scoped>
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.placeholder-content {
  text-align: center;
}

.placeholder-icon {
  margin-bottom: 24px;
  opacity: 0.85;
}

.placeholder-title {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px;
}

.placeholder-desc {
  font-size: 14px;
  color: #999;
  margin: 0;
}
</style>
