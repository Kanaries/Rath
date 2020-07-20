## VIEngine

![](https://camo.githubusercontent.com/48fe8a7c761aaa0102fc32e4070dec6eca7af366/68747470733a2f2f636873706163652e6f73732d636e2d686f6e676b6f6e672e616c6979756e63732e636f6d2f76697375616c2d696e7369676874732f726174682d6172632e706e67)

```js
import { VIEngine } from 'visual-insights';

const vie = new VIEngine();

vie.setDataSource(dataSource);
    .setFieldKeys(keys);
```

`VIEngine` 不会进行维度/度量类型的自动推断，这一层仅仅负责接收字段类型，而非推断字段类型。
setDimensions和setMeasures会

### buildFieldsSummary
VIEngine内部会存储字段类型信息，这些信息的构成为
```typescript
interface IField {
    key: string;
    name?: string;
    analyticType: IAnalyticType;
    semanticType: ISemanticType;
    dataType: IDataType;
}
```

其中AnalyticType是通过setDimensions/Measures而指定的，而semanticType与dataType则是基于数据自动推断的。

```js
const fields = vie.buildFieldsSummary()
    .fields;
```
这一步会为VIEngine的实例计算fields与fieldDictonary。这两个属性的信息一定程度上讲冗余且可以互相推断的，但由于二者都存在频繁的被直接使用的场景，所以VIEngine会把二者都存储下来以降低计算开销。

在获得fields之后，你会获得一些关于字段的详细信息，根据这些信息你可以决定哪些字段作为维度、哪些字段作为度量
```js
vie.setDimensions(dimensions);
    .setMeasures(measures);
```

### buildGraph
```ts
vie.buildGraph();
```

+ 计算结果存储在vie.dataGraph上。
+ 调用的条件，vie.(dataSource, dimensions, measures)都被定义。

### clusterFields
-> 
+ dataGraph.DClusters
+ dataGraph.MClusters


### buildCube

buildCube会依赖于字段聚类结果的构建。这是由于一个VIEngine会构建多个cube（这种操作其实没有必要，用cuboid划分就够啦，甚至更好，尤其是在dataGraph会变动的情况下，可以不完全重新计算cube）
如果未来合并成一个cube, 甚至可以抛弃掉contextDimensions这一非常恶心的属性(给用户自定义subspaces时带来负担)

### getCombinationFromClusterGroups

getCombinationFromClusterGroups的方法如字面意，它基于此前对字段的聚类结果，在每一个聚类的簇内，都进行组合。这个方法在大多数情况下都不需要被手动调用，一般作为内部API使用（主要是被`buildSubspaces`调用）。

### buildSubspaces
`buildSubspaces`的作用是生成所有的subspaces(子空间，即维度与组合)。subspaces的生成一般并不会是数据集所有维度组合的所有情况，而是依赖于维度间相关性与度量间相关性(这一步在dataGraph时构建)，以及组合的最大最小值限制(可选参数)。
```ts
public buildSubspaces(
    DIMENSION_NUM_IN_VIEW: ConstRange = this.DIMENSION_NUM_IN_VIEW,
    MEASURE_NUM_IN_VIEW: ConstRange = this.MEASURE_NUM_IN_VIEW
): VIEngine

interface ConstRange {
    MAX: number;
    MIN: number;
}
```

案例
```ts
vie.buildSubspaces();
vie.buildSubspaces({ MAX: 5, MIN: 2}, {MAX: 2, MIN: 1});
```

`buildSubspaces`的计算会依赖dataGraph的群簇属性，所以要确保其被调用之前必须执行过`buildDataGraph`与`clusterFields`。


### insightExtraction
根据之前获取到的所有子空间，检查每一个子空间上各种洞察类型的显著性。该API为一个异步方法，这是由于有些洞察计算可能并不发生在主线程上。
```ts
public async insightExtraction(viewSpaces: ViewSpace[] = this.subSpaces): Promise<IInsightSpace[]>
```

```ts
vie.insightExtraction()
    .then(spaces => {
        console.log(spaces)
    })
```

### setInsightScores

内置的默认评分，会对每一个insightSpaces计算最终的评分。
```ts
vie.setInsightScores();
```

### specification

将一个insightSpace变成一个可视化的声明。这一步会帮你选择合适的geom类型、根据视觉通道的可表达性与有效性推荐encoding等。

```ts
public specification(insightSpace: IInsightSpace)
```