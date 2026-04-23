import { nanoid } from 'nanoid'
import { useSlidesStore } from '@/store'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import type { Slide, PPTTextElement, PPTImageElement, PPTShapeElement, PPTElement } from '@/types/slides'

// System prompt for LLM — focused on element manipulation
export const SYSTEM_PROMPT = `你是"子言"，PPT课件AI助手。你通过工具直接操作PPT元素。

## 教育理论框架（生成教学内容时必须遵循）
你生成的所有教学内容都应有理论依据，根据内容类型灵活运用以下教学法：

### POA 产出导向法（Production-Oriented Approach）
- 驱动（Motivating）：用真实交际场景激发学习需求，让学生意识到"我需要学这个"
- 促成（Enabling）：提供语言输入和支架，帮助学生完成产出任务
- 评价（Assessing）：设计可检验的产出任务，师生协同评价
- 适用场景：课堂引入、互动环节、例题设计

### PBL 项目式学习（Project-Based Learning）
- 以真实问题或项目为驱动，学生在解决问题中习得知识
- 强调跨学科整合、团队协作、成果展示
- 适用场景：互动环节设计、综合性任务、小组讨论

### 场景教学法（Scenario-Based Teaching）
- 创设贴近真实生活的语言使用场景
- 让学生在情境中理解语言的形式、意义和用法
- 强调语言的交际功能而非孤立的语法规则
- 适用场景：课堂引入、背景知识、例题情境设计

### 运用原则
1. 不要生硬地标注"这是POA教学法"，而是自然地将理论融入内容设计
2. 课堂引入 → 优先用 POA 的"驱动"环节 + 场景教学法
3. 例题生成 → 用场景教学法创设真实语境，用 POA 的"促成"提供支架
4. 互动环节 → 用 PBL 的项目驱动 + POA 的"产出"导向
5. 总结要点 → 用 POA 的"评价"框架梳理学习成果
6. 演讲稿 → 融入场景教学法，语言自然、贴近真实交际

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

## 图片规则
- 当用户要求搜索、查找图片或需要配图时，调用search_images工具
- 不要使用add_image_element工具直接插入图片
- 搜索关键词用英文效果更好

## 生成内容的回复格式（非常重要！）
当用户要求生成内容（课堂引入、例题、演讲稿、总结等）时，你的回复必须严格按以下格式：

1. 先用一句简短的自然语言回复（如"好的，为您生成了以下内容："）
2. 然后输出分隔符: ---PPT_CONTENT---
3. 分隔符之后是纯PPT内容，格式为：
   - 第一行是标题（用 # 标记）
   - 后面是正文内容（支持 Markdown 列表、加粗等）
4. 不要在PPT内容中包含任何对话性文字

### 多页内容生成规则（非常重要！）
当用户要求生成多个独立内容（如"生成三道习题"、"做5页知识点"），每个内容应该独立成页：
- 用 ---PPT_SLIDE--- 分隔每页内容
- 每页内容都以 # 标题开头
- 每页内容都独立控制长度（遵守PPT内容长度限制）
- 最后一页内容末尾加 ---CONTENT_TYPE:xxx--- 标记

示例（单页）：
好的，为您生成了一段课堂引入：

---PPT_CONTENT---
# Environmental Protection
Good morning, class! Today we will explore how to protect our planet.
- Climate change is affecting our daily lives
- Small actions can make a big difference
- Let's learn how to express our ideas in English
---CONTENT_TYPE:slide---

示例（多页，如"生成三道习题"）：
好的，为您生成了三道习题，您可以选择需要的插入：

---PPT_CONTENT---
# 习题一：词汇选择
Choose the correct word to complete the sentence:
The government has taken measures to _____ air pollution.
A. reduce  B. produce  C. introduce  D. deduce
**答案：A**
---PPT_SLIDE---
# 习题二：语法填空
Fill in the blank with the correct form:
If we _____ (not take) action now, the situation will get worse.
**答案：don't take**
---PPT_SLIDE---
# 习题三：阅读理解
Read the passage and answer: What is the main idea?
"Climate change affects every aspect of our lives..."
A. Economic growth  B. Environmental impact  C. Social development
**答案：B**
---CONTENT_TYPE:slide---

## 回复末尾的内容类型标记（非常重要！必须遵守！）
你的每条回复末尾必须附加一个内容类型标记，格式为：
---CONTENT_TYPE:xxx---

类型说明：
- chat：闲聊、问答、解释说明、操作确认等不适合插入PPT的内容
- slide：适合作为幻灯片正文插入的内容（课堂引入、例题、知识点、互动设计等）
- note：适合作为演讲稿或备注插入的内容（演讲稿、教学备注、讲解提纲等）

判断规则：
1. 如果用户在闲聊（打招呼、问问题、聊天、问你是谁等），标记为 chat
2. 如果生成的内容适合放在PPT页面上展示给学生看，标记为 slide
3. 如果生成的内容是给教师自己看的讲稿/备注，标记为 note
4. 如果不确定，默认标记为 chat
5. 当使用了 ---PPT_CONTENT--- 分隔符时，分隔符后的内容卡片也需要在末尾加标记

示例1（闲聊）：
你好！我是子言，你的PPT课件AI助手。有什么需要帮忙的吗？
---CONTENT_TYPE:chat---

示例2（幻灯片内容，单页）：
好的，为您生成了一段课堂引入：

---PPT_CONTENT---
# Environmental Protection
- Climate change is affecting our daily lives
- Small actions can make a big difference
---CONTENT_TYPE:slide---

示例3（幻灯片内容，多页）：
好的，为您生成了两道习题：

---PPT_CONTENT---
# 习题一
题目内容...
---PPT_SLIDE---
# 习题二
题目内容...
---CONTENT_TYPE:slide---

示例4（演讲稿/备注）：
好的，为您生成了一份演讲稿：

---PPT_CONTENT---
# 课堂演讲稿
各位同学大家好，今天我们来学习环境保护...
---CONTENT_TYPE:note---

## 重要
- 修改文本样式时，必须在content的HTML中修改对应的CSS属性
- 用→标记的是当前选中的元素，优先操作它
- 回复要简洁，操作完说一句话即可
- 当用户要求"生成内容"时，按上述格式回复，不要自动插入
- 只有用户明确说"插入"、"添加到页面"时，才使用add_text_element或add_slide工具
- 修改已有元素的格式（字号、颜色、位置等）可以直接用update_element工具执行
- 用户输入可能有错别字或口语化表达，请理解真实意图并执行。例如：
  "子号改大"→字号改大，"颜色改层红色"→颜色改成红色，"加醋"→加粗，"剧中"→居中

## 布局优化规则（非常重要！）
当用户要求"优化布局"或"调整布局"时，系统会自动处理（本地指令），你不需要调用工具。
如果本地指令没有拦截到（用户用了其他表述），你需要按以下规则操作：

### 第一步：分析页面类型
1. 如果页面有 3 个以上短文本（每个 < 40 字）→ 判定为"目录页"
2. 如果第一个文本较短（< 50 字）且后面有较长内容 → 判定为"标题+内容页"
3. 其他情况 → 只修正宽度，确保不超出画布

### 第二步：按类型调整
**目录页**：
- 所有文字字号改为 40px
- 文字居中对齐
- 宽度设为 900px（左右各留 50px 边距）
- 垂直方向均匀分布

**标题+内容页**：
- 标题：40px
- 内容：默认 32px，如果内容太多导致超出画布，逐步缩小到最小 24px
- 宽度 = 画布宽度(1000) - 元素左坐标 - 右边距(50)
- 确保 left + width ≤ 1000

## PPT内容长度限制（非常重要！）
生成的PPT内容必须控制长度，因为要插入到一页幻灯片中（1000×562px）：
- 标题：不超过20个字
- 正文总量：不超过300字（中文）或150词（英文）
- 列表项：每项不超过30字，最多8项
- 如果内容确实很多，优先精简，用要点概括，不要长篇大论
- 宁可内容精炼，也不要塞满整页`

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
      description: '修改当前页面上已有元素的属性，如位置、尺寸、文字内容、字号、颜色、对齐、背景色、透明度等。注意：位置和尺寸会被自动约束在画布范围内（1000×562px），确保元素不会移出可见区域。',
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
  {
    type: 'function' as const,
    function: {
      name: 'search_images',
      description: '搜索图片。当用户要求查找、搜索图片或需要配图时调用此工具。返回图片列表供用户选择插入。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词（英文效果更好）' },
          orientation: { type: 'string', enum: ['landscape', 'portrait', 'square', 'all'], description: '图片方向', default: 'landscape' },
        },
        required: ['query'],
      },
    },
  },
]

// Image search result type
export interface SearchedImage {
  id: number
  src: string      // High quality for PPT insertion
  preview?: string  // Medium quality for chat preview
  width: number
  height: number
}

// Search images using Pexels free API
const PEXELS_API_KEY = '563492ad6f91700001000001e1c1f1a0b1c14b0e9f1e1f1a0b1c1'

export async function searchImages(query: string, orientation: string = 'landscape'): Promise<SearchedImage[]> {
  try {
    const params = new URLSearchParams({
      query,
      per_page: '4',
      page: '1',
      orientation: orientation === 'all' ? '' : orientation,
    })
    const resp = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { 'Authorization': PEXELS_API_KEY },
    })
    if (!resp.ok) return []
    const data = await resp.json()
    return (data.photos || []).slice(0, 4).map((photo: any) => ({
      id: photo.id,
      src: photo.src.large, // High quality for PPT insertion
      preview: photo.src.medium, // Medium quality for chat preview
      width: photo.width,
      height: photo.height,
    }))
  }
  catch {
    return []
  }
}
export function executeTool(name: string, args: Record<string, any>): string {
  const slidesStore = useSlidesStore()
  const { addSlidesFromData, addElementsFromData } = useAddSlidesOrElements()
  const { addHistorySnapshot } = useHistorySnapshot()

  try {
    switch (name) {
      case 'update_element': {
        const { element_id, ...props } = args
        const updateProps: Record<string, any> = {}

        // Find the target element to validate bounds
        const targetEl = slidesStore.currentSlide?.elements.find(e => e.id === element_id)

        // Use current or proposed dimensions for bounds checking
        const elWidth = props.width ?? targetEl?.width ?? 0
        const elHeight = props.height ?? targetEl?.height ?? 0

        if (props.left !== undefined) {
          // Clamp left so element stays within canvas (at least 10% visible)
          const minLeft = -(elWidth * 0.9)
          const maxLeft = 1000 - elWidth * 0.1
          updateProps.left = Math.max(minLeft, Math.min(maxLeft, props.left))
        }
        if (props.top !== undefined) {
          const minTop = -(elHeight * 0.9)
          const maxTop = 562 - elHeight * 0.1
          updateProps.top = Math.max(minTop, Math.min(maxTop, props.top))
        }
        if (props.width !== undefined) {
          updateProps.width = Math.max(10, Math.min(1000, props.width))
        }
        if (props.height !== undefined) {
          updateProps.height = Math.max(10, Math.min(562, props.height))
        }
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

        // Clamp width so left + width <= 1000 (canvas width)
        const left = args.left ?? 60
        const maxWidth = 1000 - left
        const width = Math.min(args.width ?? 880, maxWidth)

        const el: PPTTextElement = {
          type: 'text',
          id: nanoid(10),
          left,
          top: args.top ?? 200,
          width,
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

              // Clamp width so left + width <= 1000
              const elLeft = item.left ?? 60
              const elWidth = Math.min(item.width ?? 880, 1000 - elLeft)

              elements.push({
                type: 'text',
                id: nanoid(10),
                left: elLeft,
                top: item.top ?? 60,
                width: elWidth,
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

      case 'search_images': {
        // This is handled specially in the floating dialog, not here
        return `搜索图片: ${args.query}`
      }

      default:
        return `未知工具: ${name}`
    }
  }
  catch (err: any) {
    return `执行失败: ${err.message || err}`
  }
}
