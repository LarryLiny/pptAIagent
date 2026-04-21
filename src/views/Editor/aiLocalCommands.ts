/**
 * Local command parser for simple PPT element operations.
 * Handles common format adjustments without calling LLM (zero latency, zero tokens).
 */
import { useSlidesStore, useMainStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
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

  const results: string[] = []
  // Track current content for chained text modifications
  let currentContent = textEl?.content || ''
  let contentChanged = false
  let propsChanged: Record<string, any> = {}

  // Helper: mark content as changed
  const updateContent = (newContent: string) => {
    currentContent = newContent
    contentChanged = true
  }

  // --- Font size ---
  const fontSizeMatch = text.match(/[字子]号[改调设]?[成整为到层]*\s*(\d+)/) || text.match(/font.?size\s*[:=]?\s*(\d+)/i)
  if (fontSizeMatch && textEl) {
    const size = parseInt(fontSizeMatch[1])
    if (size >= 8 && size <= 200) {
      updateContent(changeHtmlFontSize(currentContent, size))
      results.push(`字号→${size}px`)
    }
  }
  else if (/[字子]号.*(大|增大|放大|调大)/.test(text) && textEl) {
    const cur = parseInt(currentContent.match(/font-size:\s*(\d+)/)?.[1] || '16')
    updateContent(changeHtmlFontSize(currentContent, Math.min(200, cur + 4)))
    results.push(`字号增大`)
  }
  else if (/[字子]号.*(小|减小|缩小|调小)/.test(text) && textEl) {
    const cur = parseInt(currentContent.match(/font-size:\s*(\d+)/)?.[1] || '16')
    updateContent(changeHtmlFontSize(currentContent, Math.max(8, cur - 4)))
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
        updateContent(changeHtmlColor(currentContent, color))
        results.push(`颜色→${color}`)
        break
      }
    }
  }

  // --- Bold ---
  if (/取消加粗|去掉加粗|不加粗/.test(text) && textEl) {
    updateContent(changeHtmlBold(currentContent, false))
    results.push('取消加粗')
  }
  else if (/加粗|加醋|变粗|bold/.test(text) && textEl) {
    updateContent(changeHtmlBold(currentContent, true))
    results.push('加粗')
  }

  // --- Italic ---
  if (/取消斜体|去掉斜体/.test(text) && textEl) {
    updateContent(changeHtmlItalic(currentContent, false))
    results.push('取消斜体')
  }
  else if ((/斜体|倾斜|italic/.test(text)) && textEl) {
    updateContent(changeHtmlItalic(currentContent, true))
    results.push('斜体')
  }

  // --- Alignment ---
  if (/居中对齐|文字居中|剧中|center/.test(text) && textEl) {
    updateContent(changeHtmlAlign(currentContent, 'center'))
    results.push('居中')
  }
  else if (/左对齐|靠左/.test(text) && textEl) {
    updateContent(changeHtmlAlign(currentContent, 'left'))
    results.push('左对齐')
  }
  else if (/右对齐|靠右/.test(text) && textEl) {
    updateContent(changeHtmlAlign(currentContent, 'right'))
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

  // Apply content changes
  if (contentChanged && textEl) {
    propsChanged.content = currentContent
  }

  // Apply all property changes in one update
  if (Object.keys(propsChanged).length > 0 && el) {
    slidesStore.updateElement({ id: el.id, props: propsChanged as any })
  }

  addHistorySnapshot()
  return { handled: true, message: `已完成：${results.join('、')}` }
}
