<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/lang-icons/icon128px.png" width="22px" /> English | [简体中文](./README.zh-CN.md)

# Rath

![](https://travis-ci.org/ObservedObserver/visual-insights.svg?branch=master)
![](https://img.shields.io/github/license/ObservedObserver/showme)


<img src="https://ch-rath.oss-ap-northeast-1.aliyuncs.com/assets/kanaries-light-bg.png" alt="logo" width="180px" style="" />

Automatic insights extraction and visualization specification based on `visual-insights`.

+ [Youtube Video Demo](https://www.youtube.com/watch?v=o3_PH1Cbql4)
+ [Bilibili Video Demo](https://www.bilibili.com/video/av82089992/)

## Introduction

Rath helps you extract insights from datasource automatically and generate interactive visualizations with interesting findings. Rath can auto generate high dimensional visualization contains complex patterns while most other auto-EDA tools only provideing simple low dimensional charts with basic statistics pattern. Its means you can use Rath to explore the data to a deep level and find more insights.

Rath design a algorithm recommanding visualization with lowest perception error by human eyes, which means you can read the info in visualization much accuracte. 

Here are main parts in Rath,

### DataSource
DataSource board is for data uploading, sampling(currently support stream data, which means there is no limit of the size of file you uploaded), cleaning and defining fields type(dimensions, measures). In visual insights, we regard dimensions as independent variable or feature and measures as dependent variable or target.

### Notebook
Notebook is a board for user to know what happened in the automatic analysis process and how rath uses visual-insights. It shows how decisions are made by the application and provide interactive interface to adjust some of the parameters and operators used by the algorithm. 

### Gallery
Gallery displays parts of the visualization with interesting findings. In Gallery, you can find interesting visualizaiton and use association feature to find more related visualization. You can also search specific info in gallery. There are some settings here to adjust some of the visual elements in the chart.

### Explainer
Explainer uses serveral insight discoverary algorithm to detect what is the specific insight type is shown in a visualization recommanded. Explainer is an extension of B. Tang 's Top K insight paper.

### Dashboard
Generate interactive dashboards for your. Rath will figure out sets of visulizations of which contents are connected to each other and can be used to analysis a specific problem. 

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

### deploy

Rath now runs all the computation tasks on webworker. If you are interested in a server version, check the older version or contact us.

(dev)
```bash
# under project root dir
yarn workspace graphic-walker build

yarn workspace frontend start

# localhost:3000
```

production mode
```bash
yarn workspace graphic-walker build

yarn workspace frontend build

# server:8000
```

only use the algorithm package. (`/packages/visual-insights`) ![](https://img.shields.io/npm/v/visual-insights?color=blue)
```bash
npm i visual-insights --save`
```

## Documentation
+ [Tutorial: Using Rath to find deep insight in your data](https://www.yuque.com/docs/share/3f32e044-3530-4ebe-9b01-287bfbdb7ce0?#)
+ visual insight api: [visual-insights](https://github.com/Kanaries/visual-insights/blob/master/README.md)
+ doc for reuseable hooks: todos

## Reference

Rath is insipired by several excellent works below:

+ Wongsuphasawat, Kanit, et al. "Voyager 2: Augmenting visual analysis with partial view specifications." Proceedings of the 2017 CHI Conference on Human Factors in Computing Systems. ACM, 2017.
+ B. Tang et al, "Extracting top-K insights from multi-dimensional data," in 2017, . DOI: 10.1145/3035918.3035922.
+ Vega-Lite: A Grammar of Interactive Graphics. Arvind Satyanarayan, Dominik Moritz, Kanit Wongsuphasawat, Jeffrey Heer. IEEE Trans. Visualization & Comp. Graphics (Proc. InfoVis), 2017
+ Cleveland, W., & McGill, R. (1984). Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods. Journal of the American Statistical Association, 79(387), 531-554. doi:10.2307/2288400

