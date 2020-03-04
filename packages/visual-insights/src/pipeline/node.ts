import produce from 'immer';

type NucleiFunction<P, R> = (params: P) => R;

interface StateBase<P extends { source: any }, R> {
  startTime: number;
  endTime: number;
  params: P;
  returns: R | null
}

type Injection<P> = (updater: (cytoplasmParams: P) => void) => void;

type ChannelOperator<S extends StateBase<any, any>, Signal> = (cytoplasmState: S, inject?: Injection<S['params']>, params?: any) => Signal;

interface Channel<S extends StateBase<any, any>, Signal = any> {
  type: 'consumer' | 'producer';
  operator: ChannelOperator<S, Signal>
}
export interface PipeLineNodeInterface<P extends { source: any }, R> {
  nuclei: NucleiFunction<P, R>;
  initParams: P
}
export class PipeLineNode<P extends { source: any }, R> {
  /**
   * kernal function responsable for specific task of current node in pipeline.
   */
  public nuclei: NucleiFunction<P, R>;
  /**
   * which is the cytoplasm, contains node status, outside control params and returns of nuclei function
   */
  public state: StateBase<P, R>;
  /**
   * service plugins / cytoplasm consumers
   */
  public channels: Channel<StateBase<P, R>>[];
  constructor (props: PipeLineNodeInterface<P, R>) {
    this.nuclei = props.nuclei;
    this.state = {
      startTime: 0,
      endTime: 0,
      params: props.initParams,
      returns: null
    }
    this.channels = [];
  }
  /**
   * injection is used by channel to update the state.params in "cytoplasm".
   */
  public injection: Injection<P> = (updater) => {
    let nextParams = produce(this.state.params, updater);
    this.state.params = nextParams;
  }
  /**
   * register a channel (or service plugin, or cytoplasm consumer)
   * @param channel 
   */
  public openChannel (channel: Channel<StateBase<P, R>>) {
    this.channels.push(channel);
  }
  // public absorbProps(params: P) {
  //   this.state.params = params;
  // }

  private beforeRun() {
    this.state.startTime = new Date().getTime();
    for (let channel of this.channels) {
      if (channel.type === 'producer') {
        channel.operator(this.state, this.injection);
      }
    }
  }
  private afterRun(returns: R) {
    this.state.endTime = new Date().getTime();
    this.state.returns = returns;
    for (let channel of this.channels) {
      // todo: consumer type should not get injection ?
      if (channel.type === 'consumer') {
        channel.operator(this.state);
      }
    }
  }
  public run (): R {
    this.beforeRun();
    let returns: R = this.nuclei(this.state.params);
    this.afterRun(returns);
    return returns;
  }
}