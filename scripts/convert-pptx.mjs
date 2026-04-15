import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
const { parse } = require('pptxtojson/dist/index.cjs')

const buf = fs.readFileSync('doc/Section A测试课件.pptx')
const json = await parse(buf.buffer, { imageMode: 'base64' })

fs.writeFileSync('public/mocks/slides.json', JSON.stringify(json.slides))
console.log('Done! Slides:', json.slides.length)
console.log('Size:', JSON.stringify(json.size))
console.log('Theme:', JSON.stringify(json.themeColors))
