import { PipeLine } from './index';
import { PipeLineNode, PipeLineNodeInterface, InjectChannel, ReleaseChannel, StateBase } from './node';

// array: x => x + 1
// array: x => x / index
// array => sum(array)
type Pip = [
  PipeLineNodeInterface<{ source: any[] }, number[]>,
  PipeLineNodeInterface<{ source: any[], threshold: number }, number[], {
    injection: {
      hack: InjectChannel<StateBase<{ source: any[], threshold: number }, number[]>, number>
    };
    release: {
      console: ReleaseChannel<StateBase<{ source: any[] }, number[]>, any>
    }
  }>,
  PipeLineNodeInterface<{ source: any[] }, number>
];
let pipe = new PipeLine<Pip>({
  nodes: [
    {
      initParams: {
        source: [-10, -20, -30, 10, 20, 30]
      },
      nuclei: (params) => params.source.map(n => n + 1),
      channels: {
        injection: {},
        release: {
          console (state) {
            console.log(state)
          }
        }
      }
    },
    {
      initParams: {
        source: [],
        threshold: -Infinity
      },
      nuclei: (params) => params.source.filter(n => n > params.threshold),
      channels: {
        injection: {
          hack (injection, num) {
            // console.log('hack is running', nums)
            injection(draft => {
              draft.threshold = num;
            })
          }
        },
        release: {
          console (state) {
            console.log(state)
          }
        }
      }
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
      },
      channels: {
        injection: {},
        release: {
          console (state) {
            console.log(state)
          }
        }
      }
    }
  ]
});

pipe.run();
console.log('================')
// pipe.nodes[1].channels.injection.hack(pipe.nodes[1].injection, 2)
pipe.nodes[1].openChannel('injection.hack', 2)
pipe.run(1)
