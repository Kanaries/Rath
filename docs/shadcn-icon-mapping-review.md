# Rath Icon Mapping Review

This document is the Stage 4 human-review artifact for `src/components/icons/legacy-map.ts`.

The source of truth remains `packages/rath-client/src/components/icons/legacy-map.ts`. Review the semantic fit of each legacy MDL2 name to the proposed lucide icon before continuing with Stage 4 replacements.

## Coverage Notes

- Total legacy names: 117.
- Includes direct `iconName`, `iconProps`, AppNav dynamic names, conditional names, database tree names, comparison indicator names, and the bare `ms-Icon` nav toggle names.
- Lowercase historical names are kept as-is: `database`, `delete`, `download`, `edit`, `filter`, `globe`, `upload`.
- Dynamic file type icons from `getFileIcon(...)` are not replaced in this checkpoint; those call sites need separate handling when replacing `<Icon>`.

## Mapping Table

| Legacy MDL2 name | Proposed lucide icon | Intended meaning |
|---|---|---|
| `Add` | `Plus` | 新增 |
| `AddLink` | `Link2` | 添加关联 |
| `AlignHorizontalLeft` | `AlignHorizontalJustifyStart` | 左侧对齐 |
| `AlignHorizontalRight` | `AlignHorizontalJustifyEnd` | 右侧对齐 |
| `AnalyticsView` | `ChartSpline` | 分析视图 |
| `AppIconDefaultAdd` | `SquarePlus` | 添加应用项 |
| `AutoEnhanceOn` | `Sparkles` | 自动增强 |
| `Back` | `ArrowLeft` | 返回 |
| `BackToWindow` | `PanelTopClose` | 回到主窗口 |
| `BarChartVerticalEdit` | `ChartColumnIncreasing` | 图表编辑 |
| `Blocked2` | `Ban` | 阻塞/禁止 |
| `BranchMerge` | `GitMerge` | 分支合并 |
| `Broom` | `BrushCleaning` | 清理 |
| `Brush` | `Brush` | 画笔 |
| `BulletedList` | `List` | 列表 |
| `Cancel` | `X` | 取消/关闭 |
| `CaretSolidDown` | `ArrowDown` | 下降 |
| `CaretSolidUp` | `ArrowUp` | 上升 |
| `CheckMark` | `Check` | 确认 |
| `Checkbox` | `SquareCheckBig` | 勾选框 |
| `CheckboxComposite` | `ListChecks` | 批量勾选 |
| `ChevronLeft` | `ChevronLeft` | 左翻页 |
| `ChevronRight` | `ChevronRight` | 右翻页 |
| `ChromeClose` | `X` | 关闭 |
| `ChromeMinimize` | `Minus` | 最小化/持平 |
| `Cloud` | `Cloud` | 云端 |
| `CloudDownload` | `CloudDownload` | 云端下载 |
| `Color` | `Palette` | 颜色 |
| `Completed` | `CircleCheck` | 已完成 |
| `CompletedSolid` | `CircleCheckBig` | 已完成实心 |
| `ConfigurationSolid` | `Settings` | 配置 |
| `Copy` | `Copy` | 复制 |
| `D365TalentInsight` | `Brain` | 智能洞察 |
| `DataManagementSettings` | `DatabaseZap` | 数据管理 |
| `Database` | `Database` | 数据库 |
| `DecreaseIndent` | `IndentDecrease` | 收起导航 |
| `DecreaseIndentMirrored` | `IndentIncrease` | 展开导航 |
| `Delete` | `Trash2` | 删除 |
| `DeleteTable` | `Table2` | 删除表 |
| `Document` | `FileText` | 文档 |
| `DoubleChevronRight` | `ChevronsRight` | 下一组 |
| `Download` | `Download` | 下载 |
| `Edit` | `Pencil` | 编辑 |
| `EditCreate` | `FileChartColumn` | 创建/编辑图表 |
| `EngineeringGroup` | `UsersRound` | 工程组 |
| `EraseTool` | `Eraser` | 橡皮擦 |
| `ErrorBadge` | `CircleX` | 错误 |
| `ExportMirrored` | `FileOutput` | 导出 |
| `FabricUserFolder` | `Folder` | 用户文件夹 |
| `FavoriteStar` | `Star` | 收藏 |
| `FavoriteStarFill` | `Star` | 已收藏 |
| `FieldEmpty` | `CircleDashed` | 空字段 |
| `FileTemplate` | `FileType` | 文件模板 |
| `Forward` | `ArrowRight` | 前进 |
| `GroupedAscending` | `ArrowUpDown` | 分组升序 |
| `GroupedDescending` | `ArrowDownUp` | 分组降序 |
| `Help` | `HelpCircle` | 帮助 |
| `HintText` | `Lightbulb` | 提示 |
| `History` | `History` | 历史 |
| `Info` | `Info` | 信息 |
| `InfoSolid` | `Info` | 重要信息 |
| `Lightbulb` | `Lightbulb` | 建议 |
| `LineChart` | `ChartLine` | 折线图 |
| `Link` | `Link` | 链接 |
| `LocaleLanguage` | `Languages` | 语言 |
| `Lock` | `Lock` | 锁定 |
| `Move` | `Move` | 移动 |
| `MultiSelect` | `ListChecks` | 多选 |
| `Next` | `ArrowRight` | 下一步 |
| `NumberField` | `Hash` | 数值字段 |
| `OpenInNewWindow` | `ExternalLink` | 新窗口打开 |
| `PhotoCollection` | `Images` | 图片集合 |
| `Pin` | `Pin` | 固定 |
| `PinSolid12` | `Pin` | 已固定 |
| `Pinned` | `Pin` | 已固定 |
| `Play` | `Play` | 运行 |
| `PlayerSettings` | `UserRoundCog` | 用户设置 |
| `Presentation` | `Presentation` | 仪表盘演示 |
| `Previous` | `ArrowLeft` | 上一步 |
| `ProductList` | `ListPlus` | 产品列表/树节点 |
| `Refresh` | `RefreshCw` | 刷新 |
| `Relationship` | `GitBranch` | 关系 |
| `Remove` | `X` | 移除 |
| `ReportAdd` | `FileInput` | 添加报表 |
| `Rerun` | `RotateCw` | 重新运行 |
| `Save` | `Save` | 保存 |
| `ScatterChart` | `ScatterChart` | 散点图 |
| `Search` | `Search` | 搜索 |
| `SearchIssue` | `SearchX` | 搜索问题 |
| `Settings` | `Settings` | 设置 |
| `SizeLegacy` | `PanelTopOpen` | 面板尺寸 |
| `SnapToGrid` | `Grid3X3` | 网格吸附 |
| `SplitObject` | `Share2` | 拆分对象 |
| `StatusCircleCheckmark` | `CircleCheck` | 状态成功 |
| `StatusCircleErrorX` | `CircleX` | 状态失败 |
| `Sync` | `RefreshCw` | 同步 |
| `SyncOccurence` | `RefreshCcw` | 同步发生项 |
| `Table` | `Table` | 表 |
| `TableGroup` | `TableProperties` | 表组 |
| `Tag` | `Tags` | 标签 |
| `Telemarketer` | `Headset` | 支持 |
| `TextField` | `TextCursorInput` | 文本字段 |
| `Trash` | `Trash2` | 垃圾桶 |
| `Trending12` | `TrendingUp` | 趋势 |
| `TripleColumn` | `Columns3` | 三列 |
| `Unlock` | `Unlock` | 解锁 |
| `Upload` | `Upload` | 上传 |
| `UserEvent` | `Activity` | 用户事件 |
| `ViewList` | `Rows3` | 列表视图 |
| `Waffle` | `Grid3X3` | 网格 |
| `database` | `Database` | 数据库兜底 |
| `delete` | `Trash2` | 删除，小写历史名 |
| `download` | `Download` | 下载，小写历史名 |
| `edit` | `Pencil` | 编辑，小写历史名 |
| `filter` | `SlidersHorizontal` | 过滤，小写历史名 |
| `globe` | `Globe` | 地理角色，小写历史名 |
| `upload` | `Upload` | 上传，小写历史名 |

## Reviewer Focus

Please pay extra attention to these semantic approximations:

- `FavoriteStarFill` uses `Star` for now; filled rendering may need styling or a custom icon later.
- `SizeLegacy` uses `PanelTopOpen`, which is an approximation for dashboard/page sizing.
- `D365TalentInsight` uses `Brain`; this is semantic rather than visually close.
- `DataManagementSettings` uses `DatabaseZap`; this is semantic rather than visually close.
- `GroupedAscending` / `GroupedDescending` use bidirectional sort icons; exact grouped icons do not exist in lucide.
