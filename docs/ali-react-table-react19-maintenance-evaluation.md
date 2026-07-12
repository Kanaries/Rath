# ali-react-table React 19 与长期维护评估

日期：2026-07-12
范围：`ali-react-table@2.6.1`、Rath 当前实际调用面、React 19 兼容性与替代路线

> 实施状态：推荐方案已于同日落地；最终 DataSource 实例已迁移到 `RathDataTable`，ali-react-table 已从依赖图移除。实施与验证见 [`ali-react-table-rathdatatable-migration.md`](./ali-react-table-rathdatatable-migration.md)。

## 结论

不建议把完整 ali-react-table fork 作为 Rath 的长期方案，也不建议把它的 BaseTable 源码原样复制进 Rath。

推荐路线是：**扩展已有的 `RathDataTable`，迁移最后一个 ali-react-table 使用点，然后删除 ali-react-table 依赖**。如果未来 Rath、Insider 或插件宿主之外确实出现第二个独立消费者，再把这个轻量表格抽成 workspace package；当前直接保留在 Rath component 层最轻、风险也最低。

React 19 本身不是主要障碍。最小 PoC 已证明 ali-react-table 全部源码可以在 Rath 的 TypeScript 5.9.3、React 19 types 与 styled-components 6.4.3 下编译。主要风险来自上游已归档、测试不足、构建链陈旧，以及 BaseTable 虚拟滚动实现的长期所有权。

## 上游状态

- 本地官方克隆：`/Users/claw/Documents/rath-workspace/ali-react-table`。
- `origin`：`https://github.com/alibaba/ali-react-table.git`。
- 当前 `master`：`847cc65`，最后提交日期 2022-05-19；fetch 后与 `origin/master` 一致。
- GitHub 仓库已经 archived，当前有 83 个 open issues。
- README 明确说明维护者没有时间积极维护。
- npm 最新版本仍为 2.6.1，发布于 2021-07，registry 最后修改于 2022-04；peer 仅声明 React 16/17。
- npm registry 的 `deprecated` 字段目前为空，但 GitHub archived 和 README 状态已经足够说明项目不再处于正常维护周期。
- License 为 MIT；若复制实质源码，需要保留版权和 license notice。

## Rath 的真实使用面

Rath 只有两个文件直接 import ali-react-table，合计一个生产实例：

| 文件 | 使用内容 |
| --- | --- |
| `pages/dataSource/dataTable/index.tsx` | `ArtColumn`；只使用 `name`、`code`、`width`、`title`、`render` |
| `pages/dataSource/dataTable/styles.tsx` | `BaseTable` 和 `Classes.tableHeaderCell` |

BaseTable 实际只接收：

- `dataSource`；
- `columns`；
- 固定高度/overflow style；
- `useVirtual=true`；
- `getRowProps`，用于给包含空值的行设置背景色。

Rath 没有使用 PivotTable、pipeline、transforms、树表、锁列、合并单元格、排序、导出或 selection 等 ali-react-table 能力。传入数据在上游已经截断到最多 1,000 行。

Rath 已有 [`RathDataTable`](../packages/rath-client/src/components/rath-ui/rath-data-table.tsx)：约 370 行，生产代码中约 14 个实例、11 个文件在使用，已经提供：

- 基于 `@tanstack/react-virtual` 的纵向虚拟化；
- 自定义 header/cell render；
- 固定/可调整列宽；
- 排序状态；
- 单选/多选；
- sticky header；
- 行点击和 hover；
- 键盘操作和基础可访问性。

因此 Rath 不需要再创建一套新的“轻量 ali-react-table”。现有组件已经是这套轻量实现，只缺最后一个复杂调用点的适配和性能验收。

## React 19 升级工作量

### 技术结论

ali-react-table 核心没有发现：

- `ReactDOM.render` / `hydrate`；
- `findDOMNode`；
- legacy lifecycle；
- `react-dom/test-utils`。

BaseTable 是 class component，使用 class `defaultProps`；这不是 React 19 删除的 function-component defaultProps 路径。

源码 PoC 位于 `/tmp/ali-react-table-react19-source-poc/`，使用 Rath 的 TypeScript 5.9.3、`@types/react@19.2.17`、React 19 和 styled-components 6.4.3。保持原项目关键语义 `strict=true`、`strictNullChecks=false`、`skipLibCheck=true` 和 classic JSX 后，全部源码及 5 个旧测试零类型错误。开启现代 strict null checking 会暴露大量历史类型债务，但这些不是 React 19 专属问题，因此不能把“React 19 源码兼容”表述为“现代化已经完成”。

运行 PoC 位于 `/tmp/ali-react-table-react19-runtime-poc/`：React 19 StrictMode、1,000 行 × 120 列、`useVirtual`、styled-components 6、Vite 8 build 全部通过。Playwright 同时纵向和横向滚动后：

- DOM 只保留约 20 行 / 300 个 cells；
- 首行索引从 0 前进到 413；
- 横向首个可见内容前进到第 40 列；
- console error 和 page error 均为 0。

PoC 总 bundle 约 302.82 kB / gzip 95.04 kB；同环境 React 19 空基线约 191.05 kB / gzip 60.30 kB，ali 表格及其 tree-shaken 依赖净增约 111.77 kB / gzip 34.74 kB。该数字是独立 PoC 近似值，不能直接套到 Rath 的共享 chunk。

Rath 当前 React 19 build 和包含 Demo 数据加载的 browser smoke 也会实际挂载该 BaseTable，运行通过且没有 React console error。

这能证明代码兼容性较好，但不能证明所有虚拟滚动场景已经被认证：上游只有一个 tree helper 测试文件，没有 BaseTable 组件测试或浏览器虚拟滚动测试。

### 工作量分层

| 目标 | 工程工作量 | QA 工作量 | 风险 |
| --- | ---: | ---: | --- |
| 仅修改 peer range，并允许 Rath 继续使用 2.6.1 | 0.5–1 人日 | 1–2 人日 | 中；缺少可信上游测试 |
| 发布具备基本维护门禁的 React 19 私有 fork | 4–7 人日（含评审/测试） | 已含 | 中高；需补 CI、StrictMode 和纵横虚拟回归 |
| 全面现代化 fork（strict null、工具链和旧架构清理） | 1–2 周以上 | 另计 | 高；容易演变成长期组件库项目 |
| 原样裁剪 BaseTable 为 workspace 包 | 8–13 人日 | 已含 | 中高；复杂度保留、收益有限 |
| 基于 RathDataTable 抽轻量 workspace 包 | 4–8 人日 | 已含 | 中；当前缺少第二消费者 |
| 直接增强 RathDataTable 并替换唯一调用 | 3–6 人日 | 已含 | 中低；无横向虚拟需求时可接近 2–4 人日 |

## 三种维护方案

### 方案 A：完整私有 fork

优点：

- 对 Rath 当前调用几乎可以 drop-in replacement；
- 保留 ali BaseTable 成熟的纵向和横向虚拟化；
- 回滚简单，可以继续锁定 2.6.1 行为。

缺点：

- 接管的是 84 个源码文件、约 8,570 行 TS/TSX；BaseTable 目录本身约 2,502 行。
- 按当前 barrel import 抽取 BaseTable 的依赖闭包仍约 33 个文件、3,388 行；即使手工改成精准 import，最小保真闭包仍约 20 个文件、2,696 行，并继续依赖 RxJS、Popper、ResizeObserver polyfill、classnames 和 styled-components。
- Pivot、pipeline、transforms 等绝大部分代码 Rath 永远不会使用。
- 需要自己维护发布、版本、security update、React/TypeScript/build tool compatibility 和浏览器矩阵。
- 当前几乎没有 BaseTable 自动回归测试。
- 后续维护预估约 1–3 人日/季度，仍需持续跟进 React、浏览器和供应链变化。

判断：只适合作为短期保底分支，不适合作为默认长期方向。

### 方案 B：Rath workspace 轻量包

优点：

- 能建立明确 API 和所有权边界；
- Rath、Insider、未来插件宿主可以共享；
- 可以独立测试、构建和版本化。

缺点：

- 当前没有第二个真正独立消费者；Rath 和 Insider 应以 Rath 为基线同步，而不是各自消费不同表格包版本。
- package/build/export/version 管理会增加基础设施开销。
- 如果从 ali BaseTable 裁剪，仍会继承复杂虚拟化实现；如果从 RathDataTable 抽取，又会过早冻结 API。

判断：现在做属于过早抽象。等插件能力或第二个应用真正需要独立消费时，再从稳定后的 RathDataTable 抽取。

### 方案 C：直接使用 Rath component

优点：

- 已有实现和 11 个生产消费者，不需引入新的抽象或依赖。
- 只维护产品实际需要的普通表格、虚拟滚动、列宽、渲染和选择能力。
- React、shadcn token、可访问性和测试与 Rath 同步升级。
- 删除 ali 后可以同时移除其嵌套 styled-components 5、RxJS 6、Popper 和 ResizeObserver polyfill 路径。
- 修改、回滚和调试都集中在 Rath。

缺点：

- 当前 RathDataTable 只有纵向虚拟化；ali 的 `useVirtual=true` 会同时处理纵向和横向虚拟化。
- 如果未来直接复制到其他仓库，会产生重复代码；应通过 Rath baseline 同步或届时抽包解决。
- 最后一个 DataSource 表格具有文本选择、排除按钮和动态 HeaderCell，迁移需要专项回归。

判断：当前最佳方案。

## 推荐实施路线

### Phase 1：行为与性能基线

1. 固定 Cars、Kepler 等 9–44 列数据集，以及 1,000 行上限。
2. 记录首屏渲染、纵向滚动、横向滚动、DOM 节点数和 long task。
3. 固定文本选择、pattern highlight、排除/恢复按钮、空值行背景和 HeaderCell 编辑行为。
4. 迁移期保留 feature flag 或旧组件路径一个发布周期，便于快速回滚。

### Phase 2：迁移到 RathDataTable

1. 将 `ArtColumn` 映射为 `RathColumn<IRow>`。
2. 用 `onRender` 保留当前文本选择和排除逻辑。
3. 使用 `rowClassName` 或增加窄范围 `getRowStyle` 支持空值行背景。
4. 设置 `maxHeight=600`、`estimatedRowHeight=38` 和合适的 virtualization threshold。
5. 将 `Classes.tableHeaderCell` 样式收敛为 RathDataTable 的 className/headerClassName。
6. 删除 `CustomBaseTable`、ali import、package dependency 和 lockfile 条目。

预估改动约 100–250 行，不需要复制 ali BaseTable 源码。

### Phase 3：横向虚拟化 Go/No-Go

先在 1,000 行 × 44 列真实数据上验证现有“纵向虚拟化 + 全列渲染”。正常 viewport 下实际同时挂载的 row 数较少，约数百个 cell，可能已经足够。

只有性能门禁失败时，再给 RathDataTable 增加 TanStack horizontal virtualizer。不要为了理论上的超大列数预先移植 ali 的 RxJS/Popper 虚拟滚动系统。

### Phase 4：决定是否抽 workspace package

满足以下条件后再抽包：

- 至少两个独立应用或插件需要直接消费；
- API 在 Rath 中经过一段时间稳定；
- 包不依赖 Rath store、业务 i18n 或页面 CSS；
- 有独立 browser/performance test 和版本发布责任人。

## 验收门禁

- React 19 typecheck、unit、production build 和 browser smoke 全部通过。
- 1,000 行 × 最大真实列数滚动无明显卡顿，sticky header 和水平滚动正确。
- React StrictMode 重复挂载无订阅、observer 或事件监听泄漏。
- 文本选择的 Range offset 不改变。
- pattern highlight、exclude/restore、动态表头、空值行颜色保持一致。
- 虚拟化滚动后行内容和 row key 不错位。
- console/page error 为零。
- Chrome 和 Safari 至少各完成一次真实滚动回归；建议单次长任务低于 200 ms，可见 DOM 随 viewport 而不是总行数增长。
- `ali-react-table`、其嵌套 styled-components 5 及不再使用的依赖从生产依赖图移除。

## 最终决策

| 方案 | 初始工作量 | 长期维护成本 | 风险可控度 | 推荐度 |
| --- | ---: | --- | --- | --- |
| 完整 fork | 中高 | 高 | 中 | 低，仅保底 |
| workspace 轻量包 | 中 | 中 | 高 | 中，未来再做 |
| 现有 RathDataTable 扩展 + 直接迁移 | 低 | 低 | 高 | **最高** |

建议把 fork 留作迁移期回滚参考，不发布、不长期维护；主线直接完成最后一个 ali-react-table 调用点的替换。这样既符合 Rath 作为双仓权威基线的方向，也避免在 React 19 升级后继续背负一个已归档大型表格库。
