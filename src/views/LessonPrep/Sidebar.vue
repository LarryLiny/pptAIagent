<template>
  <aside class="sidebar">
    <!-- Logo Header -->
    <div class="sidebar-header">
      <div class="logo-area">
        <svg class="logo-icon" viewBox="0 0 32 32" width="28" height="28">
          <circle cx="16" cy="16" r="14" fill="#4080ff" />
          <text x="16" y="21" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold" font-family="Arial">U</text>
        </svg>
        <span class="platform-name">U校园</span>
      </div>
    </div>

    <!-- Menu Tree -->
    <nav class="sidebar-menu">
      <!-- 首页 (no children) -->
      <div
        class="menu-item"
        :class="{ active: isActive(menuTree[0].route!) }"
        @click="navigateTo(menuTree[0].route!)"
      >
        <span class="menu-icon">
          <svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 2L2 8.5V17a1 1 0 001 1h4v-5h6v5h4a1 1 0 001-1V8.5L10 2z" fill="currentColor"/></svg>
        </span>
        <span class="menu-label">{{ menuTree[0].label }}</span>
      </div>

      <!-- Expandable groups -->
      <div
        v-for="group in menuGroups"
        :key="group.key"
        class="menu-group"
      >
        <div class="menu-group-header" @click="toggleGroup(group.key)">
          <span class="menu-icon">
            <svg v-if="group.key === 'teaching'" viewBox="0 0 20 20" width="16" height="16"><path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 3h10v2H5V5zm0 4h10v2H5V9zm0 4h7v2H5v-2z" fill="currentColor"/></svg>
            <svg v-else-if="group.key === 'evaluation'" viewBox="0 0 20 20" width="16" height="16"><path d="M10 1l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L10 15.9l-5.8 3 1.1-6.5L.6 7.8l6.5-.9L10 1z" fill="currentColor"/></svg>
            <svg v-else-if="group.key === 'statistics'" viewBox="0 0 20 20" width="16" height="16"><path d="M2 17h16v1H2v-1zm1-6h2v5H3v-5zm4-3h2v8H7V8zm4-4h2v12h-2V4zm4 2h2v10h-2V6z" fill="currentColor"/></svg>
          </span>
          <span class="menu-label">{{ group.label }}</span>
          <span class="expand-arrow" :class="{ expanded: expandedGroups[group.key] }">
            <svg viewBox="0 0 12 12" width="10" height="10"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>

        <div v-show="expandedGroups[group.key]" class="menu-children">
          <div
            v-for="child in group.children"
            :key="child.key"
            class="menu-item child-item"
            :class="{ active: isActive(child.route!) }"
            @click="navigateTo(child.route!)"
          >
            <span class="menu-label">{{ child.label }}</span>
          </div>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import { reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MenuItem } from '@/types/lessonPrep'

const router = useRouter()
const route = useRoute()

const menuTree: MenuItem[] = [
  { key: 'home', label: '首页', route: '/placeholder/home' },
  {
    key: 'teaching',
    label: '我的教学',
    children: [
      { key: 'class-center', label: '班课中心', route: '/placeholder/class-center' },
      { key: 'lesson-prep', label: '备授课管理', route: '/lesson-prep' },
      { key: 'supplement', label: '补充资源', route: '/placeholder/supplement' },
      { key: 'homework', label: '作业', route: '/placeholder/homework' },
      { key: 'question-bank', label: '题库', route: '/placeholder/question-bank' },
    ],
  },
  {
    key: 'evaluation',
    label: '教学评价',
    children: [
      { key: 'assessment', label: '考核方案', route: '/placeholder/assessment' },
      { key: 'grades', label: '综合成绩', route: '/placeholder/grades' },
    ],
  },
  {
    key: 'statistics',
    label: '数据统计',
    children: [
      { key: 'analytics', label: '学情分析', route: '/placeholder/analytics' },
    ],
  },
]

const menuGroups = computed(() =>
  menuTree.filter((item) => item.children && item.children.length > 0)
)

const expandedGroups = reactive<Record<string, boolean>>({
  teaching: true,
  evaluation: true,
  statistics: true,
})

function toggleGroup(key: string) {
  expandedGroups[key] = !expandedGroups[key]
}

function isActive(menuRoute: string): boolean {
  if (menuRoute === '/lesson-prep') {
    return route.path === '/lesson-prep' || route.path.startsWith('/lesson-prep/')
  }
  return route.path === menuRoute
}

function navigateTo(target: string) {
  router.push(target)
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: 200px;
  min-width: 200px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px 16px 16px;
  background: linear-gradient(135deg, #4080ff 0%, #1a5cff 100%);

  .logo-area {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo-icon {
    flex-shrink: 0;
  }

  .platform-name {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 1px;
  }
}

.sidebar-menu {
  flex: 1;
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;

  &:hover {
    background: #f0f5ff;
    color: #4080ff;
  }

  &.active {
    background: #f0f5ff;
    color: #4080ff;
    border-left-color: #4080ff;
    font-weight: 500;
  }
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  margin-right: 8px;
  color: inherit;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-group-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
  }

  .expand-arrow {
    display: flex;
    align-items: center;
    margin-left: auto;
    color: #999;
    transition: transform 0.2s;

    &.expanded {
      transform: rotate(90deg);
    }
  }
}

.menu-children {
  .child-item {
    padding-left: 44px;
  }
}
</style>
