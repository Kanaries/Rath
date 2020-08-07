<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/lang-icons/icon128px.png" width="22px" /> [English](./README.md) | 简体中文

# Rath

![](https://travis-ci.org/ObservedObserver/visual-insights.svg?branch=master)
![](https://img.shields.io/github/license/ObservedObserver/showme)


<img src="https://ch-rath.oss-ap-northeast-1.aliyuncs.com/assets/kanaries-light-bg.png" alt="logo" width="360px" style="" />

基于 `visual-insights` 开发的增强分析型可视化应用，支持洞察自动发现与智能可视化推荐.

+ [Youtube 视频 Demo](https://www.youtube.com/watch?v=o3_PH1Cbql4)
+ [Bilibili 视频 Demo](https://www.bilibili.com/video/av82089992/)

## Introduction

Rath 可以帮助你自动的从数据源中获取洞察并自动生成可交互式的可视化以辅助你更快的发现数据中的有趣的结论。


在rath的仓库里,
+ `visual-insights` 是rath所依赖的核心算法包，其包括洞察发现算法、自动可视化声明算法与报表生成算法等。
+ `frontend` 是基于`visual-insights`构建的demo，即rath本身的主体部分，前端部分可以在没有后端的情况下独立运行，这是由于rath的所有计算服务都拥有一个webworker的版本(默认的)。
+ 当你希望切换至服务端计算时，你可以使用`backend`里的代码。

Rath主要包含以下的几个大的模块

### 数据源
数据源模块主要包含数据上传、采样(上传与采样支持流式数据，故可以没有文件大小的限制)，清洗以及自定义字段类型(维度或度量)。在rath以及visual-insights中，维度被视为“自变量”或“特征”，度量被视为“因变量”或“目标”。

### 笔记本
笔记本可以帮助你理解rath是如何使用visual-insights来构建自动的数据分析与可视化的。笔记本本身是一个可以互动的算法可视化模块，你可以在这里进行一些简单的调参操作，并观测计算结果是如何被这些参数影响的。

### 展示区
展示区展示了系统自动推荐的具有潜在有趣结论的可视化。在展示区，你可以基于你喜欢的图表进行联想，找到与之关联的图表，或者调整控制一些配置，来调整可视化。在这里，你也可以直接搜索你关心的信息。

### 报表/仪表盘
这个模块可以帮助你自动生成可以交互并包含联动逻辑的可视化报表，rath会基于内容的相关性把同一个问题相关的图表组成一个报表来帮助你研究一个具体的问题。

## 案例

+ [DataSet: NASA - Kepler](https://www.kaggle.com/nasa/kepler-exoplanet-search-results)

测试结果可以查看 [测试文档](https://www.yuque.com/chenhao-sv93h/umv780/mbs440)



## 使用

### 线上demo
+ Github Pages [demo](https://kanaries.github.io/Rath/)
+ 阿里云OSS [demo](https://ch-rath.oss-ap-northeast-1.aliyuncs.com/)

### 桌面版下载
- [Mac版](https://ch-resources.oss-cn-shanghai.aliyuncs.com/downloads/rath/Kanaries%20Rath-0.1.0.dmg)
- [Win版](https://ch-resources.oss-cn-shanghai.aliyuncs.com/downloads/rath/Kanaries%20Rath-0.1.0-win.zip)

### 本地运行
(dev)
```bash
# under project root dir
yarn workspace visual-insights build

yarn workspace frontend start

yarn workspace backend dev

# localhost:3000
```

production mode
```bash
yarn workspace visual-insights build

yarn workspace frontend build

yarn workspace backend dev

# server:8000
```

或者你希望直接使用`visual-insights`构建自己的应用或分析脚本. (`/packages/visual-insights`) ![](https://img.shields.io/npm/v/visual-insights?color=blue)
```bash
npm i visual-insights --save`
```

## Rath是如何工作的
Rath的主要分析流程在dashboard模块中有每个环节的可视化，可以直接尝试使用你熟悉的数据集来了解rath的工作流。下图所示是rath如何组装使用visual-insights的示意图

![](https://cdn.nlark.com/yuque/0/2019/png/171008/1570692438037-b2ce208d-bd1d-4b38-be27-9251bbb171d2.png)

### Univariate summary
For the first step, rath analyze all the fields in the dataset independently. It gets the fields' distributions and calculate its entropy. Besides, it will define a semantic type (`quantitative`, `ordinal`, `temporal`, `nominal`) for each field. More details of the field will be displayed when hover your mouse on the fields.

![](https://cdn.nlark.com/yuque/0/2019/jpeg/171008/1570614609678-33d5f2c1-e51e-4bcd-8343-271a041f7519.jpeg)

Then, it will find the fields with high entropy and try to reduce it by grouping the field (for example). Only dimensions participates this process.

### Subspaces
In this step, visual insights search the combination of fields. Visual-Insights suppose that any two fields appears in a view should be correlated with each other otherwise they should be display in seperated view. Visual-Insight now use crammver'V and pearson' cc for different types of fields' correlation.

![](https://chspace.oss-cn-hongkong.aliyuncs.com/visual-insights/subspaces.svg)

#### Correlation

for example, the correlation of measures:

![](https://chspace.oss-cn-hongkong.aliyuncs.com/visual-insights/correlation.svg)

#### Clustering
It helps you to cluster all the measures based on their correlation. It puts all the variables who are strongly related together to make a specific view (with specified dimenions).


![](https://chspace.oss-cn-hongkong.aliyuncs.com/visual-insights/clustering.svg)

### Insight Extraction
After we get many subspaces, we can check the insight significance of each space. Currently, visual-insights support trend, outlier, group(whether different groups of data behave differently for spefic measures)

![](https://chspace.oss-cn-hongkong.aliyuncs.com/visual-insights/rath-demo.jpg)


### Specification & Visualization

specification

![](https://cdn.nlark.com/yuque/0/2019/png/171008/1570615741670-48941c9a-2788-4277-a946-6a75c400870d.png)

visualization.

![](https://cdn.nlark.com/yuque/0/2019/svg/171008/1570614529099-de4ead0d-5332-40c4-8101-e122ee0cf1d2.svg)


## Documentation

+ visual insight api: [visual-insights](./packages/visual-insights/README.md)
+ doc for reuseable hooks: todos

## Reference

Rath is insipired by several excellent works below:

+ Wongsuphasawat, Kanit, et al. "Voyager 2: Augmenting visual analysis with partial view specifications." Proceedings of the 2017 CHI Conference on Human Factors in Computing Systems. ACM, 2017.
+ B. Tang et al, "Extracting top-K insights from multi-dimensional data," in 2017, . DOI: 10.1145/3035918.3035922.
+ A. Satyanarayan, K. Wongsuphasawat and J. Heer, "Declarative interaction design for data visualization," in 2014, . DOI: 10.1145/2642918.2647360.
+ Cleveland, W., & McGill, R. (1984). Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods. Journal of the American Statistical Association, 79(387), 531-554. doi:10.2307/2288400

## Story behind Rath

Rath is original from Mome Raths in *Alice's Adventures in Wonderland*.

<div style="text-align:center;">
    <img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/mome-raths.png" alt="logo" width="280px" />
</div>

The word Rath is used in SAO Alicization as name of org. developing Soul Translator (STL) and Under World, which creates A.L.I.C.E.