## 基础用法

这里介绍visual-insights的最简单的使用场景，使用visual-insights对一个数据集进行自动分析 + 可视化推荐。

```ts
import { VisualInsights } from 'visual-insights';

const vi = new VisualInsights({ dataSource });

// or 

const vi = new VisualInsights({ dataSource, dimensions });
```

首先获取洞察分析的结果
```ts
const insightSpaces = vi.getInisghtSpaces();


```