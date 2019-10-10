# Visual Insights

![](https://travis-ci.org/ObservedObserver/visual-insights.svg?branch=master)
![](https://img.shields.io/github/license/ObservedObserver/showme)

Automatic insights extraction and visualization specification in data analysis.


## Introduction

visual insights helps you extract insights from data warehouse automatically and generate visualization with interesting findings.

Now, there are three main modules in visual-insights application.

### DataSource
dataSource board is for data uploading and defining fields type(dimensions, measures). In visual insights, we regard dimensions as independent variable and measures as dependent variable.

### Notebook
Notebook is a board for user to know what happened in the automatic analysis process. It shows how decisions are made by the application and provide interactive interface to adjust some of the parameters and operators used by the algorithm. 

### Gallery
Gallery displays parts of the visualization with interesting findings. There are some settings here to adjust some of the visual elements in the chart.

## Examples

+ [DataSet: NASA - Kepler](https://www.kaggle.com/nasa/kepler-exoplanet-search-results)

Details of the test result can be accessed [here](https://www.yuque.com/chenhao-sv93h/umv780/mbs440)



## Usage
+ use the whole application `npm run ui`.
+ or run `yarn workspace frontend start` for front end dev, run `yarn work space backend dev` for backend.

only use the algorithm package. (`/packages/visual-insights`) ![](https://img.shields.io/npm/v/visual-insights?color=blue)
```bash
npm i visual-insights --save
```

## How does it work
The working process are visualized in notebook board in the application.

![](https://cdn.nlark.com/yuque/0/2019/png/171008/1570692438037-b2ce208d-bd1d-4b38-be27-9251bbb171d2.png)

### Univariate summary
For the first step, visual-insights analyze all the fields in the dataset independently. It gets the fields' distributions and calculate its entropy. Besides, it will define a semantic type (`quantitative`, `ordinal`, `temporal`, `nominal`) for each field.

![](https://cdn.nlark.com/yuque/0/2019/jpeg/171008/1570614609678-33d5f2c1-e51e-4bcd-8343-271a041f7519.jpeg)

Then, it will find the fields with high entropy and try to reduce it by grouping the field (for example). Only dimensions participates this process.

### Subspaces
In this step, visual insights search the combination of fields, and calculate the entropy of each measure with some aggregation operators.

![](https://cdn.nlark.com/yuque/0/2019/svg/171008/1570614537188-bf841fc7-90ba-47fe-a5f1-83304a4f464a.svg)

### Correlation
After one subspace is specified, it will analyze the correlation of measures in the space.

![](https://cdn.nlark.com/yuque/0/2019/svg/171008/1570614439983-cf6d757a-928d-4f42-b46c-f1de3a76f4b1.svg)

### Clustering
It helps you to cluster all the measures based on their correlation. It puts all the variables who are strongly related together to make a specific view (with specified dimenions).

![](https://cdn.nlark.com/yuque/0/2019/svg/171008/1570614439983-cf6d757a-928d-4f42-b46c-f1de3a76f4b1.svg)


### Specification & Visualization

specification

![](https://cdn.nlark.com/yuque/0/2019/png/171008/1570615741670-48941c9a-2788-4277-a946-6a75c400870d.png)

visualization.

![](https://cdn.nlark.com/yuque/0/2019/svg/171008/1570614529099-de4ead0d-5332-40c4-8101-e122ee0cf1d2.svg)


## Documentation

+ doc for core-algorithm: [visual-insights](./packages/visual-insights/README.md)
+ doc for react components: todos

## Citation

+ T. Sellam, E. Müller and M. Kersten, "Semi-automated exploration of data warehouses," in 2015, . DOI: 10.1145/2806416.2806538.
+ Wongsuphasawat, Kanit, et al. "Voyager 2: Augmenting visual analysis with partial view specifications." Proceedings of the 2017 CHI Conference on Human Factors in Computing Systems. ACM, 2017.
+ B. Tang et al, "Extracting top-K insights from multi-dimensional data," in 2017, . DOI: 10.1145/3035918.3035922.
+ A. Satyanarayan, K. Wongsuphasawat and J. Heer, "Declarative interaction design for data visualization," in 2014, . DOI: 10.1145/2642918.2647360.
+ P. Tan, M. Steinbach and V. Kumar, Introduction to Data Mining. (Pearson New International First ed.) Essex: Pearson, 2014.