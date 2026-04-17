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

  // --- Font size ---
  // "字号改成30" "字号30" "font size 30" "字号调整为24px" "字号大一点" "字号小一点"
  const fontSizeMatch = text.match(/字号[改调设]?[成整为到]*\s*(\d+)/) || text.match(/font.?size\s*[:=]?\s*(\d+)/i)
  if (fontSizeMatch && textEl) {
    const size = parseInt(fontSizeMatch[1])
    if (size >= 8 && size <= 200) {
      const newContent = changeHtmlFontSize(textEl.content, size)
      slidesStore.updateElement({ id: textEl.id, props: { content: newContent } as any })
      addHistorySnapshot()
      return { handled: true, message: `已将字号调整为 ${size}px` }
    }
  }
  if (/字号.*(大|增大|放大|调大)/.test(text) && textEl) {
    const currentSize = parseInt(textEl.content.match(/font-size:\s*(\d+)/)?.[1] || '16')
    const newSize = Math.min(200, currentSize + 4)
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlFontSize(textEl.content, newSize) } as any })
    addHistorySnapshot()
    return { handled: true, message: `已将字号从 ${currentSize}px 增大到 ${newSize}px` }
  }
  if (/字号.*(小|减小|缩小|调小)/.test(text) && textEl) {
    const currentSize = parseInt(textEl.content.match(/font-size:\s*(\d+)/)?.[1] || '16')
    const newSize = Math.max(8, currentSize - 4)
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlFontSize(textEl.content, newSize) } as any })
    addHistorySnapshot()
    return { handled: true, message: `已将字号从 ${currentSize}px 减小到 ${newSize}px` }
  }

  // --- Text color ---
  // "颜色改成红色" "文字颜色改为#ff0000" "字体颜色红色"
  const colorCmd = text.match(/(?:文字|字体|文本)?颜色[改调设]?[成整为到]*\s*(.+)/)
  if (colorCmd && textEl) {
    const color = resolveColor(colorCmd[1])
    if (color) {
      slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlColor(textEl.content, color) } as any })
      addHistorySnapshot()
      return { handled: true, message: `已将文字颜色改为 ${color}` }
    }
  }
  // "改成红色" (without 颜色 prefix, if selected text element)
  if (/[改调设][成整为到]/.test(text) && textEl) {
    const color = resolveColor(text)
    if (color && !fontSizeMatch && !/字号|大小|宽|高|位置|背景/.test(text)) {
      slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlColor(textEl.content, color) } as any })
      addHistorySnapshot()
      return { handled: true, message: `已将文字颜色改为 ${color}` }
    }
  }

  // --- Bold ---
  if (/加粗|变粗|bold/.test(text) && textEl) {
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlBold(textEl.content, true) } as any })
    addHistorySnapshot()
    return { handled: true, message: '已加粗' }
  }
  if (/取消加粗|去掉加粗|不加粗|unbold/.test(text) && textEl) {
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlBold(textEl.content, false) } as any })
    addHistorySnapshot()
    return { handled: true, message: '已取消加粗' }
  }

  // --- Italic ---
  if (/斜体|倾斜|italic/.test(text) && !/取消|去掉/.test(text) && textEl) {
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlItalic(textEl.content, true) } as any })
    addHistorySnapshot()
    return { handled: true, message: '已设为斜体' }
  }
  if (/取消斜体|去掉斜体/.test(text) && textEl) {
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlItalic(textEl.content, false) } as any })
    addHistorySnapshot()
    return { handled: true, message: '已取消斜体' }
  }

  // --- Alignment ---
  if (/居中|center/.test(text) && !/垂直/.test(text) && textEl) {
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlAlign(textEl.content, 'center') } as any })
    addHistorySnapshot()
    return { handled: true, message: '已居中对齐' }
  }
  if (/左对齐|靠左/.test(text) && textEl) {
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlAlign(textEl.content, 'left') } as any })
    addHistorySnapshot()
    return { handled: true, message: '已左对齐' }
  }
  if (/右对齐|靠右/.test(text) && textEl) {
    slidesStore.updateElement({ id: textEl.id, props: { content: changeHtmlAlign(textEl.content, 'right') } as any })
    addHistorySnapshot()
    return { handled: true, message: '已右对齐' }
  }

  // --- Element size ---
  const widthMatch = text.match(/宽度?[改调设]?[成整为到]*\s*(\d+)/)
  if (widthMatch && el) {
    slidesStore.updateElement({ id: el.id, props: { width: parseInt(widthMatch[1]) } as any })
    addHistorySnapshot()
    return { handled: true, message: `已将宽度调整为 ${widthMatch[1]}px` }
  }
  const heightMatch = text.match(/高度?[改调设]?[成整为到]*\s*(\d+)/)
  if (heightMatch && el) {
    slidesStore.updateElement({ id: el.id, props: { height: parseInt(heightMatch[1]) } as any })
    addHistorySnapshot()
    return { handled: true, message: `已将高度调整为 ${heightMatch[1]}px` }
  }

  // "放大" "缩小"
  if (/放大|变大|enlarge/.test(text) && el) {
    slidesStore.updateElement({ id: el.id, props: { width: Math.round(el.width * 1.2), height: Math.round(el.height * 1.2) } as any })
    addHistorySnapshot()
    return { handled: true, message: '已放大 20%' }
  }
  if (/缩小|变小|shrink/.test(text) && el) {
    slidesStore.updateElement({ id: el.id, props: { width: Math.round(el.width * 0.8), height: Math.round(el.height * 0.8) } as any })
    addHistorySnapshot()
    return { handled: true, message: '已缩小 20%' }
  }

  // --- Position ---
  if (/居中|水平居中/.test(text) && !/文字|对齐/.test(text) && el) {
    slidesStore.updateElement({ id: el.id, props: { left: (1000 - el.width) / 2 } as any })
    addHistorySnapshot()
    return { handled: true, message: '已水平居中' }
  }
  if (/垂直居中/.test(text) && el) {
    slidesStore.updateElement({ id: el.id, props: { top: (562 - el.height) / 2 } as any })
    addHistorySnapshot()
    return { handled: true, message: '已垂直居中' }
  }

  // --- Background color ---
  const bgMatch = text.match(/背景[色颜]?[改调设]?[成整为到]*\s*(.+)/)
  if (bgMatch) {
    const color = resolveColor(bgMatch[1])
    if (color) {
      slidesStore.updateSlide({ background: { type: 'solid', color } })
      addHistorySnapshot()
      return { handled: true, message: `已将背景色改为 ${color}` }
    }
  }

  // --- Fill color (element background) ---
  const fillMatch = text.match(/(?:填充|元素背景)[色颜]?[改调设]?[成整为到]*\s*(.+)/)
  if (fillMatch && el && (el.type === 'text' || el.type === 'shape')) {
    const color = resolveColor(fillMatch[1])
    if (color) {
      slidesStore.updateElement({ id: el.id, props: { fill: color } as any })
      addHistorySnapshot()
      return { handled: true, message: `已将填充色改为 ${color}` }
    }
  }

  // --- Opacity ---
  const opacityMatch = text.match(/(?:透明度|不透明度)[改调设]?[成整为到]*\s*([\d.]+)/)
  if (opacityMatch && el) {
    let val = parseFloat(opacityMatch[1])
    if (val > 1) val = val / 100 // "透明度改成50" → 0.5
    slidesStore.updateElement({ id: el.id, props: { opacity: val } as any })
    addHistorySnapshot()
    return { handled: true, message: `已将透明度调整为 ${val}` }
  }

  // --- Line height ---
  const lhMatch = text.match(/行[高距间][改调设]?[成整为到]*\s*([\d.]+)/)
  if (lhMatch && textEl) {
    const lh = parseFloat(lhMatch[1])
    slidesStore.updateElement({ id: textEl.id, props: { lineHeight: lh } as any })
    addHistorySnapshot()
    return { handled: true, message: `已将行高调整为 ${lh}` }
  }

  // --- Delete ---
  if (/删除|移除|去掉这个|remove|delete/.test(text) && el) {
    slidesStore.deleteElement(el.id)
    addHistorySnapshot()
    return { handled: true, message: '已删除该元素' }
  }

  // Not handled locally
  return { handled: false, message: '' }
}
