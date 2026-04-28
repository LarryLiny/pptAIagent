<template>
  <div class="courseware-management-tab">
    <!-- Toolbar: search + action buttons -->
    <div class="toolbar">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 20 20" width="16" height="16">
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="#999" stroke-width="1.5" />
          <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="#999" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="请输入课件名称"
          class="search-input"
        />
      </div>
      <div class="action-buttons">
        <button class="btn-upload" @click="handleUpload">
          <svg class="btn-icon" viewBox="0 0 20 20" width="14" height="14">
            <path d="M10 3v10M6 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          上传本地课件
        </button>
        <button class="btn-create" @click="emit('open-chapter-modal')">
          新建在线课件
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredCoursewares.length === 0 && !searchKeyword.trim()" class="empty-state">
      <svg class="empty-illustration" viewBox="0 0 200 160" width="200" height="160">
        <rect x="50" y="30" width="100" height="80" rx="8" fill="#f0f2f5" stroke="#dcdfe6" stroke-width="1.5" />
        <rect x="62" y="50" width="50" height="4" rx="2" fill="#c0c4cc" />
        <rect x="62" y="60" width="76" height="4" rx="2" fill="#dcdfe6" />
        <rect x="62" y="70" width="60" height="4" rx="2" fill="#dcdfe6" />
        <rect x="62" y="80" width="40" height="4" rx="2" fill="#e4e7ed" />
        <circle cx="130" cy="50" r="8" fill="#e6f0ff" stroke="#409eff" stroke-width="1" />
        <path d="M128 50h4M130 48v4" stroke="#409eff" stroke-width="1.2" stroke-linecap="round" />
        <ellipse cx="100" cy="125" rx="60" ry="8" fill="#f5f7fa" />
      </svg>
      <p class="empty-text">暂无课件</p>
    </div>

    <!-- Search empty state -->
    <div v-else-if="filteredCoursewares.length === 0 && searchKeyword.trim()" class="table-wrapper">
      <table class="courseware-table">
        <thead>
          <tr>
            <th class="col-index">序号</th>
            <th class="col-name">课件名称</th>
            <th class="col-course">教程名称</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="4" class="empty-cell">未找到相关内容</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Courseware table -->
    <div v-else class="table-wrapper">
      <table class="courseware-table">
        <thead>
          <tr>
            <th class="col-index">序号</th>
            <th class="col-name">课件名称</th>
            <th class="col-course">教程名称</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cw, idx) in filteredCoursewares" :key="cw.id">
            <td class="col-index">{{ idx + 1 }}</td>
            <td class="col-name">{{ cw.name }}</td>
            <td class="col-course">{{ cw.courseName }}</td>
            <td class="col-action">
              <button class="action-link" @click="handleEdit(cw.id)">编辑</button>
              <button class="action-link" @click="handlePreview(cw.id)">预览</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Courseware } from '@/types/lessonPrep'
import { getCoursewares } from '@/mock/lessonPrep'

const props = defineProps<{
  textbookId: string
}>()

const emit = defineEmits<{
  (e: 'open-chapter-modal'): void
}>()

const router = useRouter()
const coursewares = ref<Courseware[]>([])
const searchKeyword = ref('')

const filteredCoursewares = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return coursewares.value
  return coursewares.value.filter(cw => cw.name.toLowerCase().includes(keyword))
})

async function loadCoursewares() {
  coursewares.value = await getCoursewares(props.textbookId)
}

function handleEdit(coursewareId: string) {
  router.push(`/editor/${coursewareId}`)
}

function handlePreview(_coursewareId: string) {
  // Placeholder action for preview
}

function handleUpload() {
  // Placeholder action for local upload
}

function addCourseware(courseware: Courseware) {
  coursewares.value.push(courseware)
}

watch(() => props.textbookId, () => {
  loadCoursewares()
})

onMounted(() => {
  loadCoursewares()
})

defineExpose({ addCourseware })
</script>

<style lang="scss" scoped>
.courseware-management-tab {
  padding: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
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

.btn-icon {
  flex-shrink: 0;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  color: #fff;
  background: #409eff;
  border: 1px solid #409eff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #66b1ff;
    border-color: #66b1ff;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-illustration {
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.table-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.courseware-table {
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

.col-course {
  min-width: 160px;
}

.col-action {
  width: 120px;
}

.action-link {
  padding: 0;
  font-size: 14px;
  color: #409eff;
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 12px;

  &:hover {
    color: #66b1ff;
  }

  &:last-child {
    margin-right: 0;
  }
}

.empty-cell {
  text-align: center !important;
  color: #999;
  padding: 40px 16px !important;
}
</style>
