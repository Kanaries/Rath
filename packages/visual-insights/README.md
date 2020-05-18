# Visual-Insights

![](https://travis-ci.org/kanaries/Rath.svg?branch=master)
![](https://img.shields.io/npm/v/visual-insights?color=blue)
[![Coverage Status](https://coveralls.io/repos/github/Kanaries/Rath/badge.svg?branch=master)](https://coveralls.io/github/Kanaries/Rath?branch=dev)

## Usage

### Basic

```js
import { IntentionWorkerCollection } from 'visual-insights';

const collection = IntentionWorkerCollection.init();

const result = getVisSpaces({ dataSource, dimensions, measures, collection })
```

### Custom intention worker

```js
import { IntentionWorkerCollection, IntentionWorker } from 'visual-insights';

const myIWorer: IntentionWorker = () => {};

const collection = IntentionWorkerCollection.init();

collection.register('myIWorker', myIWorker);

const result = getVisSpaces({ dataSource, dimensions, measures, collection })
```

### Disable default iworkers

```js
import { IntentionWorkerCollection, DefaultIWorker } from 'visual-insights';

const collection = IntentionWorkerCollection.init();

collection.enable(DefaultIWorker.outlier, false);
// or disable all the default workers.
// const collection = IntentionWorkerCollection.init({ withDefaultIWorkers: false })

const result = getVisSpaces({ dataSource, dimensions, measures, collection })
```