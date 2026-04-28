import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const ManagementLayout = () => import('@/views/LessonPrep/ManagementLayout.vue')
const TextbookListPage = () => import('@/views/LessonPrep/TextbookListPage.vue')
const TextbookDetailPage = () => import('@/views/LessonPrep/TextbookDetailPage.vue')
const PlaceholderPage = () => import('@/views/LessonPrep/PlaceholderPage.vue')
const EditorView = () => import('@/views/Editor/EditorView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/lesson-prep',
  },
  {
    path: '/lesson-prep',
    component: ManagementLayout,
    children: [
      {
        path: '',
        name: 'TextbookList',
        component: TextbookListPage,
      },
      {
        path: ':textbookId',
        name: 'TextbookDetail',
        component: TextbookDetailPage,
      },
    ],
  },
  {
    path: '/editor/:coursewareId?',
    name: 'Editor',
    component: EditorView,
  },
  {
    path: '/placeholder/:menuKey',
    component: ManagementLayout,
    children: [
      {
        path: '',
        name: 'Placeholder',
        component: PlaceholderPage,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/lesson-prep',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
