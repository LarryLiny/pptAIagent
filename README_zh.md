简体中文 | [English](README.md)

# 🎨 AI 智能 PPT 编辑器

一个内置 AI 助手的在线演示文稿编辑器，基于 Vue 3 + TypeScript 构建。

## 功能特性

- 全功能幻灯片编辑：文字、图片、形状、线条、图表、表格、视频、音频、公式
- AI 助手"子言"，支持自然语言编辑幻灯片和内容生成
- AI 一键生成 PPT（基于模板）
- PPTX 导入/导出
- 快捷键、右键菜单、移动端预览

## AI 能力

- 对话式修改元素格式（字号、颜色、对齐、加粗等）
- 生成教学内容：课堂引入、习题、互动环节、演讲稿
- 智能内容插入，字号自适应画布大小
- 语音输入（Web Speech API）
- 本地指令解析，零延迟格式操作

## 快速开始

```bash
# 需要 Node.js >= 20
npm install
npm run dev
```

## 技术栈

- Vue 3.5 + TypeScript + Pinia
- ProseMirror（富文本编辑）
- ECharts（图表）
- pptxgenjs（PPTX 导出）

## 开源协议

[MIT](LICENSE)
