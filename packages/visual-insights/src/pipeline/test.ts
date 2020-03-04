import { PipeLine } from './index';

// array: x => x + 1
// array: x => x / index
// array => sum(array)

let pipe = new PipeLine({
  nodes: [
    {
      initParams: {
        source: [10, 20, 30]
      },
      nuclei: (params) => params.source.map(n => n + 1)
    },
    {
      initParams: {
        source: []
      },
      nuclei: (params) => params.source.map((n, i) => n / (i +  1))
    },
    {
      initParams: {
        source: []
      },
      nuclei: (params) => {
        let sum = 0;
        params.source.forEach(n => {
          sum += n;
        })
        console.log(sum)
        return sum;
      }
    }
  ]
});

pipe.run();
