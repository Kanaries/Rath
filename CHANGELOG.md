## Table of Contents

- [0.0.1](#001)


### [0.0.1]

> Released on Nov.23.2022
The initial version of RATH changelog is released. Incoming updates will be grouped in the following categories:

#### Feature Requests
- Support more types of data file. [#150](https://github.com/Kanaries/Rath/issues/150)
  - base: txt with customized splitter, xlsx file
  - cool : multiple-layer JSON data with LaTiao transformation.
- Chart renderer in webworker. [#127](https://github.com/Kanaries/Rath/issues/127)
- Custom Visualization Color Scheme [#126](https://github.com/Kanaries/Rath/issues/126)
  - https://vega.github.io/vega/docs/schemes/
- Support search fields. [#124](https://github.com/Kanaries/Rath/issues/124)
  - search & filter
  - search pill
- support cases when datasets contains no measures [#95](https://github.com/Kanaries/Rath/issues/95)

#### Bug fixes
- [Vega-Lite] This file will be used when vega-lite facets bug is fixed. [#70](https://github.com/Kanaries/Rath/issues/70)

[Back to TOC](##table-of-contents)


### 1.1.0

#### Features
+ Causal analysis
  + causal discovery
  + ML modeling
  + causal explain
+ Text pattern discovery: User can specify a selection in the data table, RATH can figure out the selection purpose and genelize a pattern to match all same patterns and extract to new variable.
+ Data Table do not display axis' labels and use tooltip instead.
+ image download button beside visualization.
+ better file upload UI
+ support Excel File as DataSource.
