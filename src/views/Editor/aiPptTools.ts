import { nanoid } from 'nanoid'
import { useSlidesStore } from '@/store'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import type { Slide, PPTTextElement, PPTImageElement, PPTShapeElement, PPTElement } from '@/types/slides'

// System prompt for LLM — focused on element manipulation
export const SYSTEM_PROMPT = `你是"子言"，PPT课件AI助手。你通过工具直接操作PPT元素。

## 画布
- 尺寸: 1000×562px (16:9)
- 坐标原点: 左上角

## 核心规则
1. 用户说"字号改成30"→ 调用update_element修改content中的font-size
2. 用户说"颜色改红色"→ 修改content中的color为#ff0000
3. 用户说"加粗"→ 在content的span中添加font-weight:bold
4. 用户说"居中"→ 修改content中的text-align:center
5. 用户说"移到右边"→ 修改left值
6. 用户说"背景改蓝色"→ 调用update_slide_background

## 文本元素的content格式
文本内容是HTML字符串，格式如:
<p style="text-align: left;"><span style="font-size: 18px; color: #333;">文字内容</span></p>

修改字号: 替换font-size的值
修改颜色: 替换color的值
加粗: 添加font-weight: bold;
修改对齐: 替换text-align的值

## 重要
- 修改文本样式时，必须在content的HTML中修改对应的CSS属性
- 用→标记的是当前选中的元素，优先操作它
- 回复要简洁，操作完说一句话即可`

// Serialize current slide elements for LLM context — rich detail for selected element
export function describeCurrentSlide(selectedElementId?: string): string {
  const slidesStore = useSlidesStore()
  const slide = slidesStore.currentSlide
  if (!slide) return '当前没有选中的幻灯片。'

  const idx = slidesStore.slideIndex
  const total = slidesStore.slides.length
  const lines: string[] = [`第${idx + 1}/${total}页 画布:1000×562px`]

  if (slide.background) {
    if (slide.background.type === 'solid') lines.push(`背景:${slide.background.color}`)
  }

  for (const el of slide.elements) {
    const isSelected = el.id === selectedElementId
    const prefix = isSelected ? '→ ' : '  '
    const pos = `(${Math.round(el.left)},${Math.round(el.top)}) ${Math.round(el.width)}×${Math.round(el.height)}`

    if (el.type === 'text') {
      const tmp = document.createElement('div')
      tmp.innerHTML = el.content
      const text = tmp.textContent?.slice(0, 50) || ''
      // Extract current font-size from HTML
      const fsMatch = el.content.match(/font-size:\s*(\d+)px/)
      const fs = fsMatch ? fsMatch[1] + 'px' : ''
      const colorMatch = el.content.match(/(?<![background-])color:\s*(#[0-9a-fA-F]+)/)
      const color = colorMatch ? colorMatch[1] : ''
      const bold = /font-weight:\s*bold/.test(el.content) ? '加粗' : ''
      const alignMatch = el.content.match(/text-align:\s*(\w+)/)
      const align = alignMatch ? alignMatch[1] : ''

      let detail = `[文本 id="${el.id}"] ${pos}`
      if (isSelected) {
        detail += ` 字号:${fs} 颜色:${color} ${bold} 对齐:${align}`
        detail += ` 行高:${el.lineHeight || 1.5} 填充:${el.fill || '无'}`
      }
      detail += ` "${text}${text.length >= 50 ? '...' : ''}"`
      lines.push(prefix + detail)
    }
    else if (el.type === 'image') {
      lines.push(`${prefix}[图片 id="${el.id}"] ${pos}`)
    }
    else if (el.type === 'shape') {
      const hasText = (el as PPTShapeElement).text?.content ? '(含文字)' : ''
      lines.push(`${prefix}[形状 id="${el.id}"] ${pos} ${hasText}`)
    }
    else {
      lines.push(`${prefix}[${el.type} id="${el.id}"] ${pos}`)
    }
  }
  return lines.join('\n')
}

// Tool definitions for OpenAI function calling
export const pptTools = [
  {
    type: 'function' as const,
    function: {
      name: 'update_element',
      description: '修改当前页面上已有元素的属性，如位置、尺寸、文字内容、字号、颜色、对齐、背景色、透明度等。',
      parameters: {
        type: 'object',
        properties: {
          element_id: { type: 'string', description: '要修改的元素ID' },
          left: { type: 'number', description: '新的X坐标(px)' },
          top: { type: 'number', description: '新的Y坐标(px)' },
          width: { type: 'number', description: '新的宽度(px)' },
          height: { type: 'number', description: '新的高度(px)' },
          content: { type: 'string', description: '新的HTML文本内容(仅文本元素)' },
          fill: { type: 'string', description: '填充/背景色，如 #ff0000' },
          opacity: { type: 'number', description: '不透明度 0-1' },
          rotate: { type: 'number', description: '旋转角度' },
          lineHeight: { type: 'number', description: '行高倍数' },
          paragraphSpace: { type: 'number', description: '段间距(px)' },
        },
        required: ['element_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_text_element',
      description: '在当前页面添加一个新的文本元素。',
      parameters: {
        type: 'object',
        properties: {
          left: { type: 'number', description: 'X坐标(px)', default: 60 },
          top: { type: 'number', description: 'Y坐标(px)', default: 200 },
          width: { type: 'number', description: '宽度(px)', default: 880 },
          height: { type: 'number', description: '高度(px)', default: 100 },
          content: { type: 'string', description: 'HTML格式文本内容' },
          fontSize: { type: 'number', description: '字号(px)', default: 18 },
          color: { type: 'string', description: '文字颜色', default: '#333' },
          align: { type: 'string', enum: ['left', 'center', 'right'], default: 'left' },
          bold: { type: 'boolean', description: '是否加粗', default: false },
          fill: { type: 'string', description: '文本框背景色' },
          lineHeight: { type: 'number', description: '行高倍数', default: 1.5 },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_image_element',
      description: '在当前页面添加一个图片元素。',
      parameters: {
        type: 'object',
        properties: {
          src: { type: 'string', description: '图片URL或base64' },
          left: { type: 'number', description: 'X坐标(px)', default: 300 },
          top: { type: 'number', description: 'Y坐标(px)', default: 150 },
          width: { type: 'number', description: '宽度(px)', default: 400 },
          height: { type: 'number', description: '高度(px)', default: 300 },
          radius: { type: 'number', description: '圆角(px)' },
        },
        required: ['src'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_slide',
      description: '新建一页幻灯片，可以同时添加多个元素。',
      parameters: {
        type: 'object',
        properties: {
          background_color: { type: 'string', description: '背景色', default: '#ffffff' },
          remark: { type: 'string', description: '演讲者备注' },
          elements: {
            type: 'array',
            description: '页面元素列表',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['text', 'image'] },
                left: { type: 'number' },
                top: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                content: { type: 'string', description: 'HTML文本(text类型)' },
                src: { type: 'string', description: '图片地址(image类型)' },
                fontSize: { type: 'number' },
                color: { type: 'string' },
                align: { type: 'string', enum: ['left', 'center', 'right'] },
                bold: { type: 'boolean' },
                fill: { type: 'string' },
                lineHeight: { type: 'number' },
                radius: { type: 'number' },
              },
              required: ['type'],
            },
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_element',
      description: '删除当前页面上的一个元素。',
      parameters: {
        type: 'object',
        properties: {
          element_id: { type: 'string', description: '要删除的元素ID' },
        },
        required: ['element_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_slide_background',
      description: '修改当前页面的背景颜色。',
      parameters: {
        type: 'object',
        properties: {
          color: { type: 'string', description: '背景颜色，如 #1a1a2e' },
        },
        required: ['color'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_slide_remark',
      description: '修改当前页面的演讲者备注。',
      parameters: {
        type: 'object',
        properties: {
          remark: { type: 'string', description: '备注内容' },
        },
        required: ['remark'],
      },
    },
  },
]


// Execute a tool call and return a result description
export function executeTool(name: string, args: Record<string, any>): string {
  const slidesStore = useSlidesStore()
  const { addSlidesFromData, addElementsFromData } = useAddSlidesOrElements()
  const { addHistorySnapshot } = useHistorySnapshot()

  try {
    switch (name) {
      case 'update_element': {
        const { element_id, ...props } = args
        const updateProps: Record<string, any> = {}
        if (props.left !== undefined) updateProps.left = props.left
        if (props.top !== undefined) updateProps.top = props.top
        if (props.width !== undefined) updateProps.width = props.width
        if (props.height !== undefined) updateProps.height = props.height
        if (props.content !== undefined) updateProps.content = props.content
        if (props.fill !== undefined) updateProps.fill = props.fill
        if (props.opacity !== undefined) updateProps.opacity = props.opacity
        if (props.rotate !== undefined) updateProps.rotate = props.rotate
        if (props.lineHeight !== undefined) updateProps.lineHeight = props.lineHeight
        if (props.paragraphSpace !== undefined) updateProps.paragraphSpace = props.paragraphSpace

        slidesStore.updateElement({ id: element_id, props: updateProps as any })
        addHistorySnapshot()
        return `已更新元素 ${element_id}`
      }

      case 'add_text_element': {
        const fontSize = args.fontSize || 18
        const color = args.color || '#333'
        const align = args.align || 'left'
        const bold = args.bold ? 'font-weight: bold;' : ''
        const content = args.content || ''

        // If content is already HTML, use it directly; otherwise wrap it
        const isHtml = content.includes('<') && content.includes('>')
        const htmlContent = isHtml ? content : `<p style="text-align: ${align};"><span style="font-size: ${fontSize}px; color: ${color}; ${bold}">${content}</span></p>`

        const el: PPTTextElement = {
          type: 'text',
          id: nanoid(10),
          left: args.left ?? 60,
          top: args.top ?? 200,
          width: args.width ?? 880,
          height: args.height ?? 100,
          rotate: 0,
          content: htmlContent,
          defaultFontName: '',
          defaultColor: color,
          lineHeight: args.lineHeight ?? 1.5,
          fill: args.fill || '',
          outline: { color: '', width: 0, style: 'solid' },
        }
        addElementsFromData([el])
        return `已添加文本元素 ${el.id}`
      }

      case 'add_image_element': {
        const el: PPTImageElement = {
          type: 'image',
          id: nanoid(10),
          left: args.left ?? 300,
          top: args.top ?? 150,
          width: args.width ?? 400,
          height: args.height ?? 300,
          rotate: 0,
          fixedRatio: true,
          src: args.src,
          radius: args.radius,
        }
        addElementsFromData([el])
        return `已添加图片元素 ${el.id}`
      }

      case 'add_slide': {
        const elements: PPTElement[] = []
        if (args.elements) {
          for (const item of args.elements) {
            if (item.type === 'text') {
              const fontSize = item.fontSize || 18
              const color = item.color || '#333'
              const align = item.align || 'left'
              const bold = item.bold ? 'font-weight: bold;' : ''
              const content = item.content || ''
              const isHtml = content.includes('<') && content.includes('>')
              const htmlContent = isHtml ? content : `<p style="text-align: ${align};"><span style="font-size: ${fontSize}px; color: ${color}; ${bold}">${content}</span></p>`

              elements.push({
                type: 'text',
                id: nanoid(10),
                left: item.left ?? 60,
                top: item.top ?? 60,
                width: item.width ?? 880,
                height: item.height ?? 100,
                rotate: 0,
                content: htmlContent,
                defaultFontName: '',
                defaultColor: color,
                lineHeight: item.lineHeight ?? 1.5,
                fill: item.fill || '',
                outline: { color: '', width: 0, style: 'solid' },
              } as PPTTextElement)
            }
            else if (item.type === 'image') {
              elements.push({
                type: 'image',
                id: nanoid(10),
                left: item.left ?? 300,
                top: item.top ?? 150,
                width: item.width ?? 400,
                height: item.height ?? 300,
                rotate: 0,
                fixedRatio: true,
                src: item.src,
                radius: item.radius,
              } as PPTImageElement)
            }
          }
        }

        const slide: Slide = {
          id: nanoid(10),
          elements,
          background: { type: 'solid', color: args.background_color || '#ffffff' },
          remark: args.remark || '',
        }
        addSlidesFromData([slide])
        return `已新建幻灯片，包含 ${elements.length} 个元素`
      }

      case 'delete_element': {
        slidesStore.deleteElement(args.element_id)
        addHistorySnapshot()
        return `已删除元素 ${args.element_id}`
      }

      case 'update_slide_background': {
        slidesStore.updateSlide({ background: { type: 'solid', color: args.color } })
        addHistorySnapshot()
        return `已更新背景色为 ${args.color}`
      }

      case 'update_slide_remark': {
        slidesStore.updateSlide({ remark: args.remark })
        addHistorySnapshot()
        return `已更新备注`
      }

      default:
        return `未知工具: ${name}`
    }
  }
  catch (err: any) {
    return `执行失败: ${err.message || err}`
  }
}
