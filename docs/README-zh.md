<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/lang-icons/icon128px.png" width="22px" /> [English](../README.md) | [日本語](./README-jp.md) | 简体中文

<div align="center">
  <br>
  <p align="center">
    <img src="https://camo.githubusercontent.com/53b952ee2dce0e37b0357d94965630b98e729027fb979911b377fa70501471e4/68747470733a2f2f6b616e61726965732e636e2f6173736574732f6b616e61726965732d6c6f676f2e706e67" alt="RATH, the automated exploratory Data Analysis co-pilot" width="120">
   </p>
   <h1 style="font-size:55px">RATH</h1>
  <strong>次世代开源智能数据分析与可视化应用</strong>
  <br></br>
  未来的数据分析场景会是怎样的？RATH借助自动化的数据分析、智能可视化叙事、因果发现与文本挖掘帮助你以前所未有的方式挖掘数据中的价值。
</div>
<br>
<div id="header" align="center">
  <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">
    <img src="https://img.shields.io/badge/license-AGPL-brightgreen?style=flat-square" alt="AGPL License">
  </a>
  <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">
    <img src="https://badgen.net/github/stars/kanaries/rath?style=flat-square" alt="RATH GitHub Stars">
  </a>
  <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">
    <img src="https://badgen.net/github/forks/kanaries/rath?style=flat-square" alt="RATH GitHub Forks">
  </a>
    <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">
    <img src="https://img.shields.io/github/workflow/status/kanaries/rath/Rath%20Auto%20Build?style=flat-square" alt="RATH GitHub Forks">
  </a>
  </a>
    <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">
    <img src="https://img.shields.io/npm/v/@kanaries/graphic-walker/latest?label=%40kanaries%2Fgraphic-walker&style=flat-square" alt="RATH GitHub Forks">
  </a>
</div>

## 欢迎

**欢迎使用[RATH](https://kanaries.cn)!**

RATH 不仅仅是数据分析和可视化工具（如 Tableau）的开源替代品，还是次世代的数据分析应用的雏形。主要功能包括：

- 支持主流数据库导入
- 自动生成多维数据并可视化
- 自动发现数据规律，揭示数据的内在联系和因果关系
- 因果发现与推断，帮你挖掘更深层次的变量关系。
- 根据你关心的文本片段，自动理解你想要进行的数据转化操作，并帮你生成转化选项。
- 使用增强分析引擎自动化你的探索性数据分析（EDA）流程
- 数据绘板，使用绘画的方式玩数据分析。

<a href="https://kanaries.net"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/feature-demo.gif" alt="RATH 功能 demo"></a>

## 快速上手RATH


- 🚀 在浏览器中[立即尝试RATH](https://rath.kanaries.net)
- 📖 阅读[RATH 文档](https://docs.kanaries.net)
- [绘板功能视频](https://www.bilibili.com/video/BV1Pe4y1E7Y2/?share_source=copy_web&vd_source=57ac992756e57aeb910c02693db35eac)

## 联系我们

RATH是开源项目，离不开开源贡献者和关注者的支持。当你遇到问题，bug，疑惑，甚至有有趣的想法或建议，都可以联系我们：
- 邮件: support@kanaries.org
- QQ群: 129132269
- 公众号: kanaries

💪加入我们的社区，成为 RATH 大家庭的一部分！💪

## 目录

| [Why use RATH?](#why-use-rath) | [Try RATH](#try-rath) | [Feature highlights](#feature-highlights) | [Walkthroughs](#walkthroughs) | [Developer Documentation](#developer-documentation) | [Project Status](#project-status) | [Community](#community) | [Contributions](#contributions) | [License (AGPL)](#license-agpl) |

## 启动RATH

你可以：
- 无需代码知识，在浏览器中直接使用 [RATH Cloud](https://rath.kanaries.cn/)
- 下载 [桌面版RATH](https://kanaries.cn/#/products)

这是一个alpha版本，我们会持续更新和改进RATH，欢迎你的反馈和建议。如果你想现在在内部项目中集成RATH，可以联系我们[support@kanaries.org](support@kanaries.org)，并告诉我们你的使用场景和计划。如果你遇到一些问题，欢迎提出在issues中告诉我们。


## 功能特点

- 自动化的探索分析 🚀 数据分析领域的Copilot
  
  面对复杂多变的数据无从下手？发现数据问题，难以快速定位原因。RATH 提供全/半自动的探索分析能力，让机器替你在复杂多变的数据中完成挖掘探索工作。甚至只需一键即可生成动态数据报表。

- 多维可视化探索 🔭 RATH 可以自动化的识别一些数据中的高维复杂规律，并以多维可视化的形式呈现。

  数据探索分析时，多维可视化分析往往能够揭示数据中的深层规律，带给分析人员更多的洞见。过去，需要分析人员具备一定的可视分析的专业知识，才能有效的运用高维可视化发现规律。RATH 则会帮你自动化完成这一工作，让你专注在业务问题本身。

- 基于图形语法的分析模块 👾 RATH 内置了基于图形语法的内置自助分析模块。

  除了全自动化的分析体验，分析师有时会有着明确的分析目的，此时 RATH 会提供一个基于图形语法的自助分析模块，帮助分析师使用传统的分析方式完成自定义的分析。

- 无需担心冷启动问题 🤝 RATH 并不依赖于一些先验知识或是领域经验的输入

  与一些其他的自动化技术不同，RATH 不依赖一些预定义的领域经验、人为标注。只需要最纯粹的数据源本身即可，RATH 会自己理解数据本身，这使得即使你给到RATH的是混淆加密的数据，RATH 仍然可以给到有效的分析结果。当然，如果你能告诉 RATH 更多的信息，RATH 会表现的更好，但通常情况下，RATH 无需这些信息便能给出洞察。

## 功能截图

### 导入数据源

<a href="https://docs.kanaries.net/zh/data-profiling#导入数据"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/import-data-from-selected-data-source.gif" alt="导入数据源"></a>

### 数据转化与清洗
导入数据后，你可以在RATH中快速了解数据的大致分布情况，RATH也会提供一些自动化清洗和转化的方法。

另外，RATH还内置了文本模式识别提取功能，对于一些文本字段，你可以在文本中选择你关心的部分，RATH会自动归纳文本特征，并为你匹配类似的特征，并提取生成新字段。
![text pattern selection](https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/rath/text-pattern-selection-01.gif)

<a href="https://docs.kanaries.net/zh/data-profiling#数据剖析"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/view-statistics-data-source.gif" alt="浏览数据视图"></a>

### 一键全自动分析，并生成可视化视图
在完全没有头绪时，点击自动分析，RATH就可以帮你完成对数据集的探索与挖掘，帮你发现数据中的规律，问题，并自动生成可视化。

<a href="https://docs.kanaries.net/zh/mega-auto-data-exploration"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/one-click-automated-data-analysis-visualization.gif" alt="RATH全自动分析"></a>

### 半自动探索

结合了全自动和半自动的优点，每次都根据你当前关心的点，推荐下一步的分析建议，而不再是做全局的自动化。

<a href="https://docs.kanaries.net/zh/semi-auto-data-exploration"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/rath-data-analysis-ai-copilot.gif" alt="RATH半自动探索"></a>

### 自助分析 （类Tableau）

一个传统的类tableau的拖拉拽分析的模块，适合有明确的分析目的和问题。

<a href="https://docs.kanaries.net/zh/semi-auto-data-exploration#自助分析"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/manually-explore-data-tableau-ui.gif" alt="RATH自助分析"></a>

> 自助分析同时也是一个独立的模块。你可以把它嵌入到你自己的APP内。更多参考位于`packages/graphic-walker/README.md`的README文档
>
>安装方法：
>```bash
>yarn add @kanaries/graphic-walker
># or
>npm i --save @kanaries/graphic-walker
>```

### 数据绘板，以绘画的方式完成数据分析工作流

[数据绘板演示视频](https://www.bilibili.com/video/BV1Pe4y1E7Y2/?share_source=copy_web&vd_source=57ac992756e57aeb910c02693db35eac)

<a href="https://docs.kanaries.net/zh/data-painter"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/data-analysis-paiting.gif" alt="数据绘板"></a>

## 支持数据库

<p align="center">
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/athena.png" alt="Amazon Athena" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/redshift.png" alt="Amazon Redshift" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/spark.png" alt="Apache Spark SQL" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/doris.png" alt="Apache Doris" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/clickhouse.png" alt="Clickhouse" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/hive.png" alt="Apache Hive" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/mysql.png" alt="MySQL" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/postgresql.png" alt="Postgre SQL" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/impala.png" alt="Apache Impala" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/kylin.png" alt="Apache Kylin" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/oracle.png" alt="Oracle" border="0" width="200" height="80"/>
  <img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-logos/airtable.png" alt="AirTable" border="0" width="200" height="80"/>
</p>

想要更多种类的数据库支持？[联系我们](#联系我们) 或在issue中提出你的需求

## 项目看板

![Alt](https://repobeats.axiom.co/api/embed/0aa0df006ea6857c02565043d39c2b0da5380f93.svg "Repobeats analytics image")

## 社区贡献

RATH 的建设离不开我们的社区贡献者。Top Committer 名单：

<a href="https://github.com/kanaries/rath/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kanaries/rath" />
</a>

## 开源许可协议 (AGPL)

RATH使用[GNU AFFERO 通用公共许可证](https://www.chinasona.org/gnu/agpl-3.0-cn.html)。

本程序是自由软件：你可以根据自由软件基金会发布的GNU Affero通用公共许可证的条款，即许可证的第3版或（您选择的）任何后来的版本重新发布它和/或修改它。

本程序的发布是希望它能起到作用。但没有任何保证；甚至没有隐含的保证。本程序的分发是希望它是有用的，但没有任何保证，甚至没有隐含的适销对路或适合某一特定目的的保证。 参见 GNU Affero通用公共许可证了解更多细节。

您应该已经收到了一份GNU Affero通用公共许可证的副本。 如果没有，请参见<https://www.gnu.org/licenses/>。

还要增加如何通过电子和纸质邮件与您联系的信息。

如果您的软件可以通过计算机网络与用户进行远程交互，您也应该确保它为用户提供一种获得其源代码的方法。例如，如果您的程序是一个网络应用程序，它的界面可以显示一个 "源代码 "的链接，引导用户进入代码的存档。您可以用很多方法提供源码，不同的解决方案对不同的程序会更好；具体要求见第13节。

如果有必要，您还应该让您的雇主（如果您是程序员）或学校（如果有的话）为该程序签署一份 "版权免责声明"。有关这方面的更多信息，以及如何申请和遵守GNU AGPL，请参见<https://www.gnu.org/licenses/>。

<br>
<p align="center">
  <br>
  <strong>Have fun with data!</strong> ❤️
</p>

[⬆ 返回目录](#欢迎)
