import type { Textbook, Course, Courseware, Chapter } from '@/types/lessonPrep'

/**
 * 备授课管理 Mock 数据服务
 * 封装 fetch 调用加载 public/mocks/ 下的 JSON 文件
 */

export async function getTextbooks(): Promise<Textbook[]> {
  try {
    const res = await fetch('./mocks/textbooks.json')
    const data: Textbook[] = await res.json()
    return data
  }
  catch {
    return []
  }
}

export async function getCourses(textbookId: string): Promise<Course[]> {
  try {
    const res = await fetch('./mocks/courses.json')
    const data: Course[] = await res.json()
    return data.filter(c => c.textbookId === textbookId)
  }
  catch {
    return []
  }
}

export async function getCoursewares(textbookId: string): Promise<Courseware[]> {
  try {
    const res = await fetch('./mocks/coursewares.json')
    const data: Courseware[] = await res.json()
    return data.filter(cw => cw.textbookId === textbookId)
  }
  catch {
    return []
  }
}

export async function getChapters(textbookId: string): Promise<Chapter[]> {
  try {
    const res = await fetch('./mocks/chapters.json')
    const data: Chapter[] = await res.json()
    return data.filter(ch => ch.textbookId === textbookId)
  }
  catch {
    return []
  }
}
