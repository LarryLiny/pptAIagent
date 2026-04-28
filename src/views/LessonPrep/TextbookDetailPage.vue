<template>
  <div class="textbook-detail-page">
    <!-- Error state: textbook not found -->
    <div v-if="notFound" class="not-found">
      <p>教材不存在，请返回 <router-link to="/lesson-prep">教材列表</router-link></p>
    </div>

    <!-- Normal content -->
    <template v-else>
      <!-- Tab bar -->
      <div class="tab-bar">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'course' }"
          @click="activeTab = 'course'"
        >
          教程管理
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'courseware' }"
          @click="activeTab = 'courseware'"
        >
          课件管理
        </div>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <CourseManagementTab
          v-if="activeTab === 'course'"
          :textbook-id="textbookId"
        />
        <CoursewareManagementTab
          v-else
          ref="coursewareTabRef"
          :textbook-id="textbookId"
          @open-chapter-modal="showChapterModal = true"
        />
      </div>

      <!-- Chapter select modal -->
      <ChapterSelectModal
        :visible="showChapterModal"
        :textbook-id="textbookId"
        :chapters="chapters"
        @close="showChapterModal = false"
        @confirm="handleChapterConfirm"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Textbook, Chapter, Courseware } from '@/types/lessonPrep'
import { getTextbooks, getChapters } from '@/mock/lessonPrep'
import CourseManagementTab from './CourseManagementTab.vue'
import CoursewareManagementTab from './CoursewareManagementTab.vue'
import ChapterSelectModal from './ChapterSelectModal.vue'

const route = useRoute()
const textbookId = route.params.textbookId as string

const activeTab = ref<'course' | 'courseware'>('course')
const notFound = ref(false)
const textbook = ref<Textbook | null>(null)
const chapters = ref<Chapter[]>([])
const showChapterModal = ref(false)
const coursewareTabRef = ref<InstanceType<typeof CoursewareManagementTab> | null>(null)

async function loadData() {
  const textbooks = await getTextbooks()
  const found = textbooks.find(t => t.id === textbookId)
  if (!found) {
    notFound.value = true
    return
  }
  textbook.value = found
  chapters.value = await getChapters(textbookId)
}

function handleChapterConfirm(chapterId: string) {
  const chapter = chapters.value.find(ch => ch.id === chapterId)
  if (!chapter) return

  const newCourseware: Courseware = {
    id: String(Date.now()),
    textbookId,
    name: chapter.name + ' 课件',
    courseName: chapter.name,
  }

  coursewareTabRef.value?.addCourseware(newCourseware)
  showChapterModal.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.textbook-detail-page {
  background: #fff;
  border-radius: 4px;
  min-height: 400px;
}

.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  font-size: 14px;
  color: #909399;

  a {
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
}

.tab-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;

  &:hover {
    color: #409eff;
  }

  &.active {
    color: #409eff;
    font-weight: 500;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 20px;
      right: 20px;
      height: 2px;
      background: #409eff;
      border-radius: 1px;
    }
  }
}

.tab-content {
  padding: 20px 24px;
}
</style>
