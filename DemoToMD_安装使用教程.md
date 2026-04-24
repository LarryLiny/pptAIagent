# DemoToMD Skill 安装使用教程

> 面向零基础产品经理的一步步指南。全程不需要你手动创建任何配置文件，只需要复制提示词发给 Kiro 就行。

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

复制下面这段话，发给 Kiro：

> 📋 **复制发送给 Kiro 的提示词：**

```
帮我从 GitHub 下载 DemoToMD skill 并安装到当前项目。执行以下命令：

1. git clone https://github.com/LarryLiny/U-PM-MD-generate.git ~/demotomd-skill
2. 创建目录 .kiro/skills/demotomd/references 和 .kiro/skills/demotomd/scripts
3. 把以下文件复制过来：
   - ~/demotomd-skill/SKILL.md → .kiro/skills/demotomd/SKILL.md
   - ~/demotomd-skill/references/requirement-template.md → .kiro/skills/demotomd/references/requirement-template.md
   - ~/demotomd-skill/references/demo-analysis-guide.md → .kiro/skills/demotomd/references/demo-analysis-guide.md
   - ~/demotomd-skill/scripts/check-sync-needed.sh → .kiro/skills/demotomd/scripts/check-sync-needed.sh
4. 完成后告诉我安装了哪些文件
```

### 验证

Kiro 执行完后会告诉你复制了哪些文件。你也可以追问一句：

```
看看 .kiro/skills/demotomd 这个目录有哪些文件
```

### 案例

发送后 Kiro 会依次执行 git clone 和文件复制，最后回复类似：

```
已安装 DemoToMD skill，包含以下文件：
- .kiro/skills/demotomd/SKILL.md
- .kiro/skills/demotomd/references/requirement-template.md
- .kiro/skills/demotomd/references/demo-analysis-guide.md
- .kiro/skills/demotomd/scripts/check-sync-needed.sh
```

---

## 第二步：创建 Steering 规则

Steering 是 Kiro 的"常驻规则"，让 Kiro 知道改完代码要同步文档。

复制下面这段话，发给 Kiro：

> 📋 **复制发送给 Kiro 的提示词：**

```
帮我在 .kiro/steering/ 目录下创建一个文件 demo-sync.md，内容如下：

# DemoToMD 自动同步规则

每次修改 demo 源码后，自动执行 demotomd skill 同步需求文档。

## 触发条件

当代码修改涉及以下文件时，修改完成后立即调用 demotomd：

- src/ 目录下的任何文件（页面、组件、hooks、服务、工具函数）
- 根目录的 HTML / JS 文件（原生项目）
- 路由配置文件
- 表单验证 schema（zod/yup）

## 执行方式

修改完成后，在回复用户之前，执行 demotomd skill 同步需求文档。

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

创建完成后，以后你对 Kiro 说"把模板选择页面的搜索框改成支持拼音搜索"，Kiro 改完代码后会自动读取这个规则，判断这是"业务逻辑变更"，然后自动更新研发需求文档和测试需求文档（UI 文档不动，因为界面没变）。

---

## 第三步：配置 Hooks（自动化触发器）

一共要创建 4 个 hook，每个 hook 对应一种场景。每个都是复制提示词发给 Kiro 就行。

---

### Hook 1：对话结束后自动同步（核心 hook）

每轮对话结束后，自动检测代码变更并智能判断更新哪些文档。

> 📋 **复制发送给 Kiro 的提示词：**

```
帮我创建一个 Kiro hook，配置如下：

- 文件路径：.kiro/hooks/auto-sync-requirement.kiro.hook
- hook 名称：自动同步需求文档
- 描述：每轮对话结束后，根据代码变更类型智能判断需要更新哪些文档，调用 demotomd skill 执行增量同步。
- 触发时机：agentStop（对话结束时）
- 动作类型：askAgent
- prompt 内容：

检查本轮对话是否修改了 src/ 目录下的代码文件（用 git diff --name-only HEAD 或 git status --short）。

如果有代码文件变更（.ts/.vue/.tsx/.jsx/.css/.scss/.html），执行以下判断：

1. 如果变更文件涉及业务逻辑（hooks/composables/services/utils/stores 目录，或包含计算、验证、权限、状态流转的代码）→ 使用 demotomd skill 更新研发需求文档 + 测试需求文档

2. 如果变更文件涉及交互/视觉（组件模板部分、CSS/SCSS、icon 引用、布局调整）→ 使用 demotomd skill 更新 UI 需求文档

3. 如果新增了页面或路由 → 使用 demotomd skill 更新全部三个文档

4. 如果只有 .md/.json/.hook 等非代码文件变更 → 跳过不执行

使用增量模式更新，不要全量重写。

请按照 Kiro hook 的 JSON schema 格式创建这个文件。
```

### 什么时候触发？

每次你和 Kiro 的对话结束时自动触发，你不需要做任何操作。

### 案例

你对 Kiro 说"给订单列表加一个按金额排序的功能"。Kiro 改完代码，对话结束，这个 hook 自动触发：
- 检测到 `src/views/OrderList.vue` 和 `src/utils/sort.ts` 有变更
- 判断为"业务逻辑变更"
- 自动更新研发需求文档（新增排序规则）和测试需求文档（新增排序的 AC 和边界值）
- UI 文档不动

---

### Hook 2：新建源码文件时全量同步

新建页面或组件时，三个文档都需要更新。

> 📋 **复制发送给 Kiro 的提示词：**

```
帮我创建一个 Kiro hook，配置如下：

- 文件路径：.kiro/hooks/new-file-full-sync.kiro.hook
- hook 名称：新建文件全量同步
- 描述：当在 src/ 目录下新建 .vue/.tsx/.ts 文件时，触发 demotomd 全量更新三个需求文档。
- 触发时机：fileCreated
- 文件匹配模式：src/**/*.vue, src/**/*.tsx, src/**/*.ts, src/**/*.jsx
- 动作类型：askAgent
- prompt 内容：

检测到新建了源码文件，这通常意味着新增了功能或页面。使用 demotomd skill 执行同步，更新范围为全部三个文档（研发需求文档 + UI 需求文档 + 测试需求文档）。使用增量模式，在现有文档基础上追加新功能的描述。

请按照 Kiro hook 的 JSON schema 格式创建这个文件。
```

### 什么时候触发？

当 Kiro 在 `src/` 目录下创建了新的 `.vue`、`.ts`、`.tsx`、`.jsx` 文件时自动触发。

### 案例

你对 Kiro 说"新增一个教材详情页面"，Kiro 创建了 `src/views/BookDetail.vue`。文件创建的瞬间，这个 hook 自动触发，三个文档都会被更新：
- 研发文档：新增"教材详情"功能章节
- UI 文档：新增教材详情页的交互状态矩阵
- 测试文档：新增教材详情的验收标准

---

### Hook 3：只改样式时只更新 UI 文档

纯视觉调整只需要更新 UI 文档。

> 📋 **复制发送给 Kiro 的提示词：**

```
帮我创建一个 Kiro hook，配置如下：

- 文件路径：.kiro/hooks/style-only-ui-sync.kiro.hook
- hook 名称：样式变更同步UI文档
- 描述：当只修改了样式文件时，仅更新 UI 需求文档。
- 触发时机：fileEdited
- 文件匹配模式：src/**/*.css, src/**/*.scss, src/**/*.less
- 动作类型：askAgent
- prompt 内容：

检测到样式文件被修改。检查本轮对话中是否同时有 .vue/.ts/.tsx 等逻辑文件的变更：

- 如果只有样式文件变更（纯视觉调整）→ 仅使用 demotomd skill 更新 UI 需求文档
- 如果同时有逻辑文件变更 → 跳过（由 auto-sync-requirement hook 统一处理）

使用增量模式更新。

请按照 Kiro hook 的 JSON schema 格式创建这个文件。
```

### 什么时候触发？

当 `src/` 下的 `.css`、`.scss`、`.less` 文件被修改时自动触发。

### 案例

你对 Kiro 说"把主题色从蓝色换成绿色"，Kiro 只改了 `src/assets/styles/variable.scss`。这个 hook 触发后：
- 检测到只有样式文件变更
- 仅更新 UI 需求文档（记录主题色变更）
- 研发文档和测试文档不动

---

### Hook 4：手动触发全量重写

demo 改了很多轮，文档乱了，想全部重新生成。

> 📋 **复制发送给 Kiro 的提示词：**

```
帮我创建一个 Kiro hook，配置如下：

- 文件路径：.kiro/hooks/manual-full-rewrite.kiro.hook
- hook 名称：手动全量重写文档
- 描述：手动触发，从 demo 代码全量重新生成三个需求文档。适用于大改版或文档混乱时。
- 触发时机：userTriggered（需要手动点击才触发）
- 动作类型：askAgent
- prompt 内容：

用户要求全量重写需求文档。执行以下操作：

1. 使用 demotomd skill，模式设为 full-rewrite
2. 从头分析整个 demo 项目的所有源码
3. 全量生成三个文档：研发需求文档、UI 需求文档、测试需求文档
4. 更新变更日志
5. 生成完成后展示摘要报告给用户确认

请按照 Kiro hook 的 JSON schema 格式创建这个文件。
```

### 什么时候触发？

需要你手动触发。在 Kiro 左侧找到 Agent Hooks 面板，找到"手动全量重写文档"，点击运行按钮。

### 案例

你的 demo 已经迭代了 20 轮，文档有些地方对不上了。你在 Agent Hooks 面板里点击"手动全量重写文档"的运行按钮，Skill 会重新扫描整个项目，从零生成三份完整文档。

---

## 第四步：验证全部配置是否成功

所有配置完成后，复制下面这段话发给 Kiro 做最终检查：

> 📋 **复制发送给 Kiro 的提示词：**

```
帮我检查 DemoToMD skill 的安装情况，逐项确认：

1. 检查 .kiro/skills/demotomd/SKILL.md 是否存在
2. 检查 .kiro/skills/demotomd/references/ 下是否有 requirement-template.md 和 demo-analysis-guide.md
3. 检查 .kiro/skills/demotomd/scripts/check-sync-needed.sh 是否存在
4. 检查 .kiro/steering/demo-sync.md 是否存在
5. 检查 .kiro/hooks/ 下是否有以下 4 个 hook 文件：
   - auto-sync-requirement.kiro.hook
   - new-file-full-sync.kiro.hook
   - style-only-ui-sync.kiro.hook
   - manual-full-rewrite.kiro.hook

列出每一项的检查结果（✅ 存在 / ❌ 缺失），如果有缺失的告诉我怎么补上。
```

### 案例

Kiro 会回复类似：

```
DemoToMD Skill 安装检查：
1. ✅ .kiro/skills/demotomd/SKILL.md
2. ✅ .kiro/skills/demotomd/references/requirement-template.md
3. ✅ .kiro/skills/demotomd/references/demo-analysis-guide.md
4. ✅ .kiro/skills/demotomd/scripts/check-sync-needed.sh
5. ✅ .kiro/steering/demo-sync.md
6. ✅ .kiro/hooks/auto-sync-requirement.kiro.hook
7. ✅ .kiro/hooks/new-file-full-sync.kiro.hook
8. ✅ .kiro/hooks/style-only-ui-sync.kiro.hook
9. ✅ .kiro/hooks/manual-full-rewrite.kiro.hook

全部配置就绪！
```

---

## 什么情况更新哪些文档？速查表

| 你做了什么 | 研发文档 | UI 文档 | 测试文档 | 触发方式 |
|-----------|---------|---------|---------|---------|
| 改了业务逻辑（计算规则、审批流程、权限） | ✅ 更新 | - | ✅ 更新 | 自动（Hook 1） |
| 改了交互/视觉（换按钮位置、加 icon、改颜色） | - | ✅ 更新 | - | 自动（Hook 3） |
| 新增了页面或功能 | ✅ 更新 | ✅ 更新 | ✅ 更新 | 自动（Hook 2） |
| 改了极限场景处理（loading/空状态/错误处理） | ✅ 更新 | - | ✅ 更新 | 自动（Hook 1） |
| 只是口头描述了后端逻辑，demo 没改 | ✅ 更新 | - | ✅ 更新 | 自动（Hook 1） |
| 只改了文档措辞，没改功能 | 仅改文字 | - | - | 直接编辑 MD 文件 |
| 大改版，想全部重来 | ✅ 全量 | ✅ 全量 | ✅ 全量 | 手动（Hook 4） |

---

## 日常使用流程

```
1. 打开 Kiro，正常和 AI 对话迭代你的 demo
2. 每轮对话结束后，hook 自动检测变更并同步文档（你不用管）
3. 偶尔检查一下生成的文档是否准确
4. 觉得文档乱了 → 在 Agent Hooks 面板点击"手动全量重写文档"
5. demo 定稿后 → 把三份文档分别交给研发、UI、测试
```

---

## 一键安装（懒人版）

如果你不想一步步来，可以把下面这一整段话直接发给 Kiro，一次性完成所有配置：

> 📋 **复制发送给 Kiro 的提示词（一键安装版）：**

````
帮我一次性安装 DemoToMD skill 的全部配置，按以下步骤执行：

## 步骤 1：下载并安装 skill 文件

执行命令：git clone https://github.com/LarryLiny/U-PM-MD-generate.git ~/demotomd-skill

然后创建目录并复制文件：
- ~/demotomd-skill/SKILL.md → .kiro/skills/demotomd/SKILL.md
- ~/demotomd-skill/references/requirement-template.md → .kiro/skills/demotomd/references/requirement-template.md
- ~/demotomd-skill/references/demo-analysis-guide.md → .kiro/skills/demotomd/references/demo-analysis-guide.md
- ~/demotomd-skill/scripts/check-sync-needed.sh → .kiro/skills/demotomd/scripts/check-sync-needed.sh

## 步骤 2：创建 steering 规则

在 .kiro/steering/demo-sync.md 创建文件，内容：

---开始---
# DemoToMD 自动同步规则

每次修改 demo 源码后，自动执行 demotomd skill 同步需求文档。

## 触发条件

当代码修改涉及以下文件时，修改完成后立即调用 demotomd：
- src/ 目录下的任何文件（页面、组件、hooks、服务、工具函数）
- 根目录的 HTML / JS 文件（原生项目）
- 路由配置文件
- 表单验证 schema（zod/yup）

## 执行方式

修改完成后，在回复用户之前，执行 demotomd skill 同步需求文档。

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
---结束---

## 步骤 3：创建 4 个 hook 文件

### Hook 1：.kiro/hooks/auto-sync-requirement.kiro.hook
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

### Hook 2：.kiro/hooks/new-file-full-sync.kiro.hook
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

### Hook 3：.kiro/hooks/style-only-ui-sync.kiro.hook
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

### Hook 4：.kiro/hooks/manual-full-rewrite.kiro.hook
```json
{
  "enabled": true,
  "name": "手动全量重写文档",
  "description": "手动触发，从 demo 代码全量重新生成三个需求文档。适用于大改版或文档混乱时。",
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

## 步骤 4：验证

完成后逐项检查以下文件是否都存在，用 ✅/❌ 标记：
1. .kiro/skills/demotomd/SKILL.md
2. .kiro/skills/demotomd/references/requirement-template.md
3. .kiro/skills/demotomd/references/demo-analysis-guide.md
4. .kiro/skills/demotomd/scripts/check-sync-needed.sh
5. .kiro/steering/demo-sync.md
6. .kiro/hooks/auto-sync-requirement.kiro.hook
7. .kiro/hooks/new-file-full-sync.kiro.hook
8. .kiro/hooks/style-only-ui-sync.kiro.hook
9. .kiro/hooks/manual-full-rewrite.kiro.hook
````

就这么简单。复制上面这一整段发给 Kiro，等它执行完，所有配置就全部就绪了。
