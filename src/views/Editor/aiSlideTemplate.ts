/**
 * Extract template styles from current PPT slides for AI-generated content.
 * Analyzes existing slides to determine: background, font styles, layout, colors.
 */
import { useSlidesStore } from '@/store'
import { nanoid } from 'nanoid'
import type { Slide, SlideBackground, PPTTextElement, PPTElement } from '@/types/slides'

export interface SlideTemplate {
  background: SlideBackground
  titleStyle: {
    fontSize: number
    color: string
    fontName: string
    bold: boolean
    align: string
    left: number
    top: number
    width: number
    height: number
  }
  bodyStyle: {
    fontSize: number
    color: string
    fontName: string
    align: string
    left: number
    top: number
    width: number
    height: number
    lineHeight: number
  }
  themeColor: string
  decorativeElements: PPTElement[] // shapes, lines that form the page decoration
}

// Extract font info from HTML content
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

/**
 * Analyze existing slides to extract a reusable template.
 * Looks at the first few slides to find common patterns.
 */
export function extractTemplate(): SlideTemplate {
  const slidesStore = useSlidesStore()
  const slides = slidesStore.slides
  const theme = slidesStore.theme

  // Default template
  const defaultTemplate: SlideTemplate = {
    background: { type: 'solid', color: theme.backgroundColor || '#ffffff' },
    titleStyle: {
      fontSize: 28, color: theme.fontColor || '#1a1a2e', fontName: theme.fontName || '',
      bold: true, align: 'left', left: 48, top: 36, width: 900, height: 52,
    },
    bodyStyle: {
      fontSize: 18, color: theme.fontColor || '#333333', fontName: theme.fontName || '',
      align: 'left', left: 48, top: 100, width: 900, height: 420, lineHeight: 1.6,
    },
    themeColor: theme.themeColors[0] || '#5b9bd5',
    decorativeElements: [],
  }

  if (!slides.length) return defaultTemplate

  // Analyze slides (skip first which is usually a cover)
  const contentSlides = slides.length > 2 ? slides.slice(1, 5) : slides
  
  // Collect title and body styles from content slides
  const titleInfos: ReturnType<typeof extractFontInfo>[] = []
  const bodyInfos: ReturnType<typeof extractFontInfo>[] = []
  const titlePositions: { left: number; top: number; width: number; height: number }[] = []
  const bodyPositions: { left: number; top: number; width: number; height: number }[] = []
  let sampleBackground: SlideBackground | null = null
  const decoratives: PPTElement[] = []

  for (const slide of contentSlides) {
    // Get background from a content slide (not cover)
    if (!sampleBackground && slide.background) {
      sampleBackground = JSON.parse(JSON.stringify(slide.background))
    }

    // Classify text elements by position (top = title, lower = body)
    const textEls = slide.elements.filter(el => el.type === 'text') as PPTTextElement[]
    const sortedByTop = [...textEls].sort((a, b) => a.top - b.top)

    if (sortedByTop.length >= 2) {
      // First text element is likely the title
      const titleEl = sortedByTop[0]
      const bodyEl = sortedByTop[1]

      titleInfos.push(extractFontInfo(titleEl.content))
      titlePositions.push({ left: titleEl.left, top: titleEl.top, width: titleEl.width, height: titleEl.height })

      bodyInfos.push(extractFontInfo(bodyEl.content))
      bodyPositions.push({ left: bodyEl.left, top: bodyEl.top, width: bodyEl.width, height: bodyEl.height })
    }
    else if (sortedByTop.length === 1) {
      bodyInfos.push(extractFontInfo(sortedByTop[0].content))
      bodyPositions.push({ left: sortedByTop[0].left, top: sortedByTop[0].top, width: sortedByTop[0].width, height: sortedByTop[0].height })
    }

    // Collect decorative elements (shapes, lines without text — likely design elements)
    for (const el of slide.elements) {
      if (el.type === 'shape' && !(el as any).text?.content) {
        decoratives.push(JSON.parse(JSON.stringify(el)))
      }
      else if (el.type === 'line') {
        decoratives.push(JSON.parse(JSON.stringify(el)))
      }
    }
  }

  // Average the collected styles
  const template = { ...defaultTemplate }

  if (sampleBackground) {
    template.background = sampleBackground
  }

  if (titleInfos.length) {
    const avg = titleInfos[0] // Use first found as representative
    template.titleStyle.fontSize = avg.fontSize > 20 ? avg.fontSize : 28
    template.titleStyle.color = avg.color
    template.titleStyle.fontName = avg.fontName
    template.titleStyle.bold = avg.bold
    template.titleStyle.align = avg.align
  }
  if (titlePositions.length) {
    const p = titlePositions[0]
    template.titleStyle.left = p.left
    template.titleStyle.top = p.top
    template.titleStyle.width = p.width
    template.titleStyle.height = p.height
  }

  if (bodyInfos.length) {
    const avg = bodyInfos[0]
    template.bodyStyle.fontSize = avg.fontSize > 10 ? avg.fontSize : 18
    template.bodyStyle.color = avg.color
    template.bodyStyle.fontName = avg.fontName
    template.bodyStyle.align = avg.align
  }
  if (bodyPositions.length) {
    const p = bodyPositions[0]
    template.bodyStyle.left = p.left
    template.bodyStyle.top = p.top
    template.bodyStyle.width = p.width
    template.bodyStyle.height = p.height
  }

  // Use first slide's decorative elements as template (deduplicated by position)
  if (decoratives.length) {
    const seen = new Set<string>()
    for (const el of decoratives) {
      const key = `${el.type}-${Math.round(el.left)}-${Math.round(el.top)}-${Math.round(el.width)}`
      if (!seen.has(key)) {
        seen.add(key)
        template.decorativeElements.push(el)
        if (template.decorativeElements.length >= 5) break // Max 5 decorative elements
      }
    }
  }

  return template
}

/**
 * Build a new slide using the extracted template + AI content.
 */
export function buildTemplatedSlide(title: string, body: string, template: SlideTemplate): Slide {
  const elements: PPTElement[] = []
  const ts = template.titleStyle
  const bs = template.bodyStyle

  // Add decorative elements — skip for now to avoid clutter
  // (decorative shapes from imported PPTX often don't transfer cleanly)

  // Title element
  if (title) {
    const boldStyle = ts.bold ? 'font-weight: bold;' : ''
    elements.push({
      type: 'text',
      id: nanoid(10),
      left: ts.left,
      top: ts.top,
      width: ts.width,
      height: ts.height,
      rotate: 0,
      content: `<p style="text-align: ${ts.align};"><span style="font-size: ${ts.fontSize}px; color: ${ts.color}; ${boldStyle}${ts.fontName ? `font-family: ${ts.fontName};` : ''}">${title}</span></p>`,
      defaultFontName: ts.fontName,
      defaultColor: ts.color,
      lineHeight: 1.3,
      fill: '',
      outline: { color: '', width: 0, style: 'solid' },
    } as PPTTextElement)
  }

  // Body element
  if (body) {
    const bodyTop = title ? ts.top + ts.height + 16 : bs.top
    const bodyHeight = 562 - bodyTop - 30

    // Convert markdown-like body to HTML
    const htmlLines = body.split('\n').filter(l => l.trim()).map(line => {
      let t = line.trim()
      const isSubheading = t.match(/^#{2,3}\s+(.+)/)
      const isList = t.match(/^[-*+]\s+(.+)/) || t.match(/^\d+\.\s+(.+)/)

      if (isSubheading) {
        t = isSubheading[1].replace(/\*\*/g, '')
        return `<p style="text-align: ${bs.align};"><span style="font-size: ${bs.fontSize + 2}px; color: ${ts.color}; font-weight: bold;${bs.fontName ? `font-family: ${bs.fontName};` : ''}">${t}</span></p>`
      }
      if (isList) {
        t = (isList[1] || t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
        return `<p style="text-align: ${bs.align}; text-indent: 1em;"><span style="font-size: ${bs.fontSize}px; color: ${bs.color};${bs.fontName ? `font-family: ${bs.fontName};` : ''}">• ${t}</span></p>`
      }

      t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
      return `<p style="text-align: ${bs.align};"><span style="font-size: ${bs.fontSize}px; color: ${bs.color};${bs.fontName ? `font-family: ${bs.fontName};` : ''}">${t}</span></p>`
    }).join('')

    elements.push({
      type: 'text',
      id: nanoid(10),
      left: bs.left,
      top: bodyTop,
      width: bs.width,
      height: bodyHeight,
      rotate: 0,
      content: htmlLines,
      defaultFontName: bs.fontName,
      defaultColor: bs.color,
      lineHeight: bs.lineHeight,
      paragraphSpace: 4,
      fill: '',
      outline: { color: '', width: 0, style: 'solid' },
    } as PPTTextElement)
  }

  return {
    id: nanoid(10),
    elements,
    background: JSON.parse(JSON.stringify(template.background)),
  }
}
