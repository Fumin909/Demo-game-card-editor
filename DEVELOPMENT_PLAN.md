# 卡牌编辑器（Game Card Editor）开发方案

## 一、技术栈选型

根据 SDS 规范要求，结合前端生态，推荐技术栈：

| 类别 | 技术选型 | 选型理由 |
|------|----------|----------|
| 开发语言 | TypeScript (严格模式) | SDS 明确要求 |
| 前端框架 | React 18 + Vite | 组件化开发、生态成熟、构建快速 |
| 画布引擎 | Konva.js (react-konva) | 专门面向 Canvas 交互，内置对象选择、拖拽、缩放、旋转、事件系统 |
| 状态管理 | Zustand | 轻量、简单、TypeScript 友好，适合编辑器状态管理 |
| UI 组件库 | Tailwind CSS + shadcn/ui | 符合 UIS 简洁设计风格，可定制性强 |
| 本地存储 | IndexedDB (Dexie.js 封装) | 支持大容量二进制存储（图片素材）、异步 API |
| 文件处理 | File System Access API + 降级方案 | 本地部署场景下的文件系统访问 |
| 图片导出 | Konva toDataURL / canvas-to-blob | 原生支持高清 PNG 导出 |
| 历史记录 | Immer + 自定义命令模式 | 实现 Undo/Redo |

---

## 二、项目目录结构

```
/workspace/
├── src/
│   ├── types/              # TypeScript 类型定义
│   │   ├── project.ts
│   │   ├── card.ts
│   │   ├── layer.ts
│   │   └── template.ts
│   ├── stores/             # Zustand 状态管理
│   │   ├── workspaceStore.ts
│   │   ├── editorStore.ts
│   │   └── historyStore.ts
│   ├── managers/           # 核心管理器
│   │   ├── WorkspaceManager.ts
│   │   ├── ProjectManager.ts
│   │   ├── TemplateManager.ts
│   │   ├── AssetManager.ts
│   │   └── ExportEngine.ts
│   ├── components/
│   │   ├── layout/         # 布局组件
│   │   ├── canvas/         # 画布相关组件
│   │   ├── panels/         # 右侧面板
│   │   ├── resources/      # 左侧资源区
│   │   ├── dialogs/        # 对话框组件
│   │   └── common/         # 通用 UI 组件
│   ├── hooks/              # React Hooks
│   ├── utils/              # 工具函数
│   ├── assets/             # 静态资源
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── templates/          # 内置示例模板
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 三、核心数据模型定义

```typescript
// 工作空间
interface Workspace {
  id: string;
  name: string;
  projects: Project[];
  templates: Template[];
}

// 项目
interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  canvasSize: { width: number; height: number };
  cards: Card[];
  assets: Asset[];
}

// 卡牌
interface Card {
  id: string;
  name: string;
  projectId: string;
  canvasSize: { width: number; height: number };
  layers: Layer[];
  createdAt: number;
  updatedAt: number;
  previewUrl?: string;
}

// 图层（对象）- 统一基类
interface BaseLayer {
  id: string;
  type: 'image' | 'text';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

interface ImageLayer extends BaseLayer {
  type: 'image';
  assetId: string;
}

interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

type Layer = ImageLayer | TextLayer;

// 素材
interface Asset {
  id: string;
  name: string;
  projectId: string;
  blob: Blob;
  thumbnailUrl: string;
  size: number;
  createdAt: number;
}

// 模板
interface Template {
  id: string;
  name: string;
  category: string;
  canvasSize: { width: number; height: number };
  defaultLayers: Layer[];
  previewUrl: string;
}
```

---

## 四、开发阶段与详细步骤

### Phase 1: Workspace、Project 基础框架

**目标**：搭建项目骨架，实现项目管理基础功能

| 任务 | 说明 | 验收标准 |
|------|------|----------|
| 1.1 项目初始化 | Vite + React + TypeScript 项目搭建，配置 Tailwind 和 shadcn/ui | `npm run dev` 可运行，基础页面显示 |
| 1.2 类型定义 | 定义所有核心 TypeScript 接口 | 类型完整，TS 编译无错误 |
| 1.3 布局框架实现 | 按 UIS 实现三栏布局（顶栏、左、中、右、底部状态栏） | 界面布局与 UIS 一致，区域划分正确 |
| 1.4 本地存储层 | Dexie.js 封装 IndexedDB，实现 Project 的 CRUD | 项目可创建、保存、重新打开后数据存在 |
| 1.5 项目列表页 | 项目首页：显示项目列表、新建项目按钮 | 可新建项目、打开项目进入编辑页 |
| 1.6 基础状态管理 | 实现 workspaceStore、editorStore 基础框架 | 状态可在组件间共享 |

---

### Phase 2: 模板系统与素材管理

**目标**：实现模板库和图片素材库管理

| 任务 | 说明 | 验收标准 |
|------|------|----------|
| 2.1 模板管理器 | TemplateManager 实现，内置 1-2 个示例模板 | 左侧 Templates 标签显示模板缩略图 |
| 2.2 从模板创建卡牌 | 双击模板创建新卡牌，复制默认图层 | 选择模板后画布显示预设内容 |
| 2.3 素材上传 | 支持图片上传（拖拽/点击），保存到 IndexedDB | 图片上传后显示在 Assets 网格中 |
| 2.4 素材管理 UI | 素材缩略图网格、重命名、删除、搜索 | 素材列表正常显示，操作生效 |
| 2.5 左侧资源区 Tab 切换 | Project/Templates/Assets/Cards 四个 Tab 可切换 | Tab 切换正常，对应内容显示 |
| 2.6 卡牌列表 | Cards 标签显示当前项目卡牌缩略图 | 卡牌列表显示、双击可切换 |

---

### Phase 3: 画布与图层系统

**目标**：实现核心画布渲染和对象管理

| 任务 | 说明 | 验收标准 |
|------|------|----------|
| 3.1 Konva 画布集成 | react-konva 集成，固定尺寸画布居中显示 | 白色画布在浅灰工作区中居中，缩放查看 |
| 3.2 画布交互 | 滚轮缩放、空格+拖拽平移、双击适应窗口 | 画布缩放平移工作正常 |
| 3.3 图层渲染 | ImageLayer 和 TextLayer 在 Konva 中正确渲染 | 所有图层按 zIndex 顺序显示 |
| 3.4 对象选择 | 点击画布对象选中，显示蓝色边框和 8 个控制点 | 选中态正确显示，点击空白取消选择 |
| 3.5 对象移动 | 拖拽选中对象移动，实时更新位置 | 移动流畅，坐标实时更新 |
| 3.6 对象缩放 | 拖拽控制点缩放，支持等比例缩放（Shift） | 缩放正常，尺寸实时显示 |
| 3.7 对象旋转 | 旋转控制柄拖拽旋转 | 旋转以中心点为轴正常工作 |
| 3.8 对象列表 UI | 右侧对象列表，显示缩略图、名称、显隐、锁定按钮 | 对象列表与画布同步显示所有图层 |
| 3.9 列表与画布联动 | 点击列表选中对象，点击画布定位到列表 | 双向联动正常 |
| 3.10 显隐/锁定切换 | 点击眼睛/锁图标切换状态 | 隐藏对象不显示，锁定对象不可编辑 |
| 3.11 拖拽排序 | 列表项拖拽调整 zIndex 顺序 | 拖拽排序，画布层级实时更新 |
| 3.12 重命名/删除/复制 | 对象列表项操作 | 所有操作生效，画布同步更新 |

---

### Phase 4: 图片与文字编辑

**目标**：完善图片和文字对象的属性编辑

| 任务 | 说明 | 验收标准 |
|------|------|----------|
| 4.1 属性面板框架 | 右侧属性面板，根据选中对象切换内容 | 未选中/图片/文字三种状态切换正确 |
| 4.2 画布属性显示 | 未选中对象时显示画布尺寸、缩放比例 | 属性显示正确 |
| 4.3 图片属性面板 | X/Y 坐标、宽高、旋转、透明度、替换图片 | 修改属性实时生效，替换图片保持位置 |
| 4.4 从素材拖入创建对象 | 将素材库图片拖到画布创建 ImageLayer | 拖拽释放后新图片对象出现在对应位置 |
| 4.5 添加图片/文字按钮 | 顶栏添加按钮创建新对象 | 点击后新建对象出现在画布中央 |
| 4.6 文字对象渲染 | Konva Text 组件渲染文字图层 | 文字按设置的字体、字号、颜色显示 |
| 4.7 文字属性面板 | 内容、字体、字号、字重、颜色、对齐、行高、字间距 | 所有属性修改实时刷新画布 |
| 4.8 文字双击编辑 | 双击文字对象进入编辑态，Enter 或点击空白结束 | 可直接在画布上编辑文字内容 |
| 4.9 底部状态栏 | 显示当前项目、卡牌、缩放、对象数、保存状态 | 状态栏信息实时更新 |

---

### Phase 5: 保存与恢复 + Undo/Redo

**目标**：实现数据持久化和历史记录功能

| 任务 | 说明 | 验收标准 |
|------|------|----------|
| 5.1 命令模式历史记录 | 基于命令模式实现 Undo/Redo 栈 | 操作可逆 |
| 5.2 所有操作入栈 | 创建/删除/移动/缩放/旋转/改属性/排序都进入历史 | 至少支持 100 步撤销/重做 |
| 5.3 连续操作合并 | 拖拽/缩放/旋转过程中不每帧记录，结束后合并为一条 | 拖放操作 Undo 一次回到初始位置 |
| 5.4 顶栏 Undo/Redo 按钮 | 撤销重做按钮 | 按钮工作正常 |
| 5.5 卡牌 JSON 序列化 | 将 Card 完整序列化为 JSON 保存 | card.json 包含所有图层完整状态 |
| 5.6 卡牌保存 | 手动保存按钮，保存到 IndexedDB | 保存后刷新页面数据还在 |
| 5.7 自动保存 | 停止编辑数秒后、导出前、切换卡牌前自动保存 | 自动保存触发 |
| 5.8 卡牌恢复 | 重新打开卡牌时恢复所有图层状态 | 打开后与保存时完全一致，可继续编辑 |
| 5.9 异常恢复 | 异常时自动保存，重新进入恢复最近状态 | 模拟异常后数据不丢失 |

---

### Phase 6: PNG 与缩略图导出

**目标**：实现高清导出和自动缩略图生成

| 任务 | 说明 | 验收标准 |
|------|------|----------|
| 6.1 Konva 导出 PNG | 使用 Konva stage.toDataURL 导出画布内容 | 导出图片与画布显示一致 |
| 6.2 导出可见对象 | 仅导出可见对象，隐藏对象排除 | 隐藏图层不在导出图片中 |
| 6.3 高清导出 | 按原始画布尺寸导出 | 导出图片为画布设定的分辨率 |
| 6.4 缩略图生成 | 同时生成小尺寸 preview.png | 生成缩略图用于列表展示 |
| 6.5 保存到本地文件 | 使用 File System Access API 保存到本地 | 用户可选择保存位置，文件写入成功 |
| 6.6 浏览器下载降级 | 不支持 FS API 时用 a 标签下载 | 两种方式都能成功导出 |
| 6.7 项目内缩略图关联 | 缩略图保存到 Project，卡牌列表显示最新缩略图 | 导出后卡牌列表缩略图更新 |

---

### Phase 7: 测试、优化与发布

**目标**：完善体验，修复 bug，准备交付

| 任务 | 说明 | 验收标准 |
|------|------|----------|
| 7.1 示例模板制作 | 制作 2-3 个完整示例模板 | 内置模板可直接使用 |
| 7.2 示例项目 | 创建一个示例项目包含多张示例卡牌 | 打开即可看到效果 |
| 7.3 全局快捷键 | Ctrl+Z、Ctrl+Y、Ctrl+S 等 | 常用快捷键工作 |
| 7.4 对话框完善 | 新建项目/卡牌、删除确认等弹窗 | 所有对话框样式统一，Enter/Esc 支持 |
| 7.5 边界情况处理 | 素材被引用时不允许删除等 | 异常操作有友好提示 |
| 7.6 性能优化 | 大量图层时卡顿优化 | 20+ 图层仍流畅操作 |
| 7.7 UI 细节打磨 | 配色按 UIS、hover 效果、过渡动画 | 视觉效果符合 UIS 规范 |
| 7.8 响应式适配 | 1440x900 到 1920x1080 正常显示 | 窗口缩放布局不错乱 |
| 7.9 构建打包 | Vite build 打包生产版本 | 构建产物可直接静态部署 |
| 7.10 README 编写 | 项目说明、运行方式、功能介绍 | 文档完整 |

---

## 五、关键技术难点与解决方案

| 难点 | 解决方案 |
|------|----------|
| Undo/Redo 实现 | 使用命令模式（Command Pattern），每个操作封装为 `execute()` 和 `undo()` 方法，拖拽等连续操作在 mouseup 时才入栈 |
| 图片素材存储 | 图片 Blob 直接存 IndexedDB，内存中用 URL.createObjectURL 引用，注意释放内存 |
| 文字编辑体验 | Konva 的 Text 组件本身不支持直接输入，双击时用隐藏 textarea 覆盖实现原位编辑 |
| 画布坐标转换 | 使用 `stage.getPointerPosition()`，注意缩放比例下的坐标转换 |
| 导出高清图 | 设置 Konva 的 `pixelRatio` 为原始尺寸/显示尺寸，确保导出分辨率不随缩放变化 |
| 本地文件访问 | 优先使用 File System Access API，降级为传统 download 方式 |

---

## 六、模块依赖关系

```
Persistence (Dexie)
    ↑
WorkspaceManager
    ↑
ProjectManager ─→ TemplateManager
    ↑                ↑
AssetManager        │
    ↑                │
Canvas Editor ─→ Layer/Object Manager
    ↑                ↑
Property Panel ←─────┘
    ↑
Export Engine
```

建议从底向上开发：**类型定义 → 存储层 → 管理器 → UI 组件 → 画布交互 → 功能整合**。
