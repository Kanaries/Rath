# Rath UI 迁移执行文档（Fluent UI → shadcn/Tailwind，含 Insider 回流前置）

> **本文档取代 `docs/shadcn-migration-plan.md`**。旧文档的组件对照思路仍然有效，但所有排期、技术决策、范围边界以本文档为准。两者冲突时，以本文档为准。
>
> 本文档面向执行 agent。所有架构决策已经做完并写死在文中，执行时**不要重新评估这些决策**；遇到文档没覆盖的情况，按「全局纪律」一节的兜底规则处理并记录，不要自行扩大范围。

---

## 0. 仓库事实（执行前先核对）

| 项 | 值 |
|---|---|
| 仓库 | `/Users/claw/Documents/rath-workspace/Rath`（GitHub: Kanaries/Rath） |
| 主分支 | `master`（不是 main） |
| 姊妹仓库 | `/Users/claw/Documents/rath-workspace/RATH-insider`（内部版，主分支 `main`，冻结于 2024-07-31；另有 WIP 分支 `codex/port-rath-feature-parity`） |
| 包管理 | Yarn 1 (classic) workspaces，唯一 lockfile 是根 `yarn.lock` |
| 迁移目标包 | `packages/rath-client`（其余 workspace 包不依赖 Fluent v8，不在范围内） |
| 构建系统 | CRA (react-scripts 5.0.1) + react-app-rewired，定制在 `packages/rath-client/config-overrides.js`（Monaco 插件 + worker-loader + Buffer polyfill）。**未 eject，禁止 eject，禁止换 Vite** |
| React / TS | React 17.0.2（Stage 2 升到 18）、TypeScript 4.8、`ReactDOM.render` |
| CI | `.github/workflows/auto-build.yml`，Node 16，只跑 `yarn workspace rath-client build` |
| 状态管理 | MobX，store 注册在 `src/store/index.tsx` |
| i18n | react-intl-universal，577 处 `intl.get`，语言包在 `public/locales/` |
| 样式现状 | Fluent v8（127 个 tsx）+ Fluent v9（10 个文件）+ styled-components（约 140 个文件）+ `office-ui-fabric-core` 全局 CSS + 3 个全局 css（index/App/normalize） |
| 图标现状 | MDL2 字体图标（90 个不同名字，约 400 处调用），**lucide-react ^0.513.0 已是依赖**，已在 6 个文件使用 |

常用命令：

```bash
yarn install                          # 仓库根目录
yarn workspace rath-client start      # 开发服务器
yarn workspace rath-client build      # 生产构建（= CI 的构建门）
```

### 阶段总览与顺序（不可颠倒）

| Stage | 内容 | 分支名建议 |
|---|---|---|
| 0 | Insider 回流收尾 + 反向同步对账 | `chore/insider-backflow-final` |
| 1 | 去账号化瘦身 | `refactor/remove-account-system` |
| 2 | React 17 → 18 升级 | `chore/react-18` |
| 3 | Tailwind v3 + token 层 + shadcn 基座 + 门禁脚本 | `feat/ui-mig-foundation` |
| 4 | RathIcon + 图标映射表（含人工审核停点） | `feat/ui-mig-icons` |
| 5 | 叶子控件机械替换（按目录分批） | `feat/ui-mig-leaf-<dir>` |
| 6 | Overlay 类（Tooltip/Callout/Modal/Dialog/Panel） | `feat/ui-mig-overlays` |
| 7 | 复杂组件（Dropdown/DetailsList/Pivot/Nav/CommandBar/v9） | `feat/ui-mig-complex` |
| 8 | 清退 Fluent + 门禁转强制 + 全量回归 | `feat/ui-mig-teardown` |

每个 Stage 独立分支、独立 PR 合入 `master`，合并前构建必须通过。Stage 0–2 是 UI 迁移的**硬前置**：它们改动的文件会被后续迁移大面积重写，顺序颠倒会制造无法自动合并的冲突。

---

## Stage 0：Insider 回流收尾与反向同步对账

背景：两仓库同源（merge-base `19feec48`），Insider(main) 独有 82 个非 merge 提交，Rath(master) 独有 23 个。全部提交已逐一盘点过，结论写死如下，**不需要重新遍历 Insider 历史**。

### 0.1 已完成项（不要重复做）

- Painter 优化回流：已通过 Rath PR #439（`feat-port-insider-painter` 分支）合入 master，含 3 个 cherry-pick（`e8f520d6` / `a9f0668b` / `1e0e8eda`）和修复提交 `68763882`。
- 另有 6 个 Insider 提交早已同步（GW 版本、AirTable 标签、zeroscale、export metas 等），`git cherry` 已确认 patch-id 等价。

### 0.2 回流：ja/ko 语言包（本 Stage 唯一的代码改动）

从 Insider cherry-pick 两个提交到 Rath master：

```bash
cd /Users/claw/Documents/rath-workspace/Rath
git fetch /Users/claw/Documents/rath-workspace/RATH-insider main
git checkout -b chore/insider-backflow-final master
git cherry-pick -x 3a340471   # feat(i18n): support ja & ko —— +ja-JP.json +ko-KR.json + src/locales.ts 注册
git cherry-pick -x 706eca5b   # fix #13 (filter): missing i18n —— 四语言各补 1 个 key
```

预期冲突面很小（`src/locales.ts` 和 locale JSON）。完成后必须验证：

- [ ] `src/locales.ts` 的 `SUPPORT_LANG` 含 4 种语言。
- [ ] 检查 `src/rath-error.ts` 的 `loadRathErrorLocales(lang)`（由 `src/store/langStore.ts` 调用）：如果它对 ja-JP/ko-KR 没有对应文件且无 fallback，补一个回落到 en-US 的 fallback，不要让切换语言时报错。
- [ ] `yarn workspace rath-client start`，通过侧栏语言菜单（`src/components/userSettings.tsx`）切到日语/韩语，页面文案生效、控制台无 fetch 404。

### 0.3 明确不回流的项（决策已做死，禁止移植）

- **`4018e830` "feat: llm poc"（含 statDesc 的 `useInsightExpl` 导出）**：该重构与 enhanceai NLQ/NLG poc 代码纠缠在同一提交，无法干净拆出。不回流。开源版现有对应实现是 `src/services/insights.ts` 的 `getInsightExpl`，保持现状。
- **`b5a8b1a2` React 18 升级**：与 GW 0.4.61 升级强耦合，且散落十几个 Fluent 时代的 tsx。不 cherry-pick，Stage 2 在开源版重做（把它当参照，见 Stage 2）。
- 其余全部 Insider 独有提交：NLQ/LLM/notebook/vizDesc（enhanceai 后端）、Electron preload 与鉴权、账号/workspace/org、data-infra 云备份、gateway 部署路径、Microsoft Clarity 埋点、GW 0.4.61 强耦合的 `vl2gw.ts`——全部与 SaaS 耦合或与开源版方向不符，**一律不回流**。

### 0.4 反向同步 Insider（在 RATH-insider 仓库操作，与 Rath 主线解耦）

RATH-insider 已有 WIP 分支 `codex/port-rath-feature-parity`，先行 pick 了 5 个 Rath 提交：text pattern ×2（`e33b34b6`/`978e75c6`）、lazy load（`081a5a80`）、painter limits 修复（`03f6126e`，即 Rath 的 `68763882`）、本地 Causal（`f06dcd18`）。

本步骤的工作是**对账补漏**，不是重做：

- [ ] 在该分支上确认上述 5 个 pick 完整存在。
- [ ] 补 pick Rath 的 `e797f047`（fix hashing bin size overflow，`utils/sample.ts` 4 行，干净无依赖）——盘点确认它尚未进该分支。
- [ ] 确认 `03f6126e` 内容与 Rath `68763882` 一致（painter 移植必须带这个修复，否则混合连续×分类图表 mousemove 崩溃）。
- [ ] 不要把 Rath 的 `5029ae04`/`0fba9ba4`（自托管 icon 字体，开源部署特有）、`f3c8cc47`（lucide 图标改造）同步过去。
- [ ] 完成后停下，把分支状态汇报给用户决定是否合入 Insider main（Insider 是冻结仓库，合并决策属于用户）。

此步骤不阻塞 Stage 1 之后的任何工作，可并行；但必须在 Stage 5 大规模重写 tsx 之前完成对账，否则将来对照 Rath 历史会更困难。

---

## Stage 1：去账号化瘦身

目的：账号体系在开源版已基本是死代码（唯一登录入口 `userStore.getPersonalInfo()` 无任何调用点，登录 UI 已被注释）。先删再迁，可少迁约 4 个文件 / 16+ 处 Fluent 组件，并去掉数据静默上传行为。

### 1.1 直接删除的文件（先 grep 确认无引用再删）

| 文件 | 状态 |
|---|---|
| `src/pages/loginInfo/account.tsx` | 死代码（仅被 `index.tsx:127` 注释引用） |
| `src/pages/loginInfo/workspaceRole.tsx` | 死代码（仅被 account.tsx 引用） |
| `src/pages/loginInfo/loginInfo.tsx` | 孤儿文件，无 import |
| `src/pages/loginInfo/components/loginButton.tsx` | 孤儿文件，无 import |
| `src/pages/loginInfo/access/valueCheck.ts` | 孤儿文件，无 import |
| `src/store/userStore.ts` | 整体删除 |

**保留** `src/pages/loginInfo/index.tsx`（去掉被注释的 Account tab 残留 import/代码）、`setup.tsx`、`design/*`——这是活跃的偏好设置面板，Stage 5/7 正常迁移。

### 1.2 需要小改的文件

| 文件 | 改动 |
|---|---|
| `src/store/index.tsx` | 去掉 userStore 的 4 处注册/引用 |
| `src/pages/dataSource/baseActions/mainActionButton.tsx:90,94` | 埋点里去掉 `userName: userStore.userName` 字段，`va.track` 调用本身保留 |
| `src/pages/dataSource/selection/restful.tsx:56,74` | 删除 userStore 解构与依赖数组项（函数体内并未真正使用） |
| `src/pages/dataConnection/restful.tsx:72,92` | 同上 |
| `src/loggers/dataImport.ts` | 删除 `dataBackup`（POST `kanaries.{cn,net}/api/ce/uploadDataset` 的云上传）和 `logDataImport`（阿里云 FC 埋点）两个函数 |
| `src/pages/dataSource/selection/file/index.tsx:8,222` | 去掉 `dataBackup(...)` 调用与 import |
| `src/pages/dataConnection/file/index.tsx:23,236` | 同上 |
| `src/utils/user.ts` | 先 `rg getMainServiceAddress` 确认除 userStore 外无调用者，然后删除 `getMainServiceAddress` 与默认头像常量；若整个文件被掏空则删文件 |

### 1.3 明确保留（不要顺手删）

- `src/store/dataSourceStore.ts` / `collectionStore.ts` 里的本地 backup（`backupMetaStore`/`backupDataStore`/`backupCollectionStore` 等）——这是本地导出快照，与云无关。
- 计算服务地址：`src/services/base.ts` 的 `gateway.kanaries.net`、`src/store/causalStore/operatorStore.ts` 的 `causal.gateway.kanaries.net`、`dataConnection/database/main.tsx` 的 connector 地址——这些是可自定义覆盖的计算后端，是产品功能，保留。
- `src/components/appNav.tsx` 里的 `docs.kanaries.net` 外链。

### 1.4 验收

- [ ] `rg "userStore" packages/rath-client/src` 为 0。
- [ ] `rg "/api/ce/" packages/rath-client/src` 为 0。
- [ ] `rg "uploadDataset|fc.aliyuncs" packages/rath-client/src` 为 0。
- [ ] 构建通过；本地跑起来，导入一个 CSV 走完 profiling → 分析，无控制台报错；偏好设置面板（侧栏齿轮）正常打开。

---

## Stage 2：React 17 → 18 升级（重做，不 cherry-pick）

决策：Insider 的 `b5a8b1a2` 与 GW 升级耦合、且触及大量将被重写的 Fluent tsx，**不 cherry-pick**。在开源版重做一次最小升级，`git -C ../RATH-insider show b5a8b1a2` 只作为参照（createRoot 写法、`@types` bump 位置、哪些组件需要类型兼容修复——它当时改过 appNav / dropDownSelect / stepper / use-error-boundary / visErrorBoundary / progressiveDashboard 等约 15 个文件，本仓库大概率遇到同样的报错点）。

### 2.1 范围（最小化，以下之外一律不动）

1. `packages/rath-client/package.json`：`react`、`react-dom` → `^18.2.0`；根 `package.json` 的 `resolutions` 里 `@types/react`、`@types/react-dom` → `^18`。
2. `src/index.tsx`：`ReactDOM.render(...)` → `createRoot(container).render(...)`。**不要**加 `<StrictMode>`（超范围）。
3. `src/components/error/index.tsx:14`：第二处 `ReactDOM.render` 同样改 createRoot。
4. TS 报错修复：React 18 的 `FC` 不再隐含 `children`，逐个给报错组件的 Props 显式加 `children?: ReactNode`。只做类型层面修复，不改逻辑。
5. `@fluentui/react-hooks` 收敛：10 个文件的 `useId` → React 18 原生 `useId`；`src/pages/collection/index.tsx` 的 2 处 `useBoolean` → 本地 `useState` 写法。然后从 package.json 删掉 `@fluentui/react-hooks`。

### 2.2 明确不做

- **不升级 graphic-walker**（保持 ^0.4.50；其 peer 是 `>=17 <19`，兼容 React 18）。
- 不动 `config-overrides.js`、不动 MobX 版本、不启用任何并发特性。

### 2.3 验收

- [ ] 构建 + 启动通过，无 `ReactDOM.render is no longer supported` 警告。
- [ ] 手工过一遍主要页面：dataSource 导入与 profiling、megaAutomation、semiAutomation、causal、painter、dashboard、collection。重点看 painter 的画布交互（mousemove 涂抹）和 GW 嵌入页是否正常。
- [ ] `rg "@fluentui/react-hooks" packages/rath-client` 为 0。

---

## Stage 3：Tailwind v3 + token 层 + shadcn 基座

### 3.1 版本锁定（硬性约束，违反即返工）

- `tailwindcss@^3.4`、`autoprefixer`、`postcss`。**禁止 Tailwind v4、禁止 `@tailwindcss/postcss`**——CRA 5 只原生支持 v3 的接入方式。
- **禁止运行 `npx shadcn init` / `npx shadcn add`**。新版 CLI 产出 Tailwind v4 + React 19 风格代码，与本仓库（CRA5 / TS4.8 / Tailwind3）不兼容。所有 shadcn 组件**手工 vendor**：取 shadcn/ui 的 Tailwind-v3 风格源码（default style），改 import 路径后放入 `src/components/ui/`。
- 新增依赖白名单（除此之外不加）：`clsx`、`tailwind-merge`、`class-variance-authority`、`tailwindcss-animate`、所需的 `@radix-ui/react-*`（select / checkbox / switch / radio-group / slider / progress / separator / tooltip / popover / dialog / alert-dialog / tabs / dropdown-menu / hover-card / label / slot）。Radix 各包选择兼容 React 18 的当前稳定版即可。

### 3.2 接入方式

1. `packages/rath-client/tailwind.config.js`：

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{ts,tsx}', './public/index.html'],
    theme: {
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
                secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
                destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
                muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
                accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
                card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
                popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
            },
            borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
```

CRA 5 会自动检测 `tailwind.config.js` 并接入 postcss-loader，无需改 `config-overrides.js`。

2. Token 层放 `src/styles/tokens.css`，在 `src/index.tsx` 里（fabric.css import 之后）引入。取值从 `src/theme.ts` 的 `mainTheme` 映射：主色是近黑 `#0f0f0f`，整体是中性灰系。定义 `:root` 全套 shadcn 变量（background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring/radius），并同时写一个 `.dark { ... }` 块（**只定义变量，不接任何切换逻辑**——暗色模式本次范围外，`theme.ts` 里的 `RATH_DARK_THEME` 从未被消费，最终会随 Fluent 一起删除）。
3. `src/index.css` 顶部加 `@tailwind base; @tailwind components; @tailwind utilities;`。
4. `src/utils/cn.ts`：`clsx` + `tailwind-merge` 的标准 `cn()`。tsconfig `compilerOptions` 加 `"baseUrl": "src"`，ui 组件间用 `utils/cn` 引用。

### 3.3 Preflight 决策（已定，不要改）

**Preflight 从本 Stage 起就开启**（不禁用 `corePlugins.preflight`）。理由：迁移终态必然带 preflight，早开意味着 Stage 5–7 迁的每个组件都在最终 CSS 环境下验证；晚开等于最后全量重新回归。代价是共存期 preflight 的全局 reset 可能轻微影响存量 Fluent/裸 HTML 样式。处理方式：

- 开启后立刻对主要页面做一轮目检（dataSource、causal、dashboard、painter、collection、设置面板）。
- 发现被 reset 影响的样式（常见：`h1-h6`/`ul` 边距、`img` 变 block、button 背景），把补偿规则集中写进 `src/styles/preflight-compat.css` 并逐条注释原因。**禁止**散落在业务文件里修。该文件在 Stage 8 复查删除。

### 3.4 初始 vendor 的 ui 组件清单

`button, input, textarea, label, select, checkbox, switch, radio-group, slider, progress, skeleton, separator, tooltip, popover, dialog, alert-dialog, sheet, tabs, dropdown-menu, table, alert, breadcrumb, card, hover-card, badge` + 一个本地 `spinner.tsx`（shadcn 无官方 spinner，写一个 lucide `Loader2` + `animate-spin` 的薄组件）。

**密度定制（一次性做在 ui 层，不要在调用点逐个调）**：Fluent v8 控件标准高度 32px，shadcn 默认 40px 偏胖。vendor 时把 `button`（default size）、`input`、`select` trigger 的默认高度改为 `h-8`（32px）、字号 `text-sm`，保留 `sm`/`lg`/`icon` 变体。这个仓库是数据密集型应用，密度必须对齐现状。

### 3.5 门禁脚本（报告模式）

新建 `scripts/ui-migration-gates.sh`（Rath 仓库根）：

```bash
#!/usr/bin/env bash
# UI migration gates — Stage 8 之前为报告模式（输出计数），Stage 8 转强制（非零即失败）
SRC=packages/rath-client/src
echo "== fluent v8 imports ==";  rg -l "from '@fluentui/react'" $SRC | wc -l
echo "== fluent v9 imports ==";  rg -l "from '@fluentui/react-components'" $SRC | wc -l
echo "== iconName usages ==";    rg -c "iconName" $SRC | awk -F: '{s+=$2} END {print s}'
echo "== iconProps usages ==";   rg -c "iconProps" $SRC | awk -F: '{s+=$2} END {print s}'
echo "== Stack usages ==";       rg -c "<Stack" $SRC | awk -F: '{s+=$2} END {print s}'
echo "== ms-* classes ==";       rg -c "\bms-[A-Z]" $SRC | awk -F: '{s+=$2} END {print s}'
echo "== fabric css import =="; rg -c "office-ui-fabric-core" $SRC packages/rath-client/package.json | awk -F: '{s+=$2} END {print s}'
echo "== initializeIcons ==";    rg -c "initializeIcons" $SRC | awk -F: '{s+=$2} END {print s}'
```

每个 Stage/批次结束跑一次，把数字记录到 PR 描述里——这是进度的唯一客观度量。

同时可以运行统一报告：

```bash
scripts/ui-migration-report.mjs
```

该脚本会串起 icon、leaf、complex、teardown 和 `ui-migration-gates.sh` 的摘要输出，适合作为每个迁移 PR 的总览计数。需要具体文件与行号时，再运行各 Stage 对应的专项审计脚本（例如 `scripts/audit-icon-calls.mjs`、`scripts/audit-fluent-leaf-components.mjs --full`、`scripts/audit-fluent-complex-components.mjs --full`、`scripts/audit-fluent-teardown.mjs --full`）。

### 3.6 验收

- [ ] 构建通过；记录本 Stage 构建产物体积（`build/static/js` 各 chunk 大小），作为 Stage 8 对比基线。
- [ ] 写一个临时测试页或在任意页面临时渲染一个 `<Button>`（确认 Tailwind 类生效后移除）。
- [ ] Preflight 目检完成，补偿规则已集中。

---

## Stage 4：RathIcon 与图标映射表

现状：90 个不同 MDL2 图标名、约 227 处 `iconName` + 177 处 `iconProps`；`lucide-react ^0.513.0` 已在依赖里且被 6 个文件使用（dataSource/dataConnection 的 v9 化界面）——**基于它做，不新增图标库**。

### 4.1 结构

```
src/components/icons/
  legacy-map.ts     # MDL2 名 → lucide 组件的显式映射表（唯一事实源）
  rath-icon.tsx     # <RathIcon name="Delete" size={16} className="..." />
  custom/           # 无 lucide 等价物时的本地 SVG 组件（尽量少）
```

- `legacy-map.ts` 用 `Record<LegacyIconName, LucideIcon>` 严格类型；`LegacyIconName` 是 90 个名字的字符串字面量联合类型。
- 未映射名字：开发模式 `console.warn` + 渲染 `CircleHelp` 兜底；映射表齐全后把兜底分支改为 TS 编译期报错（联合类型收严即可）。
- 注意名字清单里混有小写非标准名（`filter`/`edit`/`globe`/`download`/`upload`/`delete` 等），全部收进映射表，大小写原样保留。

### 4.2 流程（含人工停点）

1. 生成清单：`rg -o "iconName[:=]\s*['\"]([A-Za-z0-9]+)['\"]" -r '$1' packages/rath-client/src | sort -u`，与 `iconProps={{ iconName: ... }}` 形式合并去重。
2. 写出完整映射表初稿（90 行，每行注释语义，例如 `BarChartVerticalEdit → BarChart3 // 图表编辑`）。
3. **停点：把映射表完整贴进 PR 描述，请用户人工审一遍再继续。** 这是整个迁移唯一需要用户逐行确认的产物——图标语义错了用户最容易发现、agent 最难发现。
4. 审核通过后，在本 Stage 内只替换两类调用点：
   - 独立的 `<Icon iconName="..." />`（约 44 处 JSX）→ `<RathIcon name="..." />`；
   - `src/components/userSettings.tsx:51` 的裸 `<i className="ms-Icon ms-Icon--...">` → `<RathIcon>`。
   - `iconProps` 形式（内嵌在 Button 里的 177 处）**不在本 Stage 改**，它们随 Stage 5 的按钮迁移一起换。
5. `src/pages/dataConnection/database/main.tsx` 的 `registerIcons`：查看它注册的 SVG（应为数据库品牌 logo），把这些 SVG 抽成 `icons/custom/` 下的 React 组件，调用点改用组件，删掉 `registerIcons`。

### 4.3 验收

- [ ] `scripts/verify-icon-map.mjs` 通过，确认 `legacyIconNames` 与 `legacyIconMap` 无缺失/重复。
- [ ] `scripts/audit-icon-calls.mjs` 通过，确认 literal `iconName` 全部被映射；动态表达式输出需人工扫一遍（其中可能包含非图标字符串）。
- [ ] `rg "<Icon " packages/rath-client/src` 为 0；`registerIcons` 为 0。
- [ ] 构建通过，浏览器目检替换过的图标位置。

---

## Stage 5：叶子控件机械替换（按目录分批）

**范围内组件**（本 Stage 全部替完）：`PrimaryButton / DefaultButton / ActionButton / CommandButton / IconButton`（合计约 195 处 JSX）、`TextField`(49)、`Toggle`(26)、`Checkbox`(9)、`ChoiceGroup`(17)、`Slider`(10)、`SpinButton`(15)、`Spinner`(23)、`ProgressIndicator`(8)、`Label`(32)、`Separator`(2)、`Shimmer`(1)、`MessageBar`(11)、`SearchBox`(5)、`Text`、`Stack`(128) + `Stack.Item`(42)。

**范围外（本 Stage 见到也不要动）**：`Dropdown`、`DetailsList`、`Modal/Dialog/Panel/Callout/TooltipHost`、`ContextualMenu/CommandBar`、`Nav`、`Pivot`、所有 v9 组件。一个文件迁完按钮后仍残留 Fluent Dropdown 是**预期状态**，不要顺手迁。带 `menuProps` 的按钮（6 处）整体留到 Stage 7。

### 5.1 批次顺序（每批一个 PR 或至少一个独立 commit，构建绿灯后进下一批）

`src/components` → `pages/dataSource` → `pages/dataConnection` → `pages/megaAutomation` → `pages/semiAutomation` → `pages/causal` → `pages/dashboard` → `pages/painter` → `pages/collection` + `pages/loginInfo`（剩余的 setup/design）→ 其余零散文件。

迁移前后都运行：

```bash
scripts/audit-fluent-leaf-components.mjs
```

该脚本按上述批次输出 Stage 5 leaf 组件剩余 JSX 数、`menuProps` 延后项、以及 Stage 6/7 的 deferred 复杂组件数量。默认输出摘要；需要具体文件清单时运行：

```bash
scripts/audit-fluent-leaf-components.mjs --full
```

### 5.2 转换规则表（机械执行，禁止发挥）

**按钮**：

| Fluent | shadcn |
|---|---|
| `<PrimaryButton text="X" onClick={f} />` | `<Button onClick={f}>X</Button>` |
| `<DefaultButton>` | `<Button variant="outline">` |
| `<ActionButton>` | `<Button variant="ghost">`（纯链接语义用 `variant="link"`） |
| `<CommandButton>` | `<Button variant="ghost">` |
| `<IconButton iconProps={{iconName:'X'}} title={t} />` | `<Button variant="ghost" size="icon" title={t}><RathIcon name="X" /></Button>` |
| `text` prop | children |
| `iconProps={{iconName:'X'}}`（带文字按钮） | children 前置 `<RathIcon name="X" className="mr-1" />` |
| `styles={...}` | 改写为 className；无法直译的视觉细节按最接近的 token 类处理 |

**输入类**：

| Fluent | shadcn |
|---|---|
| `<TextField label={l} value={v} onChange={(e, val) => ...} />` | `<Label htmlFor={id}>{l}</Label><Input id={id} value={v} onChange={e => ...(e.target.value)} />` |
| `TextField multiline` | `Textarea` |
| `errorMessage={msg}` | Input 下方 `{msg && <p className="text-sm text-destructive">{msg}</p>}`，并给 Input 加 `aria-invalid` |
| `<SpinButton min max step>` | `<Input type="number" min max step>`（onChange 记得 parse） |
| `<SearchBox>` | 相对容器内 `<RathIcon name="Search" className="absolute left-2 ..." /><Input className="pl-8" />`；出现 ≥3 次后抽成 `src/components/rath-ui/search-input.tsx` |
| `<Toggle checked onChange={(e, checked) => ...} label={l} />` | `<Switch checked onCheckedChange={...} />` + Label |
| `<Checkbox onChange={(e, checked)}>` | `<Checkbox checked onCheckedChange>` |
| `<ChoiceGroup options selectedKey onChange>` | `<RadioGroup value onValueChange>` + `options.map(o => <RadioGroupItem value={o.key}>)` |
| `<Slider min max value onChange>` | `<Slider min max value={[v]} onValueChange={([v]) => ...} />`（注意 shadcn Slider 是数组值） |
| `<Spinner size={SpinnerSize.large} label={l} />` | 本地 `<Spinner>` + 相邻文本 |
| `<ProgressIndicator percentComplete={p} />` | `<Progress value={p * 100} />`（**注意 0–1 → 0–100**） |
| `<Shimmer>` | `<Skeleton>` |
| `<MessageBar messageBarType={MessageBarType.error}>` | `<Alert variant="destructive">`；info/success/warning 映射到 Alert 变体（vendor 的 alert.tsx 需补 success/warning 变体） |
| `<Label>` | shadcn `<Label>`（非表单场景可直接语义化 span/div + 类） |

**Stack → flex（最大单项：128 + 42 处，分布 58 个文件）**：

| Fluent | Tailwind |
|---|---|
| `<Stack>` | `<div className="flex flex-col">` |
| `<Stack horizontal>` | `<div className="flex flex-row">` |
| `tokens={{ childrenGap: N }}` | `gap-[Npx]`（一律用 arbitrary value，不做就近取整；`childrenGap: '10 20'` 双值 → `gap-y-[10px] gap-x-[20px]`） |
| `wrap` | `flex-wrap` |
| `grow` | `grow` |
| `<Stack.Item grow>` / `shrink` / `align="center"` | `<div className="grow">` / `shrink` / `self-center` |

对齐属性注意主轴/交叉轴随方向翻转：

| 方向 | Fluent prop | Tailwind |
|---|---|---|
| horizontal | `horizontalAlign="start/center/end/space-between"` | `justify-start/center/end/between` |
| horizontal | `verticalAlign="start/center/end/baseline"` | `items-start/center/end/baseline` |
| vertical（默认） | `verticalAlign=...` | `justify-*` |
| vertical（默认） | `horizontalAlign=...` | `items-*` |

### 5.3 随迁必改的样式 hack 点（对应组件迁到时同步重写，否则静默失效）

| 位置 | hack |
|---|---|
| `src/pages/dataConnection/database/components/nested-list.tsx:24` | styled-components 里 `.ms-Shimmer-shimmerWrapper` —— 迁 Shimmer→Skeleton 时重写 |
| `src/pages/dataConnection/database/form/connect-options.tsx:26,37,40` | `.ms-TextField-fieldGroup` / `.ms-TextField-wrapper` —— 迁 TextField 时重写 |
| `src/pages/dataSource/metaView/metaList.tsx:347` | `className="ind-title ms-Label root-130"`（`root-130` 是 Fluent 运行时生成类，硬编码即坏）—— 改为语义类 + Tailwind |
| `src/pages/causal/exploration/autoVis/index.tsx:27,33` | `.ms-DetailsList` / `.ms-DetailsList-headerWrapper` —— **留到 Stage 7** 随 DetailsList 迁移一起改，本 Stage 不动 |

### 5.4 每批验收

- [ ] `yarn workspace rath-client build` 通过。
- [ ] `scripts/audit-fluent-leaf-components.mjs` 输出该批次目录的 Stage 5 JSX 数下降；若有 `menuProps` 按钮留到 Stage 7，在 PR 描述记录具体位置。
- [ ] dev server 打开该批次涉及的页面，人工过交互（点按钮、输入、切 toggle），控制台无错。
- [ ] `rg "PrimaryButton|DefaultButton|ActionButton|IconButton|CommandButton|<TextField|<Toggle|<ChoiceGroup|<Stack" <该批目录>` 为 0（menuProps 按钮除外，逐个记录在 PR 描述）。
- [ ] intl 抽查：批次 diff 里不允许出现硬编码中英文文案替代 `intl.get`。

---

## Stage 6：Overlay 类

范围：`TooltipHost`(9)、`Callout`(4)、`Modal`(7)、`Dialog`+`DialogFooter`(2)、`Panel`(8)、`Layer`(1)。

迁移前后都运行：

```bash
scripts/audit-fluent-complex-components.mjs
```

该脚本输出 Stage 6 overlay、Stage 7 complex、v9 清退项的活代码 JSX 计数，并列出 Callout 锚点、Dropdown 自定义渲染、DetailsList selection、Pivot headersOnly、menuProps、v9 makeStyles 等风险信号。默认输出摘要；需要具体文件与行号时运行 `scripts/audit-fluent-complex-components.mjs --full`。脚本会屏蔽注释，因此计数可能低于附录里的历史 `rg` 文本基数；以脚本输出作为迁移 PR 的活代码基线。

### 6.1 常规映射

| Fluent | shadcn | 注意 |
|---|---|---|
| `<TooltipHost content={c}><X/></TooltipHost>` | `<Tooltip><TooltipTrigger asChild><X/></TooltipTrigger><TooltipContent>{c}</TooltipContent></Tooltip>` | 需要在 `index.tsx` 挂一个全局 `<TooltipProvider>` |
| 简单 `<Callout>` | `<Popover>` | `DirectionalHint` → `side`/`align` |
| `<Modal isOpen onDismiss>` | `<Dialog open onOpenChange>` | `isBlocking` → 不给 onOpenChange 传 false 即可 |
| `<Dialog>` + `<DialogFooter>` | shadcn `Dialog` + `DialogFooter` slot | 破坏性确认（删除数据集等）用 `AlertDialog` |
| `<Panel isOpen onDismiss headerText type={PanelType.medium}>` | `<Sheet open onOpenChange><SheetContent side="right" className="w-[480px] sm:max-w-none">` | `PanelType` 尺寸映射：smallFixedFar→`w-[340px]`、medium→`w-[592px]`、large→`w-[644px]`（按现有调用点实测视觉调整）；有 footer 的排 flex 布局 |
| `<Layer>` | 查看该 1 处用途后就地处理（大概率直接删掉或改 portal） |

`isOpen/onDismiss → open/onOpenChange` 直接改调用点，不做适配层（调用点少）。

### 6.2 七处锚定定位（必须逐个重构，Radix 不支持 CSS 选择器 target）

| 位置 | 现状 |
|---|---|
| `src/components/fieldExtend/suggestions.tsx:67` | `<Callout target={'#'+btnId}>` |
| `src/components/fieldFilter/index.tsx:128` | `target={'#'+buttonId}` |
| `src/pages/dataConnection/database/form/connect-options.tsx:274` | `target={'#'+uriInputId}` |
| `src/pages/dataConnection/database/form/advanced-options.tsx:232` | `target={'#'+id}` |
| `src/components/fieldPill/encodeCreationPill.tsx:65` | `target={container}`（ref） |
| `src/components/fieldPill/filterCreationPill.tsx:100` | `target={container}`（ref） |
| `src/components/fieldPill/fieldPlaceholder.tsx:118` | `target={container}`（ref） |

重构方式：优先把触发元素包进 `<PopoverTrigger asChild>`；触发元素与浮层结构上分离、无法包裹时用 `<PopoverAnchor>` 挂在锚点元素上。删除对应的 DOM id 生成逻辑（多数 `useId` 就是为此服务的，可一并清理）。

### 6.3 验收

- [ ] 每个替换点手工验证：打开/关闭、Esc 关闭、焦点圈定（Tab 不逃出 Dialog/Sheet）、遮罩点击行为与原先一致。
- [ ] `scripts/audit-fluent-complex-components.mjs` 输出 Stage 6 相关组件计数下降；7 个 Callout 锚点（4 个 selector target + 3 个 ref target）均已从脚本 findings 中消失。
- [ ] 构建通过，门禁脚本计数下降符合预期。

---

## Stage 7：复杂组件

### 7.1 RathSelect 替换 Dropdown（56 处，23 个文件）

事实（已盘点确认）：**0 处 multiSelect**；自定义渲染仅 `dataConnection/database/form/connect-options.tsx`（onRenderOption + onRenderTitle）和 `components/image-export-dialog/dialog-form.tsx`（onRenderTitle）；`DropdownMenuItemType`（分组/分隔）仅 1 处。

实现 `src/components/rath-ui/rath-select.tsx`，薄封装 shadcn Select，**保留 Fluent 形状的 props 以便机械替换**：

```tsx
interface RathSelectOption { key: string | number; text: string; disabled?: boolean; itemType?: 'divider' | 'header' }
interface RathSelectProps {
    options: RathSelectOption[];
    selectedKey?: string | number | null;
    onChange?: (key: string | number, option: RathSelectOption) => void;
    label?: string; placeholder?: string; disabled?: boolean; className?: string;
    renderItem?: (option: RathSelectOption) => ReactNode;   // 仅供 2 个自定义渲染调用点使用
    renderValue?: (option?: RathSelectOption) => ReactNode;
}
```

明确不做：multiSelect、搜索（现状无 ComboBox 使用，**不建 RathCombobox**）、`IDropdownOption` 的其余字段。替换完成后删除所有 `IDropdownOption` import（16 处），类型改用 `RathSelectOption`。

### 7.2 RathDataTable 替换 DetailsList（10 处）

**决策：不引入 TanStack Table。** 现状用法简单（多数 `SelectionMode.none`、无分组、无虚拟化、无列拖拽），一个基于 shadcn Table 的薄封装即可：

```tsx
interface RathColumn<T> { key: string; name: string; onRender?: (item: T, index: number) => ReactNode; width?: string /* Tailwind 宽度类 */ }
interface RathDataTableProps<T> {
    items: T[]; columns: RathColumn<T>[];
    selection?: { mode: 'single' | 'multiple'; selectedKeys: string[]; onChange: (keys: string[]) => void; getKey: (item: T) => string };
    rowClassName?: (item: T, index: number) => string;   // 承接 onRenderRow 的样式定制
    onRowClick?: (item: T) => void;
    emptyMessage?: ReactNode; compact?: boolean;
}
```

10 个调用点及处理要点：

| 调用点 | 特性 |
|---|---|
| `pages/dashboard/dashboard-list.tsx` | onRenderRow → `rowClassName`/`onRowClick` |
| `components/fieldFilter/setSelection.tsx` | 配合 fieldFilter 的 Selection |
| `pages/dataSource/importStorage/index.tsx` | 简单展示 |
| `pages/dataSource/profilingView/detailTable.tsx` | 简单展示 |
| `pages/causal/datasetPanel.tsx` | onRenderRow |
| `pages/causal/exploration/predictPanel/configPanel.tsx` | onRenderRow |
| `pages/causal/exploration/causalBlame/index.tsx` | 简单展示 |
| `pages/causal/exploration/autoVis/metaList.tsx` | 注意同文件 styled 里的 `.ms-DetailsList` 覆盖（`autoVis/index.tsx:27,33`）同步重写 |
| `pages/causal/exploration/predictPanel/resultPanel.tsx` | 简单展示 |
| `pages/causal/exploration/autoVis/neighborList.tsx` | 简单展示 |

真正的 `new Selection()` 只有 2 处：`components/fieldFilter/index.tsx`、`components/fieldPill/filterCreationPill.tsx` —— 改为受控 `selectedKeys: string[]` state + checkbox 列，删除 `Selection`/`SelectionMode` import（16 处引用一并清零）。

### 7.3 Pivot → Tabs（12 处 JSX）

全部直接迁 shadcn `Tabs`：`selectedKey/onLinkClick` → `value/onValueChange`；`headersOnly` 变体 → 只渲染 `TabsList`（内容区由现有条件渲染逻辑接管）。**不建 RathTabs 抽象**（重复模式不足以立项）。

### 7.4 菜单与命令栏（量小，直接替换，不建 action schema 层）

- `menuProps` 按钮（6 处，4 个文件）→ `<DropdownMenu>`：trigger 是迁好的 Button，`items` 数组就地展开成 `<DropdownMenuItem>`。
- `<ContextualMenu>`（3 处）→ `DropdownMenu` 或（右键场景）`ContextMenu`。
- `<CommandBar>`（2 处：`pages/megaAutomation/vizOperation/operationBar.tsx`、`pages/dataSource/baseActions/dataOperations.tsx`）→ 一排 Button + 溢出项收进 DropdownMenu 的工具栏布局；`ICommandBarItemProps` 数组就地改写，不做通用 Toolbar 组件。

### 7.5 Nav（2 处 JSX）

主导航 `src/components/appNav.tsx` 与 `pages/loginInfo/index.tsx` 内的 `<Nav>`：改为本地列表标记（`<nav><button>` + active 态 Tailwind 类），保留现有 `commonStore.setAppKey` 导航逻辑。删除 `INavLinkGroup` import。不用 shadcn 的 navigation-menu（那是网站头导航，语义不符）。

### 7.6 v9 组件清退（10 个文件）

| v9 | 替换 |
|---|---|
| `Card / CardHeader` | shadcn `Card` |
| `Text / Caption1` | 语义标签 + Tailwind 类 |
| `TabList / Tab` | shadcn `Tabs` |
| `Menu/MenuTrigger/MenuPopover/MenuList/MenuItem` | `DropdownMenu` |
| `SplitButton`（`pages/dataSource/baseActions/mainActionButton.tsx`） | 组合按钮：主 `Button` + 右侧 `size="icon"` 的 chevron `DropdownMenuTrigger`，外层 `inline-flex`（split-button 模式） |
| `makeStyles / shorthands / tokens` | Tailwind 类 |

涉及文件：`pages/megaAutomation/preference.tsx`、`pages/dataConnection/{supportedSources,create,demo,index}.tsx`、`pages/dataConnection/history/history-list-item.tsx`、`pages/dataSource/index.tsx`、`pages/dataSource/baseActions/mainActionButton.tsx`（`theme.ts`/`index.tsx` 留到 Stage 8）。

### 7.7 零散长尾

- `Breadcrumb`(1) → shadcn breadcrumb；`HoverCard`(1) → shadcn hover-card。
- `ColorPicker` / `SwatchColorPicker`（各 1 处）：先查看调用点（大概率是 painter 取色）。用最小本地实现替换：色板网格（预设色 swatch 按钮）或原生 `<input type="color">`，以现有交互需求为准，**不要 vendor 重型取色器组件**。
- 迁移中遇到本文档未列出的 Fluent 组件：按旧文档的 Migration Decision Matrix 判断，默认直接迁移，并在 `docs/shadcn-migration-log.md` 记一行（组件名、位置、处理方式）。

### 7.8 验收

- [ ] `scripts/audit-fluent-complex-components.mjs` 输出 Stage 7 与 v9 相关组件计数下降；`dropdownMultiSelect` 必须保持 0，`detailsListMsStyleOverrides` 必须随 DetailsList 迁移归零。
- [ ] `rg "from '@fluentui/react'" packages/rath-client/src` 剩余文件数 = 0（`theme.ts`/`index.tsx` 除外）。
- [ ] fieldFilter 的多选交互（勾选、全选、确认回填）手工验证与原行为一致。
- [ ] 每张迁移后的表格检查：空态、横向溢出滚动、行点击。

---

## Stage 8：清退 Fluent 与最终验收

迁移前后都运行：

```bash
scripts/audit-fluent-teardown.mjs
```

该脚本覆盖最终清退面：`package.json` 中 Fluent/office 依赖、源码与 package 中 `@fluentui`/`office-ui-fabric-core` 文本、`iconName`/`iconProps`/`registerIcons`/`initializeIcons`、`ms-*` 类、Theme/Fluent Provider、`public/fonts/fabric-icons-*.woff`、`yarn.lock` 残留、ESLint 防回流规则。默认输出摘要；需要行号时运行 `scripts/audit-fluent-teardown.mjs --full`。Stage 8 收尾时运行 `scripts/audit-fluent-teardown.mjs --strict`，必须通过后才能进入最终人工回归。注意：该脚本会统计注释里的 Fluent/fabric 字样，因为 Stage 8 的 `rg` 归零要求同样覆盖注释和旧说明。

### 8.1 拆除顺序

1. `src/index.tsx`：删 `<ThemeProvider>`（v8）、`<FluentProvider>`（v9）包裹；删 `import 'office-ui-fabric-core/dist/css/fabric.css'`；删 `initializeIcons('/fonts/')` 及其 import。
2. `src/theme.ts`：删 `mainTheme`、`RATH_DARK_THEME`、`customLightTheme` 等全部 Fluent 主题对象。**注意**：`RATH_THEME_CONFIG`（dimension/measure 图表用色常量）被图表逻辑消费，先 `rg RATH_THEME_CONFIG` 找到消费者，把它挪到独立的 `src/queries/themes/rath-colors.ts`（或就地保留 theme.ts 但清空 Fluent 内容），**不能删**。
3. `public/fonts/` 下 20 个 `fabric-icons-*.woff` 删除（先 `rg "fabric-icons" src public` 确认无引用）。
4. `packages/rath-client/package.json` 删依赖：`@fluentui/react`、`@fluentui/react-components`、`@fluentui/font-icons-mdl2`、`office-ui-fabric-core`（`@fluentui/react-hooks` 已在 Stage 2 删除；`@fluentui/react-file-type-icons` 先 rg 确认是否存在再处理）。`yarn install` 刷新 lockfile。
5. **`styled-components` 与 `@types/styled-components` 保留，不删**（见全局纪律）。
6. `src/styles/preflight-compat.css` 逐条复查：为 Fluent 写的补偿删掉，为业务样式写的保留并注明。
7. ESLint 防回流：`.eslintrc` 加

```json
"no-restricted-imports": ["error", { "patterns": ["@fluentui/*", "office-ui-fabric-core*"] }]
```

8. 门禁转强制：`scripts/ui-migration-gates.sh` 改为任一计数非零即 `exit 1`，并在 `.github/workflows/auto-build.yml` 的 build 前加一步执行它。

### 8.2 最终验收清单

依赖与代码门禁：

- [ ] `scripts/audit-fluent-teardown.mjs --strict` 通过。
- [ ] `rg "@fluentui|office-ui-fabric-core" packages/rath-client/src packages/rath-client/package.json` 为 0。
- [ ] `rg "iconName=|iconProps=|registerIcons|initializeIcons" packages/rath-client/src` 为 0。
- [ ] `rg "\bms-[A-Z][A-Za-z]+" packages/rath-client/src` 为 0（注意排除 `application/vnd.ms-excel` 这类 MIME 与 `-ms-` CSS 前缀的误报）。
- [ ] `yarn.lock` 无 @fluentui 相关条目（间接依赖除外，需说明来源）。

运行时回归（全部人工过一遍）：

- [ ] 导入 CSV/示例数据 → 字段 profiling → 元数据编辑。
- [ ] megaAutomation 自动分析、semiAutomation 半自动分析，图表渲染正常（vega 主题不受影响）。
- [ ] causal 全流程：数据集面板（迁移后的表格）→ 因果发现 → exploration 各面板。
- [ ] painter 涂抹交互（含混合连续×分类图表的 mousemove）。
- [ ] dashboard 列表与详情、collection 收藏、图表导出对话框。
- [ ] 偏好设置（齿轮）→ 语言切换（4 种语言，含 Stage 0 新增的 ja/ko）→ 主题编辑器。
- [ ] 键盘走查：Dialog/Sheet/DropdownMenu/Tabs/表格的 Tab 顺序、Esc、焦点圈定。
- [ ] 控制台无缺图标、缺字体、focus 告警。
- [ ] 构建产物体积与 Stage 3 基线对比，写进 PR（预期显著下降：Fluent v8+v9+icon 字体全部移除）。

---

## 全局纪律（每个 Stage 都适用）

**禁改白名单（任何 Stage 都不许动）：**

- `src/queries/themes/**`（vega 主题，与 Fluent 完全解耦）、`src/components/react-vega.tsx` 的 vega-embed 逻辑。
- graphic-walker 的使用方式及其 `dist/style.css` import（黑盒外部组件，视觉与新 UI 略不一致是已接受的现状）。
- Monaco 相关（`react-monaco-editor` 调用点、`config-overrides.js` 里的 MonacoWebpackPlugin）。
- `src/workers/**`、`config-overrides.js`、`public/index.html`、`packages/` 下 rath-client 以外的包。
- 不升级 graphic-walker / vega / mobx / typescript / react-scripts；不引入 React Router；不改构建系统。

**styled-components 边界**：约 140 个文件的 styled-components **保留，不做 Tailwind 化改写**。只允许两种触碰：(a) styled 模板里引用了 `.ms-*` 类或包裹了正被替换的 Fluent 组件——随该组件迁移同步重写；(b) 需要消费新 token——用 `var(--border)` 等 CSS 变量。新写的组件用 Tailwind，存量 styled 不迁移。

**i18n 纪律**：577 处 `intl.get` 全部原样保留 key；重写 JSX 时严禁把 `intl.get('x.y')` 换成硬编码文案；不新增、不重命名 locale key（Stage 0 的 cherry-pick 除外）。

**暗色模式**：范围外。token 层预留 `.dark` 变量块，不接切换逻辑，不宣传支持。

**Fluent 冻结**：从 Stage 3 起，任何新代码禁止新增 Fluent import（包括"临时用一下"）。

**进度与留痕**：每个 PR 描述里附门禁脚本输出的计数对比（迁移前 → 迁移后）；决策类偏差（遇到未列出组件、映射表调整）记入 `docs/shadcn-migration-log.md`。

推荐每个 PR 同时附 `scripts/ui-migration-report.mjs` 的摘要输出；专项脚本只在需要定位具体文件/行号时附加。

**卡住时的兜底**：某个调用点无法按规则表机械转换（行为差异大、视觉严重退化）→ 不要造新抽象，就地写最小自定义实现，记录到 log 文件；连续多个调用点都卡在同一模式 → 停下来向用户汇报，不要自行设计新组件层。

---

## 附录 A：盘点基数（用于自检，替换后应归零的量）

| 项 | 数量 |
|---|---|
| 依赖 v8 的 tsx 文件 | 127 / 232 |
| v9 文件 | 10 |
| Stack / Stack.Item / childrenGap | 128 / 42 / 49 |
| 按钮类 JSX（5 种） | ~195 |
| TextField / Dropdown / Toggle / ChoiceGroup / Checkbox | 49 / 56 / 26 / 17 / 9 |
| Spinner / SpinButton / Slider / MessageBar / ProgressIndicator | 23 / 15 / 10 / 11 / 8 |
| DetailsList 调用点（真 Selection） | 10（2） |
| Pivot JSX | 12 |
| Modal / Panel / TooltipHost / Callout / Dialog / Layer | 7 / 8 / 9 / 4 / 2 / 1 |
| ContextualMenu / menuProps / CommandBar | 3 / 6 / 2 |
| MDL2 图标名 / iconName / iconProps | 90 / 227 / 177 |
| `.ms-*` 真实依赖点 | ~10（见 Stage 5.3/7.2 清单） |
| intl.get 调用 | 577 |

## 附录 B：关键提交索引

| hash | 仓库 | 说明 |
|---|---|---|
| `3a340471` / `706eca5b` | Insider | Stage 0.2 回流的 ja/ko + filter i18n |
| `4018e830` | Insider | LLM poc（含 useInsightExpl，决定不回流） |
| `b5a8b1a2` | Insider | React 18 升级参照（不 pick） |
| `e797f047` | Rath | hashing bin size 修复，需补 pick 到 Insider codex 分支 |
| `68763882` | Rath | painter limits 修复（Insider 侧对应 `03f6126e`） |
| `f3c8cc47` | Rath | lucide-react 引入（PR #434，RathIcon 的既有基础） |
| PR #439 | Rath | painter 回流（已合入 master） |
