<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/lang-icons/icon128px.png" width="22px" /> English | [简体中文](./README.zh-CN.md)

# Rath

![](https://travis-ci.org/ObservedObserver/visual-insights.svg?branch=master)
![](https://img.shields.io/github/license/ObservedObserver/showme)


<img src="https://ch-rath.oss-ap-northeast-1.aliyuncs.com/assets/kanaries-light-bg.png" alt="logo" width="180px" style="" />

Automatic insights extraction and visualization specification based on `visual-insights`.

+ [Youtube Video Demo](https://www.youtube.com/watch?v=o3_PH1Cbql4)
+ [Bilibili Video Demo](https://www.bilibili.com/video/av82089992/)

## Introduction

Rath helps you extract insights from datasource automatically and generate interactive visualization with interesting findings.

In this repo,
+ `visual-insights` is the core lib containing insight finding algorithm, auto specification, dashboard generator, etc.
+ `frontend` is a demo build based on `visual-insights`. frontend can be run individually without server. All the computation service are running in webworker by default.
+ When you want to switch to server mode, you can run `backend` code.

Here are main parts in Rath,

### DataSource
dataSource board is for data uploading, sampling(currently support stream data, which means there is no limit of the size of file you uploaded), cleaning and defining fields type(dimensions, measures). In visual insights, we regard dimensions as independent variable or feature and measures as dependent variable or target.

### Notebook
Notebook is a board for user to know what happened in the automatic analysis process and how rath uses visual-insights. It shows how decisions are made by the application and provide interactive interface to adjust some of the parameters and operators used by the algorithm. 

### Gallery
Gallery displays parts of the visualization with interesting findings. In Gallery, you can find interesting visualizaiton and use association feature to find more related visualization. You can also search specific info in gallery. There are some settings here to adjust some of the visual elements in the chart.

### Dashboard
automantic generate dashboard for you. rath will figure out a set of visulization of which contents are connected to each other and can be used to analysis a specific problem. 

## Examples

+ [DataSet: NASA - Kepler](https://www.kaggle.com/nasa/kepler-exoplanet-search-results)

Details of the test result can be accessed [here](https://www.yuque.com/chenhao-sv93h/umv780/mbs440)



## Usage

### Try online demo
+ on Github Pages [demo](https://kanaries.github.io/Rath/)
+ on Alibaba Cloud OSS [demo](https://ch-rath.oss-ap-northeast-1.aliyuncs.com/)

### Download Desktop Version
- [MacOS](https://ch-resources.oss-cn-shanghai.aliyuncs.com/downloads/rath/Kanaries%20Rath-0.1.0.dmg)
- [Windows](https://ch-resources.oss-cn-shanghai.aliyuncs.com/downloads/rath/Kanaries%20Rath-0.1.0-win.zip)

### run locally
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

only use the algorithm package. (`/packages/visual-insights`) ![](https://img.shields.io/npm/v/visual-insights?color=blue)
```bash
npm i visual-insights --save`
```

## How does it work
The working process are visualized in notebook board in the application.  *** Main process of the algorithm is shown in the `notebook` board. *** Here shows how rath use visual-insights to make a analytic pipeline.

![](https://chspace.oss-cn-hongkong.aliyuncs.com/visual-insights/rath-arc.png)

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
