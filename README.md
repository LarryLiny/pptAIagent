[简体中文](README_zh.md) | English

# 🎨 AI-Powered PPT Editor

A web-based presentation editor with built-in AI assistant. Built with Vue 3 + TypeScript.

## Features

- Full-featured slide editor: text, images, shapes, lines, charts, tables, video, audio, formulas
- AI assistant "ZiYan" for natural language slide editing and content generation
- AI-powered PPT generation from templates
- PPTX import/export
- Keyboard shortcuts, context menus, mobile preview

## AI Capabilities

- Chat with AI to modify slide elements (font size, color, alignment, etc.)
- Generate teaching content: lesson intros, exercises, discussion activities, speech scripts
- Smart content insertion with adaptive font sizing
- Voice input support (Web Speech API)
- Local command parsing for zero-latency formatting operations

## Quick Start

```bash
# Requires Node.js >= 20
npm install
npm run dev
```

## Tech Stack

- Vue 3.5 + TypeScript + Pinia
- ProseMirror (rich text editing)
- ECharts (charts)
- pptxgenjs (PPTX export)

## License

[MIT](LICENSE)
