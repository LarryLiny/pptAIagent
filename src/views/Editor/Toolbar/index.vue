<template>
  <div class="toolbar">
    <div class="side-tabs">
      <div
        v-for="tab in currentTabs"
        :key="tab.key"
        class="side-tab"
        :class="{ active: toolbarState === tab.key, 'ai-tab': tab.key === ToolbarStates.AI_CHAT }"
        @click="setToolbarState(tab.key as ToolbarStates)"
      >
        <div class="tab-icon">
          <component :is="tabIcons[tab.key]" v-if="tabIcons[tab.key]" />
        </div>
        <div class="tab-label">{{ tab.label }}</div>
      </div>
    </div>
    <div class="content" :class="{ 'no-padding': toolbarState === ToolbarStates.AI_CHAT }">
      <AISidebarPanel v-if="toolbarState === ToolbarStates.AI_CHAT" />
      <component :is="currentPanelComponent" v-else></component>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch, h } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ToolbarStates } from '@/types/toolbar'

import ElementStylePanel from './ElementStylePanel/index.vue'
import ElementPositionPanel from './ElementPositionPanel.vue'
import ElementAnimationPanel from './ElementAnimationPanel.vue'
import SlideDesignPanel from './SlideDesignPanel/index.vue'
import SlideAnimationPanel from './SlideAnimationPanel.vue'
import MultiPositionPanel from './MultiPositionPanel.vue'
import MultiStylePanel from './MultiStylePanel.vue'
import AISidebarPanel from '../AISidebarPanel.vue'

const mainStore = useMainStore()
const { activeElementIdList, activeElementList, activeGroupElementId, toolbarState } = storeToRefs(mainStore)

const aiTab = { label: 'AI', key: ToolbarStates.AI_CHAT }

const elementTabs = [
  { label: '样式', key: ToolbarStates.EL_STYLE },
  { label: '位置', key: ToolbarStates.EL_POSITION },
  { label: '动画', key: ToolbarStates.EL_ANIMATION },
  aiTab,
]
const slideTabs = [
  { label: '设计', key: ToolbarStates.SLIDE_DESIGN },
  { label: '切换', key: ToolbarStates.SLIDE_ANIMATION },
  { label: '动画', key: ToolbarStates.EL_ANIMATION },
  aiTab,
]
const multiSelectTabs = [
  { label: '样式', key: ToolbarStates.MULTI_STYLE },
  { label: '位置', key: ToolbarStates.MULTI_POSITION },
  aiTab,
]

// Tab icons (line style SVGs)
const iconDesign = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
  h('path', { d: 'M2 17l10 5 10-5' }),
  h('path', { d: 'M2 12l10 5 10-5' }),
])
const iconTransition = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('polyline', { points: '13 17 18 12 13 7' }),
  h('polyline', { points: '6 17 11 12 6 7' }),
])
const iconAnimation = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('polygon', { points: '5 3 19 12 5 21 5 3' }),
])
const iconStyle = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M12 20h9' }),
  h('path', { d: 'M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' }),
])
const iconPosition = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('polyline', { points: '5 9 2 12 5 15' }),
  h('polyline', { points: '9 5 12 2 15 5' }),
  h('polyline', { points: '15 19 12 22 9 19' }),
  h('polyline', { points: '19 9 22 12 19 15' }),
  h('line', { x1: 2, y1: 12, x2: 22, y2: 12 }),
  h('line', { x1: 12, y1: 2, x2: 12, y2: 22 }),
])

const iconAI = () => h('svg', {
  class: 'ai-icon-svg',
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
}, [
  h('defs', [
    h('linearGradient', { id: 'ai-grad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
      h('stop', { offset: '0%', 'stop-color': '#a78bfa' }),
      h('stop', { offset: '50%', 'stop-color': '#818cf8' }),
      h('stop', { offset: '100%', 'stop-color': '#60a5fa' }),
    ]),
  ]),
  // Main sparkle
  h('path', {
    d: 'M12 2C12 2 13.5 8.5 15.5 10.5C17.5 12.5 22 12 22 12C22 12 17.5 13.5 15.5 15.5C13.5 17.5 12 22 12 22C12 22 10.5 17.5 8.5 15.5C6.5 13.5 2 12 2 12C2 12 6.5 10.5 8.5 8.5C10.5 6.5 12 2 12 2Z',
    fill: 'url(#ai-grad)',
    class: 'ai-sparkle-main',
  }),
  // Small sparkle top-right
  h('path', {
    d: 'M19 2C19 2 19.5 4 20.5 5C21.5 6 23 5.5 23 5.5C23 5.5 21.5 6.5 20.5 7.5C19.5 8.5 19 10 19 10C19 10 18.5 8.5 17.5 7.5C16.5 6.5 15 5.5 15 5.5C15 5.5 16.5 5 17.5 4C18.5 3 19 2 19 2Z',
    fill: 'url(#ai-grad)',
    opacity: 0.7,
    class: 'ai-sparkle-small',
  }),
])

const tabIcons: Record<string, any> = {
  [ToolbarStates.SLIDE_DESIGN]: iconDesign,
  [ToolbarStates.SLIDE_ANIMATION]: iconTransition,
  [ToolbarStates.EL_ANIMATION]: iconAnimation,
  [ToolbarStates.EL_STYLE]: iconStyle,
  [ToolbarStates.EL_POSITION]: iconPosition,
  [ToolbarStates.MULTI_STYLE]: iconStyle,
  [ToolbarStates.MULTI_POSITION]: iconPosition,
  [ToolbarStates.AI_CHAT]: iconAI,
}

const setToolbarState = (value: ToolbarStates) => {
  mainStore.setToolbarState(value)
}

const currentTabs = computed(() => {
  if (!activeElementIdList.value.length) return slideTabs
  else if (activeElementIdList.value.length > 1) {
    if (!activeGroupElementId.value) return multiSelectTabs

    const activeGroupElement = activeElementList.value.find(item => item.id === activeGroupElementId.value)
    if (activeGroupElement) return elementTabs
    return multiSelectTabs
  }
  return elementTabs
})

watch(currentTabs, () => {
  // Don't auto-switch away from AI tab — it's always available
  if (toolbarState.value === ToolbarStates.AI_CHAT) return
  const currentTabsValue: ToolbarStates[] = currentTabs.value.map(tab => tab.key)
  if (!currentTabsValue.includes(toolbarState.value)) {
    mainStore.setToolbarState(currentTabsValue[0])
  }
})

const currentPanelComponent = computed(() => {
  const panelMap = {
    [ToolbarStates.EL_STYLE]: ElementStylePanel,
    [ToolbarStates.EL_POSITION]: ElementPositionPanel,
    [ToolbarStates.EL_ANIMATION]: ElementAnimationPanel,
    [ToolbarStates.SLIDE_DESIGN]: SlideDesignPanel,
    [ToolbarStates.SLIDE_ANIMATION]: SlideAnimationPanel,
    [ToolbarStates.MULTI_STYLE]: MultiStylePanel,
    [ToolbarStates.MULTI_POSITION]: MultiPositionPanel,
  }
  return panelMap[toolbarState.value] || null
})
</script>

<style lang="scss" scoped>
.toolbar {
  border-left: solid 1px $borderColor;
  background-color: #fff;
  display: flex;
  flex-direction: row;
  height: 100%;
}

.side-tabs {
  width: 48px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  border-right: 1px solid $borderColor;
  padding-top: 4px;
}

.side-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 4px;
  cursor: pointer;
  color: #888;
  transition: all 0.15s;
  position: relative;
  user-select: none;

  .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 3px;
  }
  .tab-label {
    font-size: 10px;
    line-height: 1;
    white-space: nowrap;
  }

  &:hover {
    color: #555;
    background: #f0f0f0;
  }

  &.active {
    color: $themeColor;
    background: #fff;
    border-right: 2px solid $themeColor;
    margin-right: -1px;

    .tab-label {
      font-weight: 500;
    }
  }

  &.ai-tab {
    border-top: 1px solid $borderColor;
    margin-top: 4px;
    padding-top: 12px;

    .tab-label {
      background: linear-gradient(90deg, #a78bfa, #60a5fa);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 600;
    }

    .ai-icon-svg {
      filter: drop-shadow(0 0 3px rgba(139, 92, 246, 0.3));
      animation: ai-pulse 2.5s ease-in-out infinite;

      .ai-sparkle-main {
        transform-origin: 12px 12px;
        animation: ai-rotate 6s linear infinite;
      }
      .ai-sparkle-small {
        transform-origin: 19px 6px;
        animation: ai-twinkle 2s ease-in-out infinite 0.5s;
      }
    }

    &:hover .ai-icon-svg {
      filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.5));
      animation: none;
      transform: scale(1.15);
      transition: transform 0.2s ease, filter 0.2s ease;

      .ai-sparkle-main {
        animation: ai-rotate 2s linear infinite;
      }
    }

    &.active .ai-icon-svg {
      filter: drop-shadow(0 0 5px rgba(99, 102, 241, 0.5));
    }
  }
}

@keyframes ai-pulse {
  0%, 100% {
    opacity: 0.85;
    filter: drop-shadow(0 0 2px rgba(139, 92, 246, 0.2));
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.45));
  }
}

@keyframes ai-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ai-twinkle {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.6); }
}

.content {
  flex: 1;
  min-width: 0;
  padding: 12px;
  font-size: 13px;
  @include overflow-overlay();

  &.no-padding {
    padding: 0;
    overflow: hidden;
  }
}
</style>
