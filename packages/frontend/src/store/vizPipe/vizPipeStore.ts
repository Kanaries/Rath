import { makeAutoObservable } from "mobx";

export interface IPipeNode<P = void, R = void> {
    props: P;
    returns: R;
    service: (props: P) => R
}

export class VizPipe {
    public pipeline: [IPipeNode];
    constructor () {
        this.pipeline = [
            {
                props: undefined,
                returns: undefined,
                service: () => {}
            }
        ]
        makeAutoObservable(this);
    }
}