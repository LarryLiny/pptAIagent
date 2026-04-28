/** 教材 */
export interface Textbook {
  id: string
  name: string
  coverImage: string
  coursewareCount: number
  isFavorited: boolean
  isDelisted: boolean
}

/** 教程 */
export interface Course {
  id: string
  textbookId: string
  name: string
  isOfficial: boolean
  publishedClassCount: number
}

/** 课件 */
export interface Courseware {
  id: string
  textbookId: string
  name: string
  courseName: string
  slideData?: any
}

/** 章节 */
export interface Chapter {
  id: string
  textbookId: string
  name: string
  orderIndex: number
}

/** 侧边栏菜单项 */
export interface MenuItem {
  key: string
  label: string
  icon?: string
  route?: string
  children?: MenuItem[]
}

/** 面包屑项 */
export interface BreadcrumbItem {
  label: string
  route?: string
}
