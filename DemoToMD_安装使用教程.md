# DemoToMD Skill 安装使用教程

> 面向零基础产品经理的一步步指南。这个 skill 能在你用 Kiro 改完 demo 后，自动帮你生成/更新三份文档：研发需求文档、UI 需求文档、测试需求文档。

---

## 这个 Skill 能帮你做什么？

你用 Kiro 搭了一个可交互的 demo，改来改去好几轮。每次改完，你需要把"改了什么"同步到需求文档里，交给研发、UI、测试。

以前你得手动写 PRD，现在这个 skill 帮你自动从 demo 代码中提取产品逻辑，生成三份文档：

| 文档 | 文件名示例 | 给谁看 | 写什么 |
|------|-----------|--------|--------|
| 研发需求文档 | `AIPPT_requirement.md` | 研发的 AI 编程工具 | 业务规则、状态机、计算公式、极限场景 |
| UI 需求文档 | `AIPPT_ui_requirement.md` | UI 设计师 | 交互状态矩阵（7态）、Icon 需求、插图/空状态图 |
| 测试需求文档 | `AIPPT_test_requirement.md` | 测试团队的 AI Agent | 验收标准(AC)、边界值、状态流转测试 |
| 变更日志 | `AIPPT_Requirement_log.md` | 所有人 | 每次同步的变更记录 |

---

## 第一步：下载 Skill 文件到你的电脑

### 操作方法

打开终端（Kiro 底部的 Terminal 面板），输入以下命令：

```bash
git clone https://github.com/LarryLiny/U-PM-MD-generate.git ~/demotomd-skill
```

这会把 skill 下载到你电脑的 `~/demotomd-skill` 目录。

### 案例

```
你在终端看到类似这样的输出就是成功了：
Cloning into '/Users/你的用户名/demotomd-skill'...
remote: Enumerating objects: 15, done.
...
Receiving objects: 100% (15/15), done.
```

---

## 第二步：把 Skill 文件复制到你的项目中

Skill 需要放在你项目的 `.kiro/skills/demotomd/` 目录下。

### 操作方法

在终端中依次执行（以你当前的 AIPPT 项目为例）：

```bash
mkdir -p .kiro/skills/demotomd
mkdir -p .kiro/skills/demotomd/references
mkdir -p .kiro/skills/demotomd/scripts
```

然后复制文件：

```bash
cp ~/demotomd-skill/SKILL.md .kiro/skills/demotomd/SKILL.md
cp ~/demotomd-skill/references/requirement-template.md .kiro/skills/demotomd/references/requirement-template.md
cp ~/demotomd-skill/references/demo-analysis-guide.md .kiro/skills/demotomd/references/demo-analysis-guide.md
cp ~/demotomd-skill/scripts/check-sync-needed.sh .kiro/skills/demotomd/scripts/check-sync-needed.sh
```

### 案例

复制完成后，你的项目目录应该多出这些文件：

```
你的项目/
├── .kiro/
│   ├── skills/
│   │   └── demotomd/
│   │       ├── SKILL.md                          ← skill 主文件（核心逻辑）
│   │       ├── references/
│   │       │   ├── requirement-template.md        ← 文档模板
│   │       │   └── demo-analysis-guide.md         ← 代码分析指南
│   │       └── scripts/
│   │           └── check-sync-needed.sh           ← 自动检测脚本
│   ├── hooks/                                     ← 后面第四步配置
│   └── steering/                                  ← 后面第三步配置
├── src/                                           ← 你的 demo 代码
└── ...
```

---

## 第三步：添加 Steering 规则（让 Kiro 知道改完代码要同步文档）

Steering 是 Kiro 的"常驻规则"，告诉 Kiro 在什么情况下应该调用这个 skill。

### 操作方法

在你项目的 `.kiro/steering/` 目录下创建一个新文件 `demo-sync.md`，内容如下：

```markdown
# DemoToMD 自动同步规则

每次修改 demo 源码后，自动执行 demotomd skill 同步需求文档。

## 触发条件

当代码修改涉及以下文件时，修改完成后立即调用 demotomd：

- `src/` 目录下的任何文件（页面、组件、hooks、服务、工具函数）
- 根目录的 HTML / JS 文件（原生项目）
- 路由配置文件
- 表单验证 schema（zod/yup）

## 执行方式

修改完成后，在回复用户之前，执行：

```
/demotomd
```

或等价操作：调用 demotomd skill 同步需求文档。

## 判断变更类型

根据本轮修改内容判断影响范围：
- 改了业务逻辑 / 计算规则 / 权限 → 研发文档 + 测试文档
- 改了交互 / 视觉 / icon → UI 文档
- 新增页面 / 新增功能 → 三个文档都更新
- 用户 prompt 描述了后端逻辑但 demo 没改 → 研发文档 + 测试文档仍然要更新

## 注意事项

1. 使用增量更新，不要每次全量重写
2. 如果文档更新内容超过 50%，需要先询问用户是否更新文档
3. 如果用户明确说"先不同步"或"稍后同步"，则跳过
```

### 案例

假设你对 Kiro 说"把模板选择页面的搜索框改成支持拼音搜索"，Kiro 改完代码后，会自动读取这个 steering 规则，判断这是一个"业务逻辑变更"，然后自动更新研发需求文档和测试需求文档（UI 文档不动，因为界面没变）。

---

## 第四步：配置 Hooks（自动化触发）

Hooks 是 Kiro 的"自动触发器"。你需要配置几个 hook，让 skill 在合适的时机自动运行。

你的项目里已经有两个 hook 了（`auto-git-commit` 和 `auto-sync-requirement`），我们需要把它们优化一下，并补充更精细的触发规则。

### Hook 1：代码改动后自动同步（已有，优化版）

这个 hook 在每轮对话结束后检查代码变更，自动调用 demotomd 同步文档。

**文件路径**：`.kiro/hooks/auto-sync-requirement.kiro.hook`

优化后的内容：

```json
{
  "enabled": true,
  "name": "自动同步需求文档",
  "description": "每轮对话结束后，根据代码变更类型智能判断需要更新哪些文档，调用 demotomd skill 执行增量同步。",
  "version": "1.0.0",
  "when": {
    "type": "agentStop"
  },
  "then": {
    "type": "askAgent",
    "prompt": "检查本轮对话是否修改了 src/ 目录下的代码文件（用 git diff --name-only HEAD 或 git status --short）。\n\n如果有代码文件变更（.ts/.vue/.tsx/.jsx/.css/.scss/.html），执行以下判断：\n\n1. 如果变更文件涉及业务逻辑（hooks/composables/services/utils/stores 目录，或包含计算、验证、权限、状态流转的代码）→ 使用 demotomd skill 更新研发需求文档 + 测试需求文档\n\n2. 如果变更文件涉及交互/视觉（组件模板部分、CSS/SCSS、icon 引用、布局调整）→ 使用 demotomd skill 更新 UI 需求文档\n\n3. 如果新增了页面或路由 → 使用 demotomd skill 更新全部三个文档\n\n4. 如果只有 .md/.json/.hook 等非代码文件变更 → 跳过不执行\n\n使用增量模式更新，不要全量重写。"
  }
}
```

### 案例

你对 Kiro 说"给订单列表加一个按金额排序的功能"。Kiro 改完代码后，对话结束，这个 hook 自动触发：
- 检测到 `src/views/OrderList.vue` 和 `src/utils/sort.ts` 有变更
- 判断为"业务逻辑变更"（排序是计算逻辑）
- 自动更新研发需求文档（新增排序规则描述）和测试需求文档（新增排序的 AC 和边界值）
- UI 文档不动（界面上只是多了个排序按钮，但交互状态没变）

---

### Hook 2：新建文件时全量同步

当你新建了页面或组件文件时，通常意味着新增了功能，三个文档都需要更新。

**文件路径**：`.kiro/hooks/new-file-full-sync.kiro.hook`

```json
{
  "enabled": true,
  "name": "新建文件全量同步",
  "description": "当在 src/ 目录下新建 .vue/.tsx/.ts 文件时，触发 demotomd 全量更新三个需求文档。",
  "version": "1.0.0",
  "when": {
    "type": "fileCreated",
    "patterns": ["src/**/*.vue", "src/**/*.tsx", "src/**/*.ts", "src/**/*.jsx"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "检测到新建了源码文件，这通常意味着新增了功能或页面。使用 demotomd skill 执行同步，更新范围为全部三个文档（研发需求文档 + UI 需求文档 + 测试需求文档）。使用增量模式，在现有文档基础上追加新功能的描述。"
  }
}
```

### 案例

你对 Kiro 说"新增一个教材详情页面"，Kiro 创建了 `src/views/BookDetail.vue`。文件创建的瞬间，这个 hook 自动触发，三个文档都会被更新：
- 研发文档：新增"教材详情"功能章节
- UI 文档：新增教材详情页的交互状态矩阵
- 测试文档：新增教材详情的验收标准

---

### Hook 3：只改了样式时只更新 UI 文档

当你只改了 CSS/SCSS 文件，说明只是视觉调整，只需要更新 UI 文档。

**文件路径**：`.kiro/hooks/style-only-ui-sync.kiro.hook`

```json
{
  "enabled": true,
  "name": "样式变更同步UI文档",
  "description": "当只修改了样式文件时，仅更新 UI 需求文档。",
  "version": "1.0.0",
  "when": {
    "type": "fileEdited",
    "patterns": ["src/**/*.css", "src/**/*.scss", "src/**/*.less"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "检测到样式文件被修改。检查本轮对话中是否同时有 .vue/.ts/.tsx 等逻辑文件的变更：\n\n- 如果只有样式文件变更（纯视觉调整）→ 仅使用 demotomd skill 更新 UI 需求文档\n- 如果同时有逻辑文件变更 → 跳过（由 auto-sync-requirement hook 统一处理）\n\n使用增量模式更新。"
  }
}
```

### 案例

你对 Kiro 说"把主题色从蓝色换成绿色"，Kiro 只改了 `src/assets/styles/variable.scss`。这个 hook 触发后：
- 检测到只有样式文件变更
- 仅更新 UI 需求文档（记录主题色变更）
- 研发文档和测试文档不动

---

### Hook 4：手动触发全量重写

有时候你改了很多轮，文档已经比较乱了，想全部重新生成。这个 hook 需要你手动点击触发。

**文件路径**：`.kiro/hooks/manual-full-rewrite.kiro.hook`

```json
{
  "enabled": true,
  "name": "手动全量重写文档",
  "description": "手动触发，删除现有需求文档并从 demo 代码全量重新生成三个文档。适用于大改版或文档混乱时。",
  "version": "1.0.0",
  "when": {
    "type": "userTriggered"
  },
  "then": {
    "type": "askAgent",
    "prompt": "用户要求全量重写需求文档。执行以下操作：\n\n1. 使用 demotomd skill，模式设为 full-rewrite\n2. 从头分析整个 demo 项目的所有源码\n3. 全量生成三个文档：研发需求文档、UI 需求文档、测试需求文档\n4. 更新变更日志\n5. 生成完成后展示摘要报告给用户确认"
  }
}
```

### 案例

你的 demo 已经迭代了 20 轮，文档有些地方对不上了。你在 Kiro 左侧的 Agent Hooks 面板里找到"手动全量重写文档"，点击触发按钮。Skill 会重新扫描整个项目，从零生成三份完整文档。

---

## 第五步：验证安装是否成功

### 方法 1：直接在聊天框输入触发词

在 Kiro 聊天框里输入以下任意一句话：

```
同步需求文档
```

或者：

```
帮我把 demo 里的产品逻辑写到 requirement.md 里
```

如果 skill 安装成功，Kiro 会开始分析你的 demo 代码并生成/更新文档。

### 方法 2：检查文件是否到位

在 Kiro 聊天框里问：

```
看看 .kiro/skills/demotomd 这个目录有哪些文件
```

应该能看到 SKILL.md、references/、scripts/ 都在。

### 案例

你输入"同步需求文档"后，Kiro 的执行流程大致是：

```
1. 检测项目类型 → Vue 项目（从 package.json 识别）
2. 确定目标设备 → PC（没有移动端适配代码）
3. 确定文件名 → AIPPT_requirement.md / AIPPT_ui_requirement.md / AIPPT_test_requirement.md
4. 判断更新模式 → incremental（文档已存在且有 @meta）
5. 分析变更文件 → 列出自上次同步后改动的文件
6. 分析代码逻辑 → 提取业务规则、状态机、交互状态
7. 增量更新文档 → 只改受影响的章节
8. 更新变更日志 → AIPPT_Requirement_log.md 追加一行记录
9. 展示摘要 → 告诉你更新了哪些章节
```

---

## 什么情况更新哪些文档？速查表

| 你做了什么 | 研发文档 | UI 文档 | 测试文档 | 触发方式 |
|-----------|---------|---------|---------|---------|
| 改了业务逻辑（计算规则、审批流程、权限） | ✅ 更新 | - | ✅ 更新 | 自动（Hook 1） |
| 改了交互/视觉（换按钮位置、加 icon、改颜色） | - | ✅ 更新 | - | 自动（Hook 3） |
| 新增了页面或功能 | ✅ 更新 | ✅ 更新 | ✅ 更新 | 自动（Hook 2） |
| 改了极限场景处理（loading/空状态/错误处理） | ✅ 更新 | - | ✅ 更新 | 自动（Hook 1） |
| 只是口头描述了后端逻辑，demo 没改 | ✅ 更新 | - | ✅ 更新 | 自动（Hook 1 通过对话意图检测） |
| 只改了文档措辞，没改功能 | 仅改文字 | - | - | 直接编辑 MD 文件 |
| 大改版，想全部重来 | ✅ 全量 | ✅ 全量 | ✅ 全量 | 手动（Hook 4） |

---

## 日常使用流程总结

```
1. 打开 Kiro，正常和 AI 对话迭代你的 demo
2. 每轮对话结束后，hook 自动检测变更并同步文档（你不用管）
3. 偶尔检查一下生成的文档是否准确
4. 觉得文档乱了 → 点击"手动全量重写文档"hook
5. demo 定稿后 → 把三份文档分别交给研发、UI、测试
```

就这么简单。你只管改 demo，文档自动跟着更新。
