/**
 * Local command parser for simple PPT element operations.
 * Handles common format adjustments without calling LLM (zero latency, zero tokens).
 */
import { useSlidesStore, useMainStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import emitter, { EmitterEvents } from '@/utils/emitter'
import type { RichTextAction } from '@/utils/emitter'
import type { PPTTextElement, PPTShapeElement } from '@/types/slides'

// Color name → hex mapping
const COLOR_MAP: Record<string, string> = {
  '红': '#ff0000', '红色': '#ff0000', '大红': '#ff0000',
  '蓝': '#0066ff', '蓝色': '#0066ff', '深蓝': '#003399', '浅蓝': '#66b3ff',
  '绿': '#00aa00', '绿色': '#00aa00', '深绿': '#006600',
  '黄': '#ffcc00', '黄色': '#ffcc00',
  '橙': '#ff8800', '橙色': '#ff8800', '橘色': '#ff8800',
  '紫': '#9933ff', '紫色': '#9933ff',
  '粉': '#ff66b2', '粉色': '#ff66b2', '粉红': '#ff66b2',
  '黑': '#000000', '黑色': '#000000',
  '白': '#ffffff', '白色': '#ffffff',
  '灰': '#888888', '灰色': '#888888', '深灰': '#555555', '浅灰': '#cccccc',
  '棕': '#8b4513', '棕色': '#8b4513',
  'red': '#ff0000', 'blue': '#0066ff', 'green': '#00aa00',
  'yellow': '#ffcc00', 'orange': '#ff8800', 'purple': '#9933ff',
  'pink': '#ff66b2', 'black': '#000000', 'white': '#ffffff',
  'gray': '#888888', 'grey': '#888888',
}

function resolveColor(text: string): string | null {
  // Direct hex
  const hexMatch = text.match(/#[0-9a-fA-F]{3,8}/)
  if (hexMatch) return hexMatch[0]
  // Named color
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (text.includes(name)) return hex
  }
  return null
}

function getSelectedTextElement(): PPTTextElement | null {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const elId = mainStore.handleElementId
  if (!elId) return null
  const el = slidesStore.currentSlide?.elements.find(e => e.id === elId)
  if (!el || el.type !== 'text') return null
  return el as PPTTextElement
}

function getSelectedElement() {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const elId = mainStore.handleElementId
  if (!elId) return null
  return slidesStore.currentSlide?.elements.find(e => e.id === elId) || null
}

// Modify all font-size values in HTML content
function changeHtmlFontSize(html: string, newSize: number): string {
  return html.replace(/font-size:\s*[\d.]+px/g, `font-size: ${newSize}px`)
}

// Modify all color values in HTML content
function changeHtmlColor(html: string, newColor: string): string {
  return html.replace(/(?<![background-])color:\s*#[0-9a-fA-F]{3,8}/g, `color: ${newColor}`)
    .replace(/(?<![background-])color:\s*rgb\([^)]+\)/g, `color: ${newColor}`)
}

// Add or remove bold
function changeHtmlBold(html: string, bold: boolean): string {
  if (bold) {
    // Add font-weight: bold to all spans
    return html.replace(/<span\s+style="([^"]*)">/g, (match, style) => {
      if (style.includes('font-weight')) {
        return match.replace(/font-weight:\s*\w+/, 'font-weight: bold')
      }
      return `<span style="${style} font-weight: bold;">`
    })
  }
  else {
    return html.replace(/\s*font-weight:\s*bold;?/g, '')
  }
}

// Add or remove italic
function changeHtmlItalic(html: string, italic: boolean): string {
  if (italic) {
    return html.replace(/<span\s+style="([^"]*)">/g, (match, style) => {
      if (style.includes('font-style')) {
        return match.replace(/font-style:\s*\w+/, 'font-style: italic')
      }
      return `<span style="${style} font-style: italic;">`
    })
  }
  else {
    return html.replace(/\s*font-style:\s*italic;?/g, '')
  }
}

// Change text-align in all paragraphs
function changeHtmlAlign(html: string, align: string): string {
  return html.replace(/text-align:\s*\w+/g, `text-align: ${align}`)
}

export interface LocalCommandResult {
  handled: boolean
  message: string
}

/**
 * Check if a ProseMirror editor is currently focused (user is editing text inline).
 * When focused, we can use emitter commands that respect text selection.
 */
function isProsemirrorActive(): boolean {
  const active = document.activeElement
  if (!active) return false
  return !!active.closest('.prosemirror-editor')
}

/**
 * Send a rich text command via emitter to the active ProseMirror editor.
 * This respects the current text selection — only selected text is affected.
 */
function emitRichTextCommand(action: RichTextAction | RichTextAction[]) {
  emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, { action })
}

/**
 * Optimize the layout of the current slide.
 * Analyzes text elements to determine page type (TOC vs title+content),
 * then adjusts font sizes, widths, and alignment accordingly.
 */
function optimizeCurrentSlideLayout(
  slidesStore: ReturnType<typeof useSlidesStore>,
  addHistorySnapshot: () => void,
): LocalCommandResult {
  const slide = slidesStore.currentSlide
  if (!slide) return { handled: true, message: '当前没有幻灯片' }

  const SLIDE_W = 1000
  const SLIDE_H = 562
  const MARGIN = 50

  const textEls = slide.elements.filter(e => e.type === 'text') as PPTTextElement[]
  if (textEls.length === 0) return { handled: true, message: '当前页没有文本元素，无需优化' }

  // Extract plain text from HTML
  const getPlain = (html: string) => {
    const d = document.createElement('div')
    d.innerHTML = html
    return d.textContent || ''
  }

  // Sort by vertical position (top first)
  const sorted = [...textEls].sort((a, b) => a.top - b.top)
  const texts = sorted.map(el => ({ el, plain: getPlain(el.content) }))

  // Classify page type
  // TOC: all text elements are short (< 40 chars) and there are 3+ of them
  const allShort = texts.every(t => t.plain.length < 40)
  const isTOC = allShort && texts.length >= 3

  // Title + content: first element is short (title), rest is longer content
  // Or just 2 elements: title + body
  const isTitleContent = !isTOC && texts.length >= 2 && texts[0].plain.length < 50

  const changes: string[] = []

  if (isTOC) {
    // --- TOC mode: all items 40px, centered ---
    for (const { el } of texts) {
      const newContent = changeHtmlFontSize(el.content, 40)
      const centeredContent = changeHtmlAlign(newContent, 'center')
      // Center horizontally: width = SLIDE_W - 2*MARGIN, left = MARGIN
      slidesStore.updateElement({
        id: el.id,
        props: {
          content: centeredContent,
          left: MARGIN,
          width: SLIDE_W - MARGIN * 2,
        } as any,
      })
    }

    // Distribute vertically: evenly space all elements
    const totalElements = texts.length
    const itemHeight = 60 // estimated height per item at 40px
    const totalHeight = totalElements * itemHeight
    const startY = Math.max(MARGIN, (SLIDE_H - totalHeight) / 2)
    const gap = totalElements > 1 ? (SLIDE_H - startY * 2 - itemHeight) / (totalElements - 1) : 0

    for (let i = 0; i < sorted.length; i++) {
      const el = sorted[i]
      const newTop = totalElements === 1 ? (SLIDE_H - itemHeight) / 2 : startY + i * gap
      slidesStore.updateElement({
        id: el.id,
        props: { top: Math.round(newTop), height: itemHeight } as any,
      })
    }
    changes.push(`目录模式：${totalElements} 个条目，字号 40px，居中排列`)
  }
  else if (isTitleContent) {
    // --- Title + Content mode ---
    const titleEl = sorted[0]
    const contentEls = sorted.slice(1)

    // Title: 40px, full width from its left position
    const titleLeft = titleEl.left
    const titleWidth = SLIDE_W - titleLeft - MARGIN
    const newTitleContent = changeHtmlFontSize(titleEl.content, 40)
    slidesStore.updateElement({
      id: titleEl.id,
      props: {
        content: newTitleContent,
        width: titleWidth,
        height: 68,
      } as any,
    })
    changes.push('标题：40px')

    // Content elements: adaptive font size 24-32px
    for (const contentEl of contentEls) {
      const plain = getPlain(contentEl.content)
      const contentLeft = contentEl.left
      const contentWidth = SLIDE_W - contentLeft - MARGIN
      const availHeight = SLIDE_H - contentEl.top - 30

      // Estimate best font size (32px default, shrink if needed)
      const lines = plain.split(/\n/).filter(l => l.trim())
      const longestLine = lines.reduce((max, l) => l.length > max.length ? l : max, '')
      let fontSize = 32

      while (fontSize > 24) {
        // Check horizontal: estimate if longest line fits
        let estWidth = 0
        for (const ch of longestLine) {
          estWidth += /[\u4e00-\u9fff]/.test(ch) ? fontSize : fontSize * 0.55
        }
        // Check vertical: estimate total height
        const lineHeight = fontSize <= 24 ? 1.4 : fontSize <= 28 ? 1.5 : 1.6
        const estHeight = lines.length * fontSize * lineHeight

        if (estWidth <= contentWidth && estHeight <= availHeight) break
        fontSize -= 2
      }
      fontSize = Math.max(24, fontSize)

      const newContent = changeHtmlFontSize(contentEl.content, fontSize)
      slidesStore.updateElement({
        id: contentEl.id,
        props: {
          content: newContent,
          width: contentWidth,
        } as any,
      })
      changes.push(`内容：${fontSize}px`)
    }
  }
  else {
    // --- Single element or unclear structure: just fix widths ---
    for (const { el } of texts) {
      const elWidth = SLIDE_W - el.left - MARGIN
      if (el.width > elWidth || el.left + el.width > SLIDE_W) {
        slidesStore.updateElement({
          id: el.id,
          props: { width: elWidth } as any,
        })
        changes.push(`修正宽度：${el.id}`)
      }
    }
    if (changes.length === 0) {
      return { handled: true, message: '当前页布局已经合理，无需调整' }
    }
  }

  addHistorySnapshot()
  return { handled: true, message: `布局优化完成：${changes.join('、')}` }
}

/**
 * Try to parse and execute a local command.
 * Returns { handled: true, message } if handled locally.
 * Returns { handled: false } if should be sent to LLM.
 */
export function tryLocalCommand(input: string): LocalCommandResult {
  const slidesStore = useSlidesStore()
  const { addHistorySnapshot } = useHistorySnapshot()
  const text = input.trim()
  const el = getSelectedElement()
  const textEl = getSelectedTextElement()
  const pmActive = isProsemirrorActive()

  const results: string[] = []
  // Rich text commands to emit (when ProseMirror is active)
  const richTextActions: RichTextAction[] = []
  // Track current content for chained text modifications (fallback mode)
  let currentContent = textEl?.content || ''
  let contentChanged = false
  let propsChanged: Record<string, any> = {}

  // Helper: mark content as changed (fallback HTML mode)
  const updateContent = (newContent: string) => {
    currentContent = newContent
    contentChanged = true
  }

  // --- Font size ---
  const fontSizeMatch = text.match(/[字子]号[改调设]?[成整为到层]*\s*(\d+)/) || text.match(/font.?size\s*[:=]?\s*(\d+)/i)
  if (fontSizeMatch && textEl) {
    const size = parseInt(fontSizeMatch[1])
    if (size >= 8 && size <= 200) {
      if (pmActive) {
        richTextActions.push({ command: 'fontsize', value: size + 'px' })
      }
      else {
        updateContent(changeHtmlFontSize(currentContent, size))
      }
      results.push(`字号→${size}px`)
    }
  }
  else if (/[字子]号.*(大|增大|放大|调大)/.test(text) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'fontsize-add', value: '4' })
    }
    else {
      const cur = parseInt(currentContent.match(/font-size:\s*(\d+)/)?.[1] || '16')
      updateContent(changeHtmlFontSize(currentContent, Math.min(200, cur + 4)))
    }
    results.push(`字号增大`)
  }
  else if (/[字子]号.*(小|减小|缩小|调小)/.test(text) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'fontsize-reduce', value: '4' })
    }
    else {
      const cur = parseInt(currentContent.match(/font-size:\s*(\d+)/)?.[1] || '16')
      updateContent(changeHtmlFontSize(currentContent, Math.max(8, cur - 4)))
    }
    results.push(`字号减小`)
  }

  // --- Text color ---
  const colorPatterns = [
    text.match(/(?:文字|字体|文本|字)?颜?色?[改调设]?[成整为到层]*\s*(红色?|蓝色?|绿色?|黄色?|橙色?|紫色?|粉色?|黑色?|白色?|灰色?|棕色?|深蓝|浅蓝|深绿|深灰|浅灰|#[0-9a-fA-F]{3,8})/),
    text.match(/(?:改|变|换)[成为到层]?\s*(红色?|蓝色?|绿色?|黄色?|橙色?|紫色?|粉色?|黑色?|白色?|灰色?|#[0-9a-fA-F]{3,8})/)
  ]
  for (const m of colorPatterns) {
    if (m && textEl && !results.some(r => r.includes('颜色'))) {
      const color = resolveColor(m[1])
      if (color) {
        if (pmActive) {
          richTextActions.push({ command: 'color', value: color })
        }
        else {
          updateContent(changeHtmlColor(currentContent, color))
        }
        results.push(`颜色→${color}`)
        break
      }
    }
  }

  // --- Bold ---
  if (/取消加粗|去掉加粗|不加粗/.test(text) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'bold' })
    }
    else {
      updateContent(changeHtmlBold(currentContent, false))
    }
    results.push('取消加粗')
  }
  else if (/加粗|加醋|变粗|bold/.test(text) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'bold' })
    }
    else {
      updateContent(changeHtmlBold(currentContent, true))
    }
    results.push('加粗')
  }

  // --- Italic ---
  if (/取消斜体|去掉斜体/.test(text) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'em' })
    }
    else {
      updateContent(changeHtmlItalic(currentContent, false))
    }
    results.push('取消斜体')
  }
  else if ((/斜体|倾斜|italic/.test(text)) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'em' })
    }
    else {
      updateContent(changeHtmlItalic(currentContent, true))
    }
    results.push('斜体')
  }

  // --- Alignment ---
  if (/居中对齐|文字居中|剧中|center/.test(text) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'align', value: 'center' })
    }
    else {
      updateContent(changeHtmlAlign(currentContent, 'center'))
    }
    results.push('居中')
  }
  else if (/左对齐|靠左/.test(text) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'align', value: 'left' })
    }
    else {
      updateContent(changeHtmlAlign(currentContent, 'left'))
    }
    results.push('左对齐')
  }
  else if (/右对齐|靠右/.test(text) && textEl) {
    if (pmActive) {
      richTextActions.push({ command: 'align', value: 'right' })
    }
    else {
      updateContent(changeHtmlAlign(currentContent, 'right'))
    }
    results.push('右对齐')
  }

  // --- Element size ---
  const widthMatch = text.match(/宽度?[改调设]?[成整为到]*\s*(\d+)/)
  if (widthMatch && el) {
    propsChanged.width = parseInt(widthMatch[1])
    results.push(`宽度→${widthMatch[1]}px`)
  }
  const heightMatch = text.match(/高度?[改调设]?[成整为到]*\s*(\d+)/)
  if (heightMatch && el) {
    propsChanged.height = parseInt(heightMatch[1])
    results.push(`高度→${heightMatch[1]}px`)
  }
  if (/放大|变大|enlarge/.test(text) && el && !widthMatch) {
    propsChanged.width = Math.round(el.width * 1.2)
    propsChanged.height = Math.round(el.height * 1.2)
    results.push('放大20%')
  }
  if (/缩小|变小|shrink/.test(text) && el && !widthMatch) {
    propsChanged.width = Math.round(el.width * 0.8)
    propsChanged.height = Math.round(el.height * 0.8)
    results.push('缩小20%')
  }

  // --- Line height ---
  const lhMatch = text.match(/行[高距间][改调设]?[成整为到]*\s*([\d.]+)/)
  if (lhMatch && textEl) {
    propsChanged.lineHeight = parseFloat(lhMatch[1])
    results.push(`行高→${lhMatch[1]}`)
  }

  // --- Opacity ---
  const opacityMatch = text.match(/(?:透明度|不透明度)[改调设]?[成整为到]*\s*([\d.]+)/)
  if (opacityMatch && el) {
    let val = parseFloat(opacityMatch[1])
    if (val > 1) val = val / 100
    propsChanged.opacity = val
    results.push(`透明度→${val}`)
  }

  // --- Background color (page level, not element) ---
  const bgMatch = text.match(/背景[色颜]?[改调设]?[成整为到]*\s*(.+)/)
  if (bgMatch) {
    const color = resolveColor(bgMatch[1])
    if (color) {
      slidesStore.updateSlide({ background: { type: 'solid', color } })
      results.push(`背景→${color}`)
    }
  }

  // --- Fill color ---
  const fillMatch = text.match(/(?:填充|元素背景)[色颜]?[改调设]?[成整为到]*\s*(.+)/)
  if (fillMatch && el && (el.type === 'text' || el.type === 'shape')) {
    const color = resolveColor(fillMatch[1])
    if (color) {
      propsChanged.fill = color
      results.push(`填充→${color}`)
    }
  }

  // --- Optimize layout (page-level, exclusive command) ---
  if (/优化.{0,2}布局|调整.{0,2}布局|排版优化|优化.{0,2}排版|整理.{0,2}布局/.test(text) && results.length === 0) {
    return optimizeCurrentSlideLayout(slidesStore, addHistorySnapshot)
  }

  // --- Delete (exclusive — don't combine with other ops) ---
  if (/删除|移除|去掉这个|remove|delete/.test(text) && el && results.length === 0) {
    slidesStore.deleteElement(el.id)
    addHistorySnapshot()
    return { handled: true, message: '已删除该元素' }
  }

  // --- Position (element level centering) ---
  if (/水平居中/.test(text) && el && !textEl) {
    propsChanged.left = (1000 - el.width) / 2
    results.push('水平居中')
  }
  if (/垂直居中/.test(text) && el) {
    propsChanged.top = (562 - el.height) / 2
    results.push('垂直居中')
  }

  // --- Execute all collected changes ---
  if (results.length === 0) {
    return { handled: false, message: '' }
  }

  // If ProseMirror is active and we have rich text actions, emit them
  // This respects the user's text selection — only selected text is affected
  if (pmActive && richTextActions.length > 0) {
    emitRichTextCommand(richTextActions)
  }

  // Apply content changes (fallback HTML mode, only when PM is not active)
  if (!pmActive && contentChanged && textEl) {
    propsChanged.content = currentContent
  }

  // Apply all property changes in one update
  if (Object.keys(propsChanged).length > 0 && el) {
    slidesStore.updateElement({ id: el.id, props: propsChanged as any })
  }

  if (!pmActive) addHistorySnapshot()
  return { handled: true, message: `已完成：${results.join('、')}` }
}
