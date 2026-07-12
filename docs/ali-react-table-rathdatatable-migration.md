# DataSource: ali-react-table → RathDataTable

日期：2026-07-12
状态：完成

## 结果

Rath 中最后一个 ali-react-table 生产实例已经替换为 `RathDataTable`。源码、`package.json` 和 `yarn.lock` 中的 ali-react-table 引用为零，CI migration gate 会阻止重新引入。

DataSource 保留的业务行为：

- HeaderCell 图表、统计、字段类型、transform 和字段启用控制；
- 220px 固定列宽、600px 滚动容器、38px 行高；
- sticky header、纵向与横向虚拟化；
- 最多 1,000 行的预览数据；
- 单元格文本 Range 选择、pattern 建议、exclude/restore；
- 空值行 `#fff2e8` 背景；
- 横向滚动时的完整逻辑宽度和正确列内容。

## 从 BaseTable 吸收的设计

没有复制 ali 的 RxJS/Popper/ResizeObserver/styled-components 实现，只吸收了三个与 DataSource 直接相关的策略：

1. 只有所有列都具有可预测像素宽度时才启用横向虚拟化。
2. 通过左右 blank cells 保留完整表格滚动宽度。
3. 可视列两侧保留 overscan，避免小幅滚动频繁切换 DOM。

滚动订阅、可视区计算和清理由现有 `@tanstack/react-virtual` 负责。未迁移 Rath 不使用的锁列、rowSpan/colSpan、footer、sticky scrollbar、pipeline、pivot 和 transforms。

## RathDataTable API 增量

- `horizontalVirtualized?: boolean`：显式开启横向虚拟化；只有列宽完整时生效。
- `rowStyle?: (item, index) => CSSProperties`：支持 DataSource 的空值行业务样式，同时保持通用组件不依赖 store。

选择列与横向虚拟化同时出现时暂时回退为全列渲染，避免 selection 固定列偏移语义发生变化；当前 DataSource 不使用 selection。

## 自动化与真实数据验证

- TypeScript 5.9.3 / React 19：通过。
- Jest：6 suites / 49 tests 通过。
- Vite 全仓生产构建：通过，5,811 modules。
- Playwright：7/7 通过。
- Cars（406 行 × 9 列）：
  - 可见 DOM 约 25 rows；
  - 行高 38px；
  - 水平滚动内容更新；
  - 空值与普通行颜色并存；
  - 文本选区、Suggestions、exclude/restore 通过。
- Kepler（9,218 行 × 44 列，预览截取 1,000 行）：
  - 逻辑宽度 9,680px；
  - 每行只保留约 9 个结构 cells，而不是 44 个；
  - 横向滚动到末端后 header/cell 内容正确；
  - console/page error 为零。
- Worker 产物仍为 14。

## 产物变化

React 19 候选基线与本次迁移后的对比：

| 指标 | 迁移前 | 迁移后 | 变化 |
| --- | ---: | ---: | ---: |
| Vite modules | 6,027 | 5,811 | -216 |
| DataSource chunk | 约 212.47 kB | 约 101.08 kB | 约 -111.39 kB |
| DataSource gzip | 约 62.03 kB | 约 26.69 kB | 约 -35.34 kB |
| 全部产物 | 31,272,997 B | 31,162,446 B | -110,551 B |
| compressible gzip | 6,472,439 B | 6,437,666 B | -34,773 B |

## 后续边界

当前不抽 workspace package。等至少两个独立应用或插件消费者需要同一 API、且 RathDataTable 接口稳定后，再从 Rath core 抽取。Insider 应同步 Rath 的实现，而不是维护自己的 ali fork。
