# Requirements Document

## Introduction

本需求描述 U 校园备授课管理模块的两个核心页面：教材列表页和教材详情页。该模块是 AI 备课工具的入口，教师通过教材列表选择教材，进入详情页管理教程和课件，最终可通过 AI 生成在线课件并进入 PPTist 编辑器进行编辑。

当前为 demo 阶段，使用 mock 数据，纯前端运行。项目基于 PPTist 开源项目（Vue 3 + TypeScript），当前无 vue-router，需引入路由机制支撑多页面导航。

## Glossary

- **App**: 整个前端应用，负责路由分发和全局状态管理
- **Router**: Vue Router 路由实例，管理页面间的导航
- **Sidebar**: 左侧导航栏组件，展示菜单树结构（首页、我的教学、教学评价、数据统计）
- **BreadcrumbNav**: 面包屑导航组件，展示当前页面在菜单树中的路径
- **TextbookListPage**: 备授课管理页面（教材列表页），展示教师可用的教材卡片网格
- **TextbookCard**: 教材卡片组件，展示教材封面、名称、课件数量、收藏状态和下架标签
- **TextbookDetailPage**: 教材详情页，包含教程管理和课件管理两个 tab
- **CourseManagementTab**: 教程管理 tab，以表格形式展示教材下的教程列表
- **CoursewareManagementTab**: 课件管理 tab，以表格形式展示课件列表，支持上传和新建在线课件
- **CoursewareGenerator**: 课件生成功能，选择教材章节后获取或生成在线课件
- **iPub**: 外研社数字出版平台（iPublish），教研人员在此平台将数字教材转为课件并上架
- **上架课件**: 教研人员在 iPub 平台将数字教材转为课件、美化后"上架"的课件，与特定教材的特定章节绑定
- **教师课件**: 从上架课件复制或自动生成的课件副本，归属于特定教师 + 特定教材 + 特定章节，教师可自由编辑，不影响原始上架课件
- **MockDataService**: Mock 数据服务，提供教材、教程、课件等模拟数据
- **PPTistEditor**: 现有的 PPTist 幻灯片编辑器，用于编辑在线课件

## Requirements

### Requirement 1: 路由系统引入

**User Story:** As a 教师, I want to 在备授课管理页面和课件编辑器之间自由导航, so that 我可以在管理教材和编辑课件之间无缝切换。

#### Acceptance Criteria

1. THE App SHALL use Vue Router to manage navigation between TextbookListPage, TextbookDetailPage, and PPTistEditor
2. WHEN the user navigates to the root path `/`, THE Router SHALL redirect to the TextbookListPage at `/lesson-prep`
3. WHEN the user navigates to `/lesson-prep/:textbookId`, THE Router SHALL render the TextbookDetailPage with the corresponding textbook data
4. WHEN the user navigates to `/editor` or `/editor/:coursewareId`, THE Router SHALL render the existing PPTistEditor view
5. THE App SHALL preserve the existing PPTistEditor functionality without regression after Router integration

### Requirement 2: 左侧导航栏

**User Story:** As a 教师, I want to 通过左侧导航栏快速切换功能模块, so that 我可以高效地在不同功能之间导航。

#### Acceptance Criteria

1. THE Sidebar SHALL display a vertical navigation menu with the following tree structure: 首页, 我的教学（班课中心/备授课管理/补充资源/作业/题库）, 教学评价（考核方案/综合成绩）, 数据统计（学情分析）
2. THE Sidebar SHALL highlight the currently active menu item with a visual indicator (left border accent and background color change)
3. WHEN the user clicks on "备授课管理" menu item, THE Sidebar SHALL navigate to the TextbookListPage
4. WHILE the user is on TextbookListPage or TextbookDetailPage, THE Sidebar SHALL keep "备授课管理" menu item in active state
5. THE Sidebar SHALL support collapsing and expanding parent menu groups (我的教学, 教学评价, 数据统计)
6. WHEN the user clicks on a menu item other than "备授课管理", THE Sidebar SHALL display a placeholder page indicating the feature is under development

### Requirement 3: 面包屑导航

**User Story:** As a 教师, I want to 通过面包屑导航了解当前所在位置并快速返回上级页面, so that 我不会在多级页面中迷失方向。

#### Acceptance Criteria

1. WHILE the user is on TextbookListPage, THE BreadcrumbNav SHALL display "我的教学 / 备授课管理"
2. WHILE the user is on TextbookDetailPage, THE BreadcrumbNav SHALL display "我的教学 / 备授课管理 / {教材名称}", where {教材名称} is the name of the selected textbook
3. WHEN the user clicks on "备授课管理" in the breadcrumb on TextbookDetailPage, THE BreadcrumbNav SHALL navigate back to TextbookListPage
4. THE BreadcrumbNav SHALL render each breadcrumb segment as a clickable link except the last segment which represents the current page

### Requirement 4: 教材列表页

**User Story:** As a 教师, I want to 浏览和搜索我的教材列表, so that 我可以快速找到需要备课的教材。

#### Acceptance Criteria

1. THE TextbookListPage SHALL display textbook cards in a 3-column grid layout
2. THE TextbookListPage SHALL provide a search input with placeholder text "请输入教程名称" that filters textbook cards by name
3. WHEN the user types in the search input, THE TextbookListPage SHALL filter the displayed textbook cards to show only those whose names contain the search keyword
4. THE TextbookListPage SHALL provide two tabs: "全部" and "收藏", defaulting to "全部"
5. WHEN the user selects the "收藏" tab, THE TextbookListPage SHALL display only textbooks that are marked as favorited
6. WHEN the user selects the "全部" tab, THE TextbookListPage SHALL display all textbooks

### Requirement 5: 教材卡片

**User Story:** As a 教师, I want to 查看每本教材的关键信息并收藏常用教材, so that 我可以快速识别和访问常用教材。

#### Acceptance Criteria

1. THE TextbookCard SHALL display the textbook cover image, textbook name, and courseware count
2. THE TextbookCard SHALL display a star icon button for toggling the favorite status
3. WHEN the user clicks the star icon on a TextbookCard, THE TextbookCard SHALL toggle the favorite status of that textbook and update the star icon appearance (filled for favorited, outlined for unfavorited)
4. WHILE a textbook is marked as delisted, THE TextbookCard SHALL display an "已下架" label overlay on the card
5. WHEN the user clicks on a TextbookCard, THE TextbookCard SHALL navigate to the TextbookDetailPage for that textbook

### Requirement 6: 教材详情页 — 教程管理

**User Story:** As a 教师, I want to 查看教材下的所有教程并预览教程内容, so that 我可以了解教材的教学内容结构。

#### Acceptance Criteria

1. THE TextbookDetailPage SHALL provide two tabs: "教程管理" and "课件管理", defaulting to "教程管理"
2. THE CourseManagementTab SHALL display a search input with placeholder text "请输入教程名称" for filtering courses by name
3. THE CourseManagementTab SHALL display courses in a table with columns: 序号, 教程名称, 已发布班课, 操作
4. WHILE a course is an official course, THE CourseManagementTab SHALL display an "官方教程" tag next to the course name
5. THE CourseManagementTab SHALL provide a "预览" action button in the 操作 column for each course row
6. WHEN the total number of courses exceeds the page size, THE CourseManagementTab SHALL display a pagination control at the bottom of the table
7. WHEN the user types in the search input, THE CourseManagementTab SHALL filter the table rows to show only courses whose names contain the search keyword

### Requirement 7: 教材详情页 — 课件管理

**User Story:** As a 教师, I want to 管理教材下的课件, so that 我可以上传、创建和组织我的教学课件。

#### Acceptance Criteria

1. THE CoursewareManagementTab SHALL display a search input with placeholder text "请输入课件名称" for filtering coursewares by name
2. THE CoursewareManagementTab SHALL provide two action buttons: "上传本地课件" (secondary style) and "新建在线课件" (primary blue style)
3. THE CoursewareManagementTab SHALL display coursewares in a table with columns: 序号, 课件名称, 教程名称, 操作
4. WHILE there are no coursewares, THE CoursewareManagementTab SHALL display an empty state with an illustration and the text "暂无课件"
5. WHEN the user types in the search input, THE CoursewareManagementTab SHALL filter the table rows to show only coursewares whose names contain the search keyword

### Requirement 8: 新建在线课件流程

**User Story:** As a 教师, I want to 通过选择教材章节来获取或生成在线课件, so that 我可以快速基于教材内容创建属于自己的课件并进行二次编辑。

#### 课件来源业务规则

课件按章生成（每章一个课件，不是整本书），来源分两种情况：

1. **有上架课件的章节**：教研人员在 iPub 平台将数字教材转为课件并美化后"上架"，上架课件与该教材的该章节绑定。当教师选择该章节生成课件时，系统从已上架的课件复制一份副本给教师。
2. **无上架课件的章节**：如果该章节在 iPub 上没有已上架的课件，系统自动根据该章的数字教材内容生成一份课件给教师。

无论哪种来源，生成的课件都是教师的私有副本（绑定：教师 + 教材 + 章节），教师可以自由编辑修改，不会影响 iPub 上教研人员上架的原始课件。

#### Acceptance Criteria

1. WHEN the user clicks "新建在线课件" button, THE CoursewareGenerator SHALL display a modal dialog for selecting a textbook chapter
2. THE CoursewareGenerator SHALL display the textbook's chapter list for the user to select from
3. WHEN the user selects a chapter and clicks the "生成" button, THE CoursewareGenerator SHALL check whether the selected chapter has a published (上架) courseware on iPub
4. WHILE the selected chapter has a published courseware on iPub, THE CoursewareGenerator SHALL create a copy of the published courseware as the teacher's private courseware
5. WHILE the selected chapter does NOT have a published courseware on iPub, THE CoursewareGenerator SHALL automatically generate a new courseware from the chapter's digital textbook content
6. THE generated courseware SHALL be bound to the specific teacher, textbook, and chapter, and SHALL be independently editable without affecting the original published courseware on iPub
7. WHEN courseware generation completes, THE CoursewareManagementTab SHALL add the new courseware to the table and provide "编辑" and "预览" action buttons
8. WHEN the user clicks "编辑" on a courseware entry, THE App SHALL navigate to the PPTistEditor with the corresponding courseware data loaded
9. WHEN the user clicks "预览" on a courseware entry, THE App SHALL open a preview of the courseware content

### Requirement 9: Mock 数据服务

**User Story:** As a 开发者, I want to 使用 mock 数据驱动所有页面, so that demo 阶段可以独立运行而不依赖后端服务。

#### Acceptance Criteria

1. THE MockDataService SHALL provide a list of textbook objects, each containing: id, name, coverImage, coursewareCount, isFavorited, isDelisted
2. THE MockDataService SHALL provide a list of course objects for each textbook, each containing: id, name, isOfficial, publishedClassCount
3. THE MockDataService SHALL provide a list of courseware objects for each textbook, each containing: id, name, courseName, slideData
4. THE MockDataService SHALL provide a list of chapter objects for each textbook, each containing: id, name, orderIndex
5. THE MockDataService SHALL store data in JSON files under the `public/mocks/` directory, consistent with the existing mock data pattern in the project

### Requirement 10: 页面布局与视觉还原

**User Story:** As a 教师, I want to 看到与 U 校园一致的界面风格, so that 我可以获得熟悉的操作体验。

#### Acceptance Criteria

1. THE Sidebar SHALL have a width of approximately 200px with a white background and right border separator
2. THE Sidebar SHALL display the U 校园 logo and platform name at the top
3. THE TextbookListPage SHALL use a light gray background (#f5f5f5 or similar) for the content area
4. THE TextbookCard SHALL have a white background with rounded corners and subtle shadow, displaying the cover image at the top and text information below
5. THE CourseManagementTab and CoursewareManagementTab SHALL use a standard table style with alternating row backgrounds or bordered rows consistent with the U 校园 design system
6. THE BreadcrumbNav SHALL be positioned at the top of the content area with a white background bar
