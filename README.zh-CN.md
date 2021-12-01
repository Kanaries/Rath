<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/lang-icons/icon128px.png" width="22px" /> [English](./README.md) | 简体中文

# Rath

![](https://travis-ci.org/ObservedObserver/visual-insights.svg?branch=master)
![](https://img.shields.io/github/license/ObservedObserver/showme)


<img src="https://ch-rath.oss-ap-northeast-1.aliyuncs.com/assets/kanaries-light-bg.png" alt="logo" width="360px" style="" />

Rath是新一代的基于增强分析技术的可视化分析工具，它提供了自动化的数据探索分析能力与自动可视化设计能力。Rath既可以在你对数据无从下手时提供分析入口的建议，也可以在你的分析过程中提供实时的分析辅助和建议。Rath会帮你完成大部分数据探索分析的工作，使得你可以专注于领域问题本身。当数据越复杂时，Rath的自动化能力带来的优势就越加显著。
+ 体验最新版 !! [demo(latest)](https://ch-rath.oss-ap-northeast-1.aliyuncs.com/)
+ 体验稳定版 [demo(stable)](https://kanaries.github.io/Rath/)
+ [Youtube 视频 Demo](https://www.youtube.com/watch?v=o3_PH1Cbql4)
+ [Bilibili 视频 Demo](https://www.bilibili.com/video/av82089992/)

## Introduction

Rath 可能帮助你快速完成对一个数据集的自动化可视化分析。它既可以帮助你在自助分析时提供实时的建议，也可以直接根据数据实时的特征生成数据报表。与其他的一些自动化数据探索分析工具只能推荐简单的低维统计特征不同，Rath可以推荐包含一些深层规律的高维可视化，这使得你可以深度的探索数据。

Rath 可以根据人眼的视觉感知的准确度进行可视化设计，这使得Rath设计的可视化可以被更准确的理解。这是基于感知学领域的实验数据设计的最优化算法，而不是一些不可量化的设计经验。

相比于tableau、Congos Analytics等可视化分析工具，Rath可以大幅降低数据分析的门槛，使用户可以关注于实际的问题。

相比于PowerBI、帆软等报表搭建工具，Rath可以制作动态的可视化报表。使得你的报表可以针对数据的特性实时变化，始终把重要的问题暴露出来。

与其他大多数增强分析或自动化可视化工具不同，Rath提供高维的复杂洞察发现能力与针对高维数据的可视化推荐技术。这使得Rath可以发现更深层次的洞察和线索，而不是局限在简单的低维可视化所展示的基础统计特征上。


作者极力推荐的必看 Rath使用教程：[《Tutorial: 使用Rath快速获取数据洞察》](https://www.yuque.com/docs/share/3f32e044-3530-4ebe-9b01-287bfbdb7ce0?#)

### 数据集上传
在数据集界面导入你的数据集，这里会生成一个大致的预览。在这里，你可以完善一些对数据集信息的补充，也可以直接使用机器默认识别的配置。通常你需要关注一下哪些字段是度量，哪些是维度，以及是否存在一些脏数据，你打算如何处理他们。

![](https://ch-resources.oss-cn-shanghai.aliyuncs.com/kanaries/Rath-Demos/dataSource-cn.png)

### 探索分析页面
Rath会自动化的探索你的数据集，并推荐给你数据集中比较有趣的规律和深层的洞察。在这里，你可以快速浏览Rath推荐的结果，如果你对一些结果感兴趣，可以点击“联想”，来获取和当前视图相关的一些其他视图。如果联想的结果中你也感兴趣，可以把你感兴趣的图表设为主图表，继而继续联想，来完成一个探索的过程。

![](https://ch-resources.oss-cn-shanghai.aliyuncs.com/kanaries/Rath-Demos/gallery-cn.png)

当你对一些推荐结果有明确的思路，想要使用类似tableau的方式进行自定义分析时，可以点击“自定义分析”把结果带到自助分析模块。这里提供了一个tableau风格的分析模块，可以使你使用一些自定义分析的能力。

![](https://ch-resources.oss-cn-shanghai.aliyuncs.com/kanaries/Rath-Demos/graphic-walker-cn.png)

### 一键报表生成
除了自己探索外，你也可以一键生成数据报表。这些报表会自动生成内部的联动交互的逻辑，你可以对报表进行交互，来进一步探索数据。

![](https://ch-resources.oss-cn-shanghai.aliyuncs.com/kanaries/Rath-Demos/dashboard-en.png)


### Graphic Walker（自助分析）
Rath中包含一个tableau风格的自助分析工具，它是一个和基于图形语法构建的自助分析面板，可以支持非常灵活自由的可视化配置。这是为了帮助用户在有明确分析目的时使用或在Rath推荐的结果上进行进一步的自助分析。

这个模块从工程上是独立的，你可以把它单独作为一个分析应用来使用或者作为一个嵌入式的模块（Rath便是这也使用它）。

```bash
npm i --save @kanaries/graphic-walker
```

详细的使用方式详见graphic-walker文件夹下的README.md文件

![](https://ch-resources.oss-cn-shanghai.aliyuncs.com/kanaries/Rath-Demos/editor-en.png)


## 案例

+ [DataSet: NASA - Kepler](https://www.kaggle.com/nasa/kepler-exoplanet-search-results)

测试结果可以查看 [测试文档](https://www.yuque.com/chenhao-sv93h/umv780/mbs440)

![](https://chspace.oss-cn-hongkong.aliyuncs.com/visual-insights/rath-demo.jpg)


## 使用

### 线上demo
+ 官网 [kanaries.net](https://kanaries.net/)
+ Github Pages(稳定版) [demo](https://kanaries.github.io/Rath/)
+ 阿里云OSS(最新版) [demo](https://ch-rath.oss-ap-northeast-1.aliyuncs.com/)

### 桌面版下载
- [Mac版](https://ch-resources.oss-cn-shanghai.aliyuncs.com/downloads/rath/Kanaries%20Rath-0.1.0.dmg)
- [Win版](https://ch-resources.oss-cn-shanghai.aliyuncs.com/downloads/rath/Kanaries%20Rath-0.1.0-win.zip)



## 资料

+ [《Tutorial: 使用Rath快速获取数据洞察》](https://www.yuque.com/docs/share/3f32e044-3530-4ebe-9b01-287bfbdb7ce0?#)
+ 使用Rath底层的SDK将增强分析能力嵌入你自己的应用: [visual-insights](https://github.com/Kanaries/visual-insights/blob/master/README.md)
+ QQ交流群：129132269
+ 微信公众号：Kanaries

## Reference

Rath is insipired by several excellent works below:

+ Wongsuphasawat, Kanit, et al. "Voyager 2: Augmenting visual analysis with partial view specifications." Proceedings of the 2017 CHI Conference on Human Factors in Computing Systems. ACM, 2017.
+ B. Tang et al, "Extracting top-K insights from multi-dimensional data," in 2017, . DOI: 10.1145/3035918.3035922.
+ A. Satyanarayan, K. Wongsuphasawat and J. Heer, "Declarative interaction design for data visualization," in 2014, . DOI: 10.1145/2642918.2647360.
+ Cleveland, W., & McGill, R. (1984). Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods. Journal of the American Statistical Association, 79(387), 531-554. doi:10.2307/2288400

## LICENSE (GPL)
Rath is a automated pattern discovery and visualization tool (auto-EDA).

Copyright (C) 2019 Observed Observer(Hao Chen)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see https://www.gnu.org/licenses/.