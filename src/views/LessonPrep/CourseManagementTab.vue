<template>
  <div class="course-management-tab">
    <!-- Search bar -->
    <div class="toolbar">
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

    <!-- Course table -->
    <div class="table-wrapper">
      <table class="course-table">
        <thead>
          <tr>
            <th class="col-index">序号</th>
            <th class="col-name">教程名称</th>
            <th class="col-published">已发布班课</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(course, idx) in paginatedCourses" :key="course.id">
            <td class="col-index">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
            <td class="col-name">
              <span>{{ course.name }}</span>
              <span v-if="course.isOfficial" class="official-tag">官方教程</span>
            </td>
            <td class="col-published">{{ course.publishedClassCount }}</td>
            <td class="col-action">
              <button class="preview-btn">预览</button>
            </td>
          </tr>
          <tr v-if="filteredCourses.length === 0">
            <td colspan="4" class="empty-cell">未找到相关内容</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="filteredCourses.length > pageSize" class="pagination">
      <span class="pagination-info">
        第 {{ rangeStart }} - {{ rangeEnd }} 条 / 共 {{ filteredCourses.length }} 条
      </span>
      <div class="pagination-controls">
        <button
          class="page-btn arrow-btn"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          &lt;
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          class="page-btn"
          :class="{ active: page === currentPage }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button
          class="page-btn arrow-btn"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          &gt;
        </button>
        <span class="page-size-label">{{ pageSize }} 条/页</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import type { Course } from '@/types/lessonPrep'
import { getCourses } from '@/mock/lessonPrep'

const props = defineProps<{
  textbookId: string
}>()

const courses = ref<Course[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredCourses = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return courses.value
  return courses.value.filter(c => c.name.toLowerCase().includes(keyword))
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredCourses.value.length / pageSize.value))
)

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCourses.value.slice(start, start + pageSize.value)
})

const rangeStart = computed(() =>
  filteredCourses.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)

const rangeEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, filteredCourses.value.length)
)

async function loadCourses() {
  courses.value = await getCourses(props.textbookId)
  currentPage.value = 1
}

// Reset page when search changes
watch(searchKeyword, () => {
  currentPage.value = 1
})

// Reload when textbookId changes
watch(() => props.textbookId, () => {
  loadCourses()
})

onMounted(() => {
  loadCourses()
})
</script>

<style lang="scss" scoped>
.course-management-tab {
  padding: 0;
}

.toolbar {
  margin-bottom: 16px;
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

.table-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.course-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
  }

  thead tr {
    background: #fafafa;
  }

  th {
    font-weight: 600;
    color: #333;
    font-size: 13px;
  }

  td {
    color: #606266;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: #f5f7fa;
  }
}

.col-index {
  width: 70px;
}

.col-name {
  min-width: 200px;
}

.col-published {
  width: 120px;
}

.col-action {
  width: 100px;
}

.official-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 12px;
  color: #e6a23c;
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 10px;
  line-height: 1.4;
  vertical-align: middle;
}

.preview-btn {
  padding: 0;
  font-size: 14px;
  color: #409eff;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: #66b1ff;
  }
}

.empty-cell {
  text-align: center !important;
  color: #999;
  padding: 40px 16px !important;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 8px 0;
}

.pagination-info {
  font-size: 13px;
  color: #606266;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  font-size: 13px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled):not(.active) {
    color: #409eff;
    border-color: #409eff;
  }

  &.active {
    color: #fff;
    background: #409eff;
    border-color: #409eff;
  }

  &:disabled {
    color: #c0c4cc;
    cursor: not-allowed;
  }
}

.arrow-btn {
  font-weight: bold;
}

.page-size-label {
  margin-left: 8px;
  font-size: 13px;
  color: #606266;
}
</style>
