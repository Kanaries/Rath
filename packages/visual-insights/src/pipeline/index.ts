import produce from 'immer';
import { PipeLineNode, PipeLineNodeInterface } from './node';

interface PipeLineInterface {
  nodes: PipeLineNodeInterface<any, unknown>[]
}

export class PipeLine<NODES extends readonly PipeLineNodeInterface[]> {
  nodes: PipeLineNode[];
  runningIndex: number;
  constructor (props: { nodes: NODES }) {
    // this.nodes = [] as NODES;
    this.nodes = [];
    props.nodes.forEach((node, index) => {
      if (index > 0) {
        let newNode = produce(node, draft => {
          if (typeof draft.channels === 'undefined') {
            draft.channels = {
              injection: {},
              release: {}
            }
          }
          draft.channels.injection['source'] = (injection) => {
            injection(draft => {
              draft.source = this.nodes[index - 1].state.returns;
            })
          }
          // this.nodes[index - 1].state.returns;
        })
        let pipeNode = new PipeLineNode(newNode);
        this.nodes.push(pipeNode);
      } else {
        let pipeNode = new PipeLineNode(node);
        this.nodes.push(pipeNode)
      }

    })
    // for (let i = 0; i < props.nodes.length; i++) {
    //   let node = props.nodes[i];
    //   let pipeNode = new PipeLineNode(node);
    //   pipeNode.openChannel({
    //     type: 'consumer',
    //     operator: (state) => {
    //       console.log('consumer', state.returns)
    //       return state.returns;
    //     }
    //   })
    //   if (i > 0) {
    //     pipeNode.openChannel({
    //       type: 'producer',
    //       operator: (state, injection, params) => {
    //         let lastNode = this.nodes[i - 1];
    //         // let target = lastNode.channels.find(c => c.type === 'consumer');
    //         injection(draft => {
    //           console.log('last', lastNode.state.returns)
    //           draft.source = lastNode.state.returns;
    //         })
    //       }
    //     })
    //   }
      
    //   this.nodes.push(pipeNode);
    // }
  }
  public run (startIndex: number = 0): void {
    for (let i = startIndex; i < this.nodes.length; i++) {
      this.nodes[i].run();
    }
  }
}