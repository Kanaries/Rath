<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/lang-icons/icon128px.png" width="22px" /> English | [日本語](./docs/README-jp.md) | [简体中文](./docs/README-zh.md)
<div align="center">
  <br>
  <p align="center">
    <img src="https://camo.githubusercontent.com/53b952ee2dce0e37b0357d94965630b98e729027fb979911b377fa70501471e4/68747470733a2f2f6b616e61726965732e636e2f6173736574732f6b616e61726965732d6c6f676f2e706e67" alt="RATH, the automated exploratory Data Analysis co-pilot" width="120">
   </p>
   <h1 style="font-size:55px">RATH</h1>
  <strong>Next Generation Open Source Augmented Analytics BI</strong>
</div>
<br>
<div id="header" align="center">
  <div id="badges">
  <a href="https://www.linkedin.com/company/kanaries-data">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=flat-square&logo=linkedin&logoColor=white" alt="Follow RATH on LinkedIn"/>
  </a>
  <a href="https://www.youtube.com/@kanaries_data">
    <img src="https://img.shields.io/badge/YouTube-red?style=flat-square&logo=youtube&logoColor=white" alt="Follow RATH on Youtube"/>
  </a>
  <a href="https://twitter.com/kanaries_data">
    <img src="https://img.shields.io/badge/Twitter-blue?style=flat-square&logo=twitter&logoColor=white" alt="Follow RATH on Twitter"/>
  </a>
  <a href="https://medium.com/@kanaries_data">
    <img src="https://img.shields.io/badge/Medium-grey?style=flat-square&logo=medium&logoColor=white" alt="Read about RATH on medium"/>
  </a>
  <a href="https://discord.gg/Z4ngFWXz2U">
    <img src="https://img.shields.io/badge/Discord-indigo?style=flat-square&logo=discord&logoColor=white" alt="Join RATH on Discord"/>
  </a>
  <a href="https://join.slack.com/t/kanaries/shared_invite/zt-1k60sgaxu-aGcuS7CwGeJUccE61iGopg">
    <img src="https://img.shields.io/badge/Slack-green?style=flat-square&logo=slack&logoColor=white" alt="Join RATH on Slack"/>
  </a> 
  </div>
  <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">
    <img src="https://img.shields.io/badge/license-AGPL-brightgreen?style=flat-square" alt="AGPL License">
  </a>
  <a href="https://github.com/Kanaries/Rath/stargazers">
    <img src="https://badgen.net/github/stars/kanaries/rath?style=flat-square" alt="RATH GitHub Stars">
  </a>
  <a href="https://github.com/Kanaries/Rath/fork">
    <img src="https://badgen.net/github/forks/kanaries/rath?style=flat-square" alt="RATH GitHub Forks">
  </a>
    <a href="https://github.com/Kanaries/Rath/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/kanaries/rath/auto-build.yml?branch=master&style=flat-square">
  </a>
</div>

## Introduction

**RATH** is beyond an open-source alternative to Data Analysis and Visualization tools such as Tableau. It automates your Exploratory Data Analysis workflow with an Augmented Analytic engine by discovering patterns, insights, causals and presents those insights with powerful auto-generated multi-dimensional data visualization.

<a href="https://kanaries.net"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/feature-demo.gif" alt="RATH features demo"></a>

## Get started

Get started with RATH now!
- 🚀 [Online RATH / Demo](https://rath.kanaries.net)
- 📖 [Read RATH Docs](https://docs.kanaries.net)
- [Video introducing RATH's data painter](https://youtu.be/djqePNyhz7w)


## Table of contents

[Feature highlights](#features) | [Walkthroughs](#walkthroughs) | [Developer Documentation](#developer-documentation) | [Project Status](#project-status) | [Community](#community) | [Contributions](#contributions) 

## Features
+ 🤖 [Mega-auto exploration](https://docs.kanaries.net/auto-explore): Augmented analytic engine for discovering patterns, insights, and causals. A fully-automated way to explore your data set and visualize your data with one click.

+ AutoVis: Auto-generated multi-dimensional data visualization based on the effectiveness score.

- 👓 [Data Wrangler](https://docs.kanaries.net/data-source): Automated data wrangler for generating summary of the data and data transformation.

- 🛠 [Semi-auto exploration](https://docs.kanaries.net/semi-auto-explore): Combines automated data exploration and manual exploration. RATH will work as your copilot in data science, learn your interests and uses augmented analytics engine to generate relevant recommendations for you.

- 🎨 [Data painter](https://docs.kanaries.net/data-painter): An interactive, instinctive yet powerful tool for exploratory data analysis by directly coloring your data, with further analytical features. A video about data painter [here](https://youtu.be/djqePNyhz7w)

- :bar_chart: Dashboard: build a beautiful interactive data dashboard (including a automated dashboard designer which can provide suggestions to your dashboard).

- :construction: Causal Analysis: Provide causal discovery and explanations for complex relation analysis.


## Walkthroughs

### Import data from online databases or CSV/JSON files.

[![](https://docs-us.oss-us-west-1.aliyuncs.com/images/readme/datasource-readme.gif)](https://docs.kanaries.net/data-profiling#import-your-data)


### View statistics from your data source

[![](https://docs-us.oss-us-west-1.aliyuncs.com/images/readme/data-profiling-readme.gif)](https://docs.kanaries.net/data-profiling#data-profiling)

### One-click automated data analysis with visualizations


[![](https://docs-us.oss-us-west-1.aliyuncs.com/images/readme/mega-auto.gif)](https://docs.kanaries.net/mega-auto-data-exploration)

### Use RATH as your AI Copilot in Data Analysis

Assisted with AI, RATH can help you with your data analysis. Just provide RATH with some input and it will learn about your interests and suggest analysis directions to take.

[![](https://docs-us.oss-us-west-1.aliyuncs.com/images/readme/semi-auto-readme.gif)](https://docs.kanaries.net/semi-auto-data-exploration)

### Manually explore your data with drag and drop:

<a href="https://docs.kanaries.net/semi-auto-data-exploration#manually-explore-your-data"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/manually-explore-data-tableau-ui.gif" alt="Manually explore your data with a Tableau-like UI"></a>

> Manual Exploration is an independent embedding module. You can use it independently in your apps. For more details, refer to the README.md in in `packages/graphic-walker/README.md`.
>
> Install Graphic Walker
> ```bash
> yarn add @kanaries/graphic-walker
> # or
> npm i --save @kanaries/graphic-walker
> ```

### :sparkles: Interactive data analysis workflow by data painting

[Data Painter Video 🔥 on Youtube](https://youtu.be/djqePNyhz7w)

<a href="https://docs.kanaries.net/data-painter"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/data-analysis-paiting.gif" alt="Interactive data analysis by painting"></a>

### 🌅 Causal Analysis (Alpha stage)

Causal analysis could be defined as the way to identify and examine the causal relationship between variables, which can help explore the data, create better prediction models and make business decission.

RATH's causal analysis feature include:
- Causal Discovery
- Editable graphical causal models
- Causal interpretability
- Interactive tools for deeper exploration
- What-if analysis

![Causal Analysis](https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/github-readme/causal-analysis.png)

For more about Causal Analysis features, refer to [RATH Docs](https://docs.kanaries.net/causal-analysis).

## Supported Databases

RATH supports a wide range of data sources. Here are some of the major database solutions that you can connect to RATH:

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

If you want to add support for more database types or data engines, feel free to [Contact us](https://docs.kanaries.net/join#-need-help)

## Developer Documentation

We encourage you to check out our [RATH Docs](https://docs.kanaries.net) for references and guidance. RATH Docs are scripted and maintained by technical writers and editors who collectively follow a standardized [style guide](https://docs.kanaries.net/documentation-style-guide) to produce clear and consistent documentation.

## Project Status

![Alt](https://repobeats.axiom.co/api/embed/0aa0df006ea6857c02565043d39c2b0da5380f93.svg "Repobeats analytics image")

## Community

[Kanaries community](https://docs.kanaries.net/community) is a place to have open discussions on features, voice your ideas, or get help with general questions. Get onboard with us through the following channels:

Our developer community is the backbone of the ongoing RATH project. We sincerely welcome you to [join our community](join), participate in the conversation and stay connected with us for the latest updates.
- [Join our Slack](https://join.slack.com/t/kanaries/shared_invite/zt-1k60sgaxu-aGcuS7CwGeJUccE61iGopg)
- [Join our Discord](https://discord.gg/Z4ngFWXz2U)

Feel free to [contribute to the RATH project](contribution-guide), submit any issues on our GitHub page, or split your grand new ideas in our chats.

<a href="https://join.slack.com/t/kanaries/shared_invite/zt-1k60sgaxu-aGcuS7CwGeJUccE61iGopg"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/slack.png" alt="Join our Slack community" width="200"/></a>
<a href="https://discord.gg/Z4ngFWXz2U"><img src="https://kanaries-docs.oss-cn-hangzhou.aliyuncs.com/img/discord.png" alt="Join our Discord community" width="200"/> </a>


> Please consider sharing your experience or thoughts about [Kanaries RATH](https://kanaries.net) with the border Open Source community. It really does help!

[![GitHub Repo stars](https://img.shields.io/badge/share%20on-reddit-red?style=flat-square&logo=reddit)](https://reddit.com/submit?url=https://github.com/Kanaries/Rath&title=OpenSource%20Augmented%20Analytic%20BI%20Solution:%20Automated%20Exploratory%20Data%20Analysis%20for%20Data%20Science)
[![GitHub Repo stars](https://img.shields.io/badge/share%20on-hacker%20news-orange?style=flat-square&logo=ycombinator)](https://news.ycombinator.com/submitlink?u=https://github.com/Kanaries/Rath)
[![GitHub Repo stars](https://img.shields.io/badge/share%20on-twitter-03A9F4?style=flat-square&logo=twitter)](https://twitter.com/share?url=https://github.com/Kanaries/Rath&text=OpenSource%20Augmented%20Analytic%20BI%20Solution:%20Automated%20Exploratory%20Data%20Analysis%20for%20Data%20Science)
[![GitHub Repo stars](https://img.shields.io/badge/share%20on-facebook-1976D2?style=flat-square&logo=facebook)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/Kanaries/Rath)
[![GitHub Repo stars](https://img.shields.io/badge/share%20on-linkedin-3949AB?style=flat-square&logo=linkedin)](https://www.linkedin.com/shareArticle?url=https://github.com/Kanaries/Rath&title=OpenSource%20Augmented%20Analytic%20BI%20Solution:%20Automated%20Exploratory%20Data%20Analysis%20for%20Data%20Science)

## Contributions

Please check out the [Contributing to RATH guide](https://docs.kanaries.net/contribution-guide)
for guidelines about how to proceed.

Thanks to all contributors :heart:

<a href="https://github.com/kanaries/rath/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kanaries/rath" />
</a>

## LICENSE (AGPL)
Rath is an automated data analysis and visualization tool (auto-EDA).

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

---

Branded icons are licensed under their copyright license.
<br>
<p align="center">
  <br>
  <strong>Have fun with data!</strong> ❤️
</p>

[⬆ Back to Top](#welcome)
