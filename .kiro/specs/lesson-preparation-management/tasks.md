# Implementation Plan: 备授课管理 (Lesson Preparation Management)

## Overview

基于 PPTist 项目引入 Vue Router，新增备授课管理模块（教材列表页、教材详情页），使用 mock 数据驱动。实现按以下顺序推进：路由基础设施 → 数据层 → 布局组件 → 页面组件 → 业务功能 → 集成联调。

## Tasks

- [x] 1. 安装 vue-router 并搭建路由基础设施
  - [x] 1.1 添加 vue-router 依赖并创建路由配置文件
    - 在 `package.json` 中添加 `vue-router` 依赖并安装
    - 创建 `src/router/index.ts`，配置 `createWebHashHistory` 路由实例
    - 配置路由表：`/` 重定向到 `/lesson-prep`，`/lesson-prep` 教材列表页，`/lesson-prep/:textbookId` 教材详情页，`/editor/:coursewareId?` 编辑器，`/placeholder/:menuKey` 占位页
    - 配置 catch-all 路由 `/:pathMatch(.*)*` 重定向到 `/lesson-prep`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 改造 main.ts 和 App.vue 集成路由
    - 修改 `src/main.ts`，引入并注册 Vue Router
    - 将 `src/App.vue` 中的编辑器逻辑提取到新的 `src/views/Editor/EditorView.vue` 视图组件中（保留原有全部逻辑和 store 引用）
    - `App.vue` 简化为仅包含 `<router-view />` 和全局样式
    - 确保 `/editor` 路由下 PPTist 编辑器功能完全正常
    - _Requirements: 1.1, 1.4, 1.5_

- [x] 2. Checkpoint - 路由基础验证
  - 确保应用能正常启动，`/` 重定向到 `/lesson-prep`，`/editor` 路由下编辑器正常工作。如有问题请向用户确认。

- [x] 3. 创建类型定义和 Mock 数据层
  - [x] 3.1 创建 TypeScript 类型定义
    - 创建 `src/types/lessonPrep.ts`，定义 Textbook、Course、Courseware、Chapter、MenuItem、BreadcrumbItem 接口
    - 所有字段严格按照 design 文档中的 Data Models 定义
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 3.2 创建 Mock JSON 数据文件
    - 创建 `public/mocks/textbooks.json`（至少 6 条教材数据，含收藏/下架等不同状态）
    - 创建 `public/mocks/courses.json`（至少 12 条教程数据，覆盖官方/非官方，分属不同教材）
    - 创建 `public/mocks/coursewares.json`（至少 5 条课件数据）
    - 创建 `public/mocks/chapters.json`（至少 8 条章节数据）
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 3.3 创建 Mock 数据服务模块
    - 创建 `src/mock/lessonPrep.ts`，封装 fetch 调用加载 mock JSON
    - 提供 `getTextbooks()`、`getCourses(textbookId)`、`getCoursewares(textbookId)`、`getChapters(textbookId)` 方法
    - 使用 try/catch 处理加载失败，失败时返回空数组
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 3.4 编写 Mock 数据 schema 完整性属性测试
    - **Property 10: Mock data schema completeness**
    - 验证所有 mock JSON 中的对象包含全部必填字段且类型正确
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 4. 实现管理布局组件
  - [x] 4.1 实现 Sidebar 组件
    - 创建 `src/views/LessonPrep/Sidebar.vue`
    - 实现菜单树结构（首页、我的教学、教学评价、数据统计及其子项）
    - 实现菜单组折叠/展开功能
    - 高亮当前活跃菜单项（左边框 + 背景色）
    - 点击菜单项通过 `router.push()` 导航
    - 显示 Logo 和平台名称，宽度约 200px
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.1, 10.2_

  - [x] 4.2 实现 BreadcrumbNav 组件
    - 创建 `src/views/LessonPrep/BreadcrumbNav.vue`
    - Props 接收 `items: BreadcrumbItem[]`
    - 除最后一项外，所有项渲染为可点击链接
    - 最后一项渲染为纯文本
    - 白色背景条，定位在内容区顶部
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.6_

  - [ ]* 4.3 编写 BreadcrumbNav 属性测试
    - **Property 6: Breadcrumb last segment is not a link**
    - 对任意长度 ≥ 1 的 BreadcrumbItem 数组，验证最后一项为纯文本，其余为链接
    - **Validates: Requirements 3.4**

  - [x] 4.4 实现 ManagementLayout 组件
    - 创建 `src/views/LessonPrep/ManagementLayout.vue`
    - 组合 Sidebar + BreadcrumbNav + `<router-view />`
    - 根据当前路由动态计算面包屑 items
    - 内容区使用浅灰背景 (#f5f5f5)
    - _Requirements: 3.1, 3.2, 10.3_

  - [x] 4.5 实现 PlaceholderPage 组件
    - 创建 `src/views/LessonPrep/PlaceholderPage.vue`
    - 通过 `route.params.menuKey` 显示"功能开发中"提示
    - _Requirements: 2.6_

- [x] 5. Checkpoint - 布局与导航验证
  - 确保 ManagementLayout 正确渲染 Sidebar 和 BreadcrumbNav，菜单导航和面包屑跳转正常工作。如有问题请向用户确认。

- [x] 6. 实现教材列表页
  - [x] 6.1 实现 TextbookCard 组件
    - 创建 `src/views/LessonPrep/TextbookCard.vue`
    - Props: `textbook: Textbook`，Emits: `toggle-favorite`、`click`
    - 显示封面图（含 @error 占位图处理）、教材名称、课件数量
    - 收藏星标按钮（实心/空心切换）
    - `isDelisted` 为 true 时显示"已下架"标签
    - 白色背景、圆角、阴影样式
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 10.4_

  - [ ]* 6.2 编写 TextbookCard 属性测试
    - **Property 3: Textbook card rendering completeness**
    - 对任意 Textbook 对象，验证卡片渲染封面、名称、课件数，且"已下架"标签仅在 isDelisted 为 true 时显示
    - **Validates: Requirements 5.1, 5.4**
    - **Property 4: Favorite toggle is an involution**
    - 对任意初始收藏状态，验证切换一次翻转，切换两次恢复原状
    - **Validates: Requirements 5.3**

  - [x] 6.3 实现 TextbookListPage 页面
    - 创建 `src/views/LessonPrep/TextbookListPage.vue`
    - 加载 mock 教材数据，3 列网格布局展示 TextbookCard
    - 搜索输入框（placeholder "请输入教程名称"），按名称过滤
    - "全部"/"收藏" tab 切换，默认"全部"
    - 收藏切换功能（更新本地状态）
    - 点击卡片导航到 `/lesson-prep/:textbookId`
    - 空搜索结果显示"未找到相关内容"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.3, 5.5, 10.3_

  - [ ]* 6.4 编写搜索过滤和收藏 tab 属性测试
    - **Property 1: Search filter correctness**
    - 对任意教材列表和搜索关键词，验证过滤结果恰好包含名称含关键词的项（不区分大小写）
    - **Validates: Requirements 4.3**
    - **Property 2: Favorite tab filter correctness**
    - 对任意教材列表，"收藏" tab 返回恰好 isFavorited 为 true 的项，"全部" tab 返回所有项
    - **Validates: Requirements 4.5, 4.6**

  - [ ]* 6.5 编写卡片点击导航属性测试
    - **Property 5: Card click navigates to correct detail route**
    - 对任意 textbook，点击卡片应触发导航到 `/lesson-prep/{textbook.id}`
    - **Validates: Requirements 5.5, 1.3**

- [x] 7. Checkpoint - 教材列表页验证
  - 确保教材列表页正常展示卡片网格、搜索过滤、tab 切换、收藏功能均正常。如有问题请向用户确认。

- [x] 8. 实现教材详情页
  - [x] 8.1 实现 CourseManagementTab 组件
    - 创建 `src/views/LessonPrep/CourseManagementTab.vue`
    - Props: `textbookId: string`
    - 加载对应教材的教程数据，表格展示（序号、教程名称、已发布班课、操作）
    - 官方教程显示"官方教程"标签
    - 搜索输入框（placeholder "请输入教程名称"）按名称过滤
    - 分页控件：总数超过 pageSize 时显示，否则隐藏
    - "预览"操作按钮
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.5_

  - [ ]* 8.2 编写教程管理属性测试
    - **Property 7: Official course tag visibility**
    - 对任意 Course 对象，"官方教程"标签仅在 isOfficial 为 true 时可见
    - **Validates: Requirements 6.4**
    - **Property 8: Pagination visibility threshold**
    - 对任意长度课程列表和 pageSize，分页控件仅在总数 > pageSize 时显示
    - **Validates: Requirements 6.6**

  - [x] 8.3 实现 CoursewareManagementTab 组件
    - 创建 `src/views/LessonPrep/CoursewareManagementTab.vue`
    - Props: `textbookId: string`
    - 加载对应教材的课件数据，表格展示（序号、课件名称、教程名称、操作）
    - 搜索输入框（placeholder "请输入课件名称"）按名称过滤
    - "上传本地课件"（secondary）和"新建在线课件"（primary blue）按钮
    - 空状态：插图 + "暂无课件"文案
    - "编辑"按钮导航到 `/editor/:coursewareId`，"预览"按钮
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.4, 8.5, 8.6, 10.5_

  - [ ]* 8.4 编写课件搜索过滤属性测试
    - **Property 1: Search filter correctness (coursewares)**
    - 对任意课件列表和搜索关键词，验证过滤结果正确
    - **Validates: Requirements 7.5**

  - [x] 8.5 实现 ChapterSelectModal 组件
    - 创建 `src/views/LessonPrep/ChapterSelectModal.vue`
    - Props: `visible`、`textbookId`、`chapters`
    - Emits: `close`、`confirm(chapterId)`
    - 展示章节列表供选择，"生成"按钮确认
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 8.6 编写章节选择生成课件属性测试
    - **Property 9: Chapter selection produces correct courseware**
    - 对任意选中的章节，生成的课件条目关联正确的章节信息，且出现在课件表格中
    - **Validates: Requirements 8.3**

  - [x] 8.7 实现 TextbookDetailPage 页面
    - 创建 `src/views/LessonPrep/TextbookDetailPage.vue`
    - 通过 `route.params.textbookId` 获取教材 ID，加载教材数据
    - "教程管理"/"课件管理" tab 切换，默认"教程管理"
    - 集成 CourseManagementTab 和 CoursewareManagementTab
    - 集成 ChapterSelectModal，处理新建在线课件流程
    - 教材不存在时显示提示并提供返回列表页链接
    - _Requirements: 6.1, 7.2, 8.1, 8.3, 8.4_

- [x] 9. Checkpoint - 教材详情页验证
  - 确保详情页 tab 切换、教程表格、课件表格、新建课件流程、编辑导航均正常。如有问题请向用户确认。

- [x] 10. 集成联调与最终验证
  - [x] 10.1 全流程集成验证
    - 验证完整用户流程：列表页 → 点击卡片 → 详情页 → 新建课件 → 编辑器
    - 验证编辑器返回导航（浏览器后退）
    - 验证 catch-all 路由重定向
    - 验证所有面包屑导航路径正确
    - 确保编辑器在 `/editor` 路由下功能无回归
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.5, 8.5_

- [x] 11. Final checkpoint - 全部功能验证
  - 确保所有测试通过，所有页面功能正常，编辑器无回归。如有问题请向用户确认。

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- The existing PPTist editor must remain fully functional after router integration (Requirement 1.5)
- All mock data files go under `public/mocks/`, consistent with existing project patterns
