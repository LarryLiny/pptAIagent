/**
 * Multi-type template extraction from existing PPT slides.
 * Analyzes all slides to classify them by type (cover, toc, title, content)
 * and extract layout templates for each type.
 */
import { useSlidesStore } from '@/store'
import { nanoid } from 'nanoid'
import type { Slide, SlideBackground, PPTTextElement, PPTElement } from '@/types/slides'

// Slide type classification
export type SlideType = 'cover' | 'toc' | 'title' | 'content' | 'unknown'

export interface ElementLayout {
  left: number; top: number; width: number; height: number
  fontSize: number; color: string; fontName: string; bold: boolean; align: string
}

export interface TypedTemplate {
  type: SlideType
  background: SlideBackground
  titleLayout?: ElementLayout
  bodyLayout?: ElementLayout
  decorativeElements: PPTElement[]
  sourceSlideIndex: number
}

// Cached templates — computed once on first access
let cachedTemplates: TypedTemplate[] | null = null

function extractFontInfo(html: string) {
  const fsMatch = html.match(/font-size:\s*(\d+(?:\.\d+)?)px/)
  const colorMatch = html.match(/(?<![background-])color:\s*(#[0-9a-fA-F]{3,8})/)
  const fontMatch = html.match(/font-family:\s*['"]?([^'";]+)/)
  const boldMatch = /font-weight:\s*bold/.test(html)
  const alignMatch = html.match(/text-align:\s*(\w+)/)
  return {
    fontSize: fsMatch ? parseFloat(fsMatch[1]) : 16,
    color: colorMatch ? colorMatch[1] : '#333333',
    fontName: fontMatch ? fontMatch[1] : '',
    bold: boldMatch,
    align: alignMatch ? alignMatch[1] : 'left',
  }
}

function getPlainText(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || ''
}

function safeColor(color: string, fallback: string): string {
  if (!color) return fallback
  const hex = color.replace('#', '')
  if (hex.length >= 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    if (r > 200 && g > 200 && b > 200) return fallback
  }
  return color
}

/**
 * Classify a slide by analyzing its text elements.
 */
function classifySlide(slide: Slide, index: number, total: number): SlideType {
  const textEls = slide.elements.filter(el => el.type === 'text') as PPTTextElement[]
  if (textEls.length === 0) return 'unknown'

  const texts = textEls.map(el => ({
    plain: getPlainText(el.content),
    font: extractFontInfo(el.content),
    el,
  }))

  // First slide is usually cover
  if (index === 0) return 'cover'
  // Last slide is often a thank-you/end page
  if (index === total - 1 && textEls.length <= 2) return 'cover'

  // TOC detection: multiple short items (3+), similar font sizes
  const shortTexts = texts.filter(t => t.plain.length < 30 && t.plain.length > 0)
  if (shortTexts.length >= 3) {
    const sizes = shortTexts.map(t => t.font.fontSize)
    const sameSize = sizes.every(s => Math.abs(s - sizes[0]) < 3)
    if (sameSize) return 'toc'
  }

  // Title-only: 1-2 text elements, all short, large font
  if (textEls.length <= 2 && texts.every(t => t.plain.length < 40)) {
    const maxFont = Math.max(...texts.map(t => t.font.fontSize))
    if (maxFont >= 24) return 'title'
  }

  // Content page: has both large (title) and smaller (body) text
  if (textEls.length >= 2) {
    const sorted = [...texts].sort((a, b) => a.el.top - b.el.top)
    const first = sorted[0]
    const rest = sorted.slice(1)
    if (first.font.fontSize > 20 && rest.some(r => r.plain.length > 30)) {
      return 'content'
    }
  }

  // Default: content
  return textEls.length >= 2 ? 'content' : 'title'
}

/**
 * Extract a typed template from a slide.
 */
function extractTypedTemplate(slide: Slide, type: SlideType, index: number): TypedTemplate {
  const textEls = slide.elements.filter(el => el.type === 'text') as PPTTextElement[]
  const sorted = [...textEls].sort((a, b) => a.top - b.top)
  const decoratives = slide.elements
    .filter(el => el.type === 'shape' || el.type === 'line')
    .filter(el => el.type !== 'shape' || !(el as any).text?.content)
    .slice(0, 5)
    .map(el => JSON.parse(JSON.stringify(el)))

  const bg: SlideBackground = slide.background
    ? JSON.parse(JSON.stringify(slide.background))
    : { type: 'solid', color: '#ffffff' }

  const template: TypedTemplate = {
    type, background: bg, decorativeElements: decoratives, sourceSlideIndex: index,
  }

  if (sorted.length >= 1) {
    const titleEl = sorted[0]
    const fi = extractFontInfo(titleEl.content)
    template.titleLayout = {
      left: titleEl.left, top: titleEl.top, width: titleEl.width, height: titleEl.height,
      fontSize: fi.fontSize, color: fi.color, fontName: fi.fontName, bold: fi.bold, align: fi.align,
    }
  }
  if (sorted.length >= 2) {
    const bodyEl = sorted[1]
    const fi = extractFontInfo(bodyEl.content)
    template.bodyLayout = {
      left: bodyEl.left, top: bodyEl.top, width: bodyEl.width, height: bodyEl.height,
      fontSize: fi.fontSize, color: fi.color, fontName: fi.fontName, bold: fi.bold, align: fi.align,
    }
  }

  return template
}

/**
 * Analyze all slides and extract templates by type. Cached after first call.
 */
export function analyzeTemplates(): TypedTemplate[] {
  if (cachedTemplates) return cachedTemplates

  const slidesStore = useSlidesStore()
  const slides = slidesStore.slides
  if (!slides.length) return []

  const templates: TypedTemplate[] = []
  const seenTypes = new Set<SlideType>()

  for (let i = 0; i < slides.length; i++) {
    const type = classifySlide(slides[i], i, slides.length)
    if (type !== 'unknown' && !seenTypes.has(type)) {
      seenTypes.add(type)
      templates.push(extractTypedTemplate(slides[i], type, i))
    }
  }

  cachedTemplates = templates
  return templates
}

/** Reset cache (call when slides change significantly) */
export function resetTemplateCache() {
  cachedTemplates = null
}

/**
 * Get the best template for a given content type.
 */
export function getTemplateForType(type: SlideType): TypedTemplate | null {
  const templates = analyzeTemplates()
  return templates.find(t => t.type === type) || templates.find(t => t.type === 'content') || null
}

/**
 * Describe all templates for LLM context (injected once at session start).
 */
export function describeTemplates(): string {
  const templates = analyzeTemplates()
  if (!templates.length) return '未检测到模板。'

  const lines: string[] = ['已分析当前PPT的页面模板：']
  for (const t of templates) {
    const bgDesc = t.background.type === 'solid' ? `纯色${t.background.color}` : t.background.type
    let desc = `[${t.type}] 背景:${bgDesc}`
    if (t.titleLayout) {
      desc += ` 标题:${t.titleLayout.color}/${t.titleLayout.bold ? '粗' : '常'}/${t.titleLayout.align}(字号自适应)`
    }
    if (t.bodyLayout) {
      desc += ` 正文:${t.bodyLayout.color}/${t.bodyLayout.align}(字号自适应)`
    }
    desc += ` 装饰:${t.decorativeElements.length}个`
    lines.push(desc)
  }
  lines.push('注意：字号会根据内容长度自动调整，内容少时字号大，内容多时字号小，无需在回复中指定字号。')
  return lines.join('\n')
}

/**
 * Dynamic font size adaptation based on content length.
 * Uses template size as maximum, scales down for longer content.
 */
function adaptTitleSize(title: string, maxSize: number): number {
  const len = title.length
  if (len <= 20) return Math.max(24, maxSize)
  if (len <= 40) return Math.max(22, Math.min(maxSize, 26))
  if (len <= 60) return Math.max(20, Math.min(maxSize, 22))
  return 20 // Very long title
}

function adaptBodySize(body: string, maxSize: number): number {
  const totalChars = body.length
  const lineCount = body.split('\n').filter(l => l.trim()).length

  // Estimate: how much content fits in the body area (~900×400px)
  // At 18px with 1.6 line height, roughly 20 lines × 50 chars = 1000 chars
  if (totalChars < 200 && lineCount <= 8) return Math.max(16, maxSize)
  if (totalChars < 400 && lineCount <= 12) return Math.max(15, Math.min(maxSize, 17))
  if (totalChars < 700 && lineCount <= 18) return Math.max(14, Math.min(maxSize, 16))
  if (totalChars < 1000) return Math.max(13, Math.min(maxSize, 15))
  return Math.max(12, Math.min(maxSize, 14)) // Very dense content
}

/**
 * Build a slide from a typed template + content.
 */
export function buildTemplatedSlide(title: string, body: string, _template?: any): Slide {
  // Determine content type
  let type: SlideType = 'content'
  if (title && !body) type = 'title'
  if (!title && body && body.split('\n').filter(l => l.trim()).length >= 4) {
    const lines = body.split('\n').filter(l => l.trim())
    if (lines.every(l => l.length < 40)) type = 'toc'
  }

  const template = getTemplateForType(type)
  const SLIDE_W = 1000, SLIDE_H = 562, MARGIN = 50
  const contentW = SLIDE_W - MARGIN * 2

  // Clamp helper: compute max available width from a given left position
  // Leave a small right margin (same as MARGIN) to keep content tidy
  const availableWidth = (left: number) => SLIDE_W - left - MARGIN

  // Colors and fonts from template (safe defaults)
  const titleColor = safeColor(template?.titleLayout?.color || '', '#2d2d2d')
  const bodyColor = safeColor(template?.bodyLayout?.color || '', '#444444')
  const titleFont = template?.titleLayout?.fontName || ''
  const bodyFont = template?.bodyLayout?.fontName || ''
  const titleBold = template?.titleLayout?.bold !== false
  const titleAlign = template?.titleLayout?.align || 'left'
  const bodyAlign = template?.bodyLayout?.align || 'left'

  // Template font sizes as MAX reference (not fixed)
  const templateTitleSize = template?.titleLayout?.fontSize || 28
  const templateBodySize = template?.bodyLayout?.fontSize || 18

  // Dynamic font sizing based on content length
  const titleSize = title ? adaptTitleSize(title, templateTitleSize) : templateTitleSize
  const bodySize = body ? adaptBodySize(body, templateBodySize) : templateBodySize

  const bg: SlideBackground = template?.background
    ? JSON.parse(JSON.stringify(template.background))
    : { type: 'solid', color: '#ffffff' }

  const elements: PPTElement[] = []

  // Copy decorative elements
  if (template?.decorativeElements) {
    for (const dec of template.decorativeElements) {
      elements.push({ ...dec, id: nanoid(10) } as PPTElement)
    }
  }

  const fn = (f: string) => f ? ` font-family: ${f};` : ''
  const titleH = titleSize <= 24 ? 44 : 52

  if (title && body) {
    const tl = template?.titleLayout
    const tLeft = tl ? tl.left : MARGIN
    const tTop = tl ? tl.top : MARGIN
    const tWidth = availableWidth(tLeft)

    elements.push({
      type: 'text', id: nanoid(10),
      left: tLeft, top: tTop, width: tWidth, height: titleH, rotate: 0,
      content: `<p style="text-align: ${titleAlign};"><span style="font-size: ${titleSize}px; color: ${titleColor}; ${titleBold ? 'font-weight: bold;' : ''}${fn(titleFont)}">${title}</span></p>`,
      defaultFontName: titleFont, defaultColor: titleColor,
      lineHeight: 1.3, fill: '', outline: { color: '', width: 0, style: 'solid' },
    } as PPTTextElement)

    const bl = template?.bodyLayout
    const bTop = bl ? bl.top : tTop + titleH + 16
    const bLeft = bl ? bl.left : MARGIN
    const bWidth = availableWidth(bLeft)
    const bHeight = SLIDE_H - bTop - 30
    // Adjust line height for dense content
    const lineHeight = bodySize <= 14 ? 1.4 : bodySize <= 16 ? 1.5 : 1.6

    elements.push({
      type: 'text', id: nanoid(10),
      left: bLeft, top: bTop, width: bWidth, height: bHeight, rotate: 0,
      content: bodyToHtml(body, bodySize, bodyColor, bodyFont, titleColor, bodyAlign),
      defaultFontName: bodyFont, defaultColor: bodyColor,
      lineHeight, paragraphSpace: bodySize <= 14 ? 2 : 4, fill: '', outline: { color: '', width: 0, style: 'solid' },
    } as PPTTextElement)
  }
  else if (title) {
    const tl = template?.titleLayout
    const tLeft = tl?.left || MARGIN
    const tWidth = availableWidth(tLeft)
    elements.push({
      type: 'text', id: nanoid(10),
      left: tLeft, top: (SLIDE_H - titleH) / 2,
      width: tWidth, height: titleH, rotate: 0,
      content: `<p style="text-align: center;"><span style="font-size: ${titleSize + 4}px; color: ${titleColor}; font-weight: bold;${fn(titleFont)}">${title}</span></p>`,
      defaultFontName: titleFont, defaultColor: titleColor,
      lineHeight: 1.3, fill: '', outline: { color: '', width: 0, style: 'solid' },
    } as PPTTextElement)
  }
  else if (body) {
    const bodyH = Math.min(SLIDE_H - MARGIN * 2, 420)
    const bodyTop = (SLIDE_H - bodyH) / 2
    elements.push({
      type: 'text', id: nanoid(10),
      left: MARGIN, top: bodyTop, width: contentW, height: bodyH, rotate: 0,
      content: bodyToHtml(body, bodySize, bodyColor, bodyFont, titleColor, bodyAlign),
      defaultFontName: bodyFont, defaultColor: bodyColor,
      lineHeight: 1.6, paragraphSpace: 4, fill: '', outline: { color: '', width: 0, style: 'solid' },
    } as PPTTextElement)
  }

  return { id: nanoid(10), elements, background: bg }
}

function bodyToHtml(body: string, fontSize: number, color: string, fontName: string, headingColor: string, align: string): string {
  return body.split('\n').filter(l => l.trim()).map(line => {
    let t = line.trim()
    const fn = fontName ? ` font-family: ${fontName};` : ''
    const isSubheading = t.match(/^#{2,3}\s+(.+)/)
    const isList = t.match(/^[-*+]\s+(.+)/) || t.match(/^\d+\.\s+(.+)/)

    if (isSubheading) {
      t = isSubheading[1].replace(/\*\*/g, '')
      return `<p style="text-align: ${align};"><span style="font-size: ${fontSize + 2}px; color: ${headingColor}; font-weight: bold;${fn}">${t}</span></p>`
    }
    if (isList) {
      t = (isList[1] || t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
      return `<p style="text-align: ${align}; text-indent: 1em;"><span style="font-size: ${fontSize}px; color: ${color};${fn}">• ${t}</span></p>`
    }
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
    return `<p style="text-align: ${align};"><span style="font-size: ${fontSize}px; color: ${color};${fn}">${t}</span></p>`
  }).join('')
}

// Legacy export for backward compatibility
export function extractTemplate() {
  return getTemplateForType('content') || {
    background: { type: 'solid' as const, color: '#ffffff' },
    titleStyle: { fontSize: 28, color: '#2d2d2d', fontName: '', bold: true, align: 'left', left: 50, top: 50, width: 900, height: 52 },
    bodyStyle: { fontSize: 18, color: '#444444', fontName: '', align: 'left', left: 50, top: 120, width: 900, height: 400, lineHeight: 1.6 },
    themeColor: '#5b9bd5',
    decorativeElements: [],
  }
}
