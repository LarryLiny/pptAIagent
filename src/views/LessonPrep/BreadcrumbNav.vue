<template>
  <div class="breadcrumb-nav">
    <template v-for="(item, index) in items" :key="index">
      <span
        v-if="index < items.length - 1"
        class="breadcrumb-link"
        @click="navigateTo(item.route)"
      >{{ item.label }}</span>
      <span v-else class="breadcrumb-current">{{ item.label }}</span>
      <span v-if="index < items.length - 1" class="breadcrumb-separator">/</span>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import type { BreadcrumbItem } from '@/types/lessonPrep'

defineProps<{
  items: BreadcrumbItem[]
}>()

const router = useRouter()

function navigateTo(route?: string) {
  if (route) {
    router.push(route)
  }
}
</script>

<style lang="scss" scoped>
.breadcrumb-nav {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 24px;
  background: #fff;
  font-size: 14px;
  line-height: 1;
}

.breadcrumb-link {
  color: #666;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #4080ff;
  }
}

.breadcrumb-current {
  color: #333;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #999;
}
</style>
