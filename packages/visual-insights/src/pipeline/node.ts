import produce from 'immer';

type NucleiFunction<P, R> = (params: P) => R;

export interface StateBase<P extends { source: any }, R> {
  startTime: number;
  endTime: number;
  params: P;
  returns: R | null
}

type Injection<P> = (updater: (cytoplasmParams: P) => void) => void;

export type ReleaseChannel<S extends StateBase<any, any>, Signal = any> = (cytoplasmState: S, inject?: Injection<S['params']>) => Signal;
export type InjectChannel<S extends StateBase<any, any>, T> = (inject: Injection<S['params']>, params?: T) => any;

interface BaseChannel<P extends { source: any }, R> {
  injection: {
    source?: InjectChannel<StateBase<P, R>, any>,
    [key: string]: InjectChannel<StateBase<P, R>, any>
  };
  release: {
    [key: string]: ReleaseChannel<StateBase<P, R>, any>
  }
};

export interface PipeLineNodeInterface<P extends { source: any } = { source: any }, R = any, C extends BaseChannel<P, R> = BaseChannel<any, any>> {
  nuclei: NucleiFunction<P, R>;
  initParams: P;
  channels?: C
};

export class PipeLineNode<P extends { source: any } = { source: any }, R = any, C extends BaseChannel<P, R> = BaseChannel<any, any>> {
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
  public channels: C;

  constructor (props: PipeLineNodeInterface<P, R, C>) {
    const { nuclei, initParams, channels } = props;
    this.nuclei = nuclei;
    this.state = {
      startTime: 0,
      endTime: 0,
      params: initParams,
      returns: null
    }
    if (channels) {
      this.channels = channels
    } else {
      this.channels = {
        injection: {},
        release: {}
      } as C;
    }
  }
  /**
   * injection is used by channel to update the state.params in "cytoplasm".
   */
  public injection: Injection<P> = (updater) => {
    let nextParams = produce(this.state.params, updater);
    this.state.params = nextParams;
  }

  private beforeRun() {
    if (this.channels.injection.source) {
      this.channels.injection.source(this.injection)
    }
    this.state.startTime = new Date().getTime();
  }
  private afterRun(returns: R) {
    this.state.endTime = new Date().getTime();
    this.state.returns = returns;
    for (let channelName in this.channels.release) {
      // todo: consumer type should not get injection ?
      this.channels.release[channelName](this.state, this.injection)
    }
  }
  public run (): R {
    this.beforeRun();
    let returns: R = this.nuclei(this.state.params);
    this.afterRun(returns);
    return returns;
  }
  public openChannel (path: string, params) {
    const paths = path.split('.');
    let channel: any = this.channels;
    for (let p of paths) {
      channel = channel[p];
    }
    try {
      channel(this.injection, params)
    } catch (error) {
      console.error('path or params not correct')
    }
  }
}