import { makeAutoObservable } from "mobx";

export class PainterStore {
    public painting: boolean = false;
    public linkTrigger: number = 0;
    public autoLink: boolean = false;
    constructor () {
        makeAutoObservable(this)
    }
    public setPainting (state: boolean) {
        if (this.painting !== state) {
            this.painting = state
        }
    }
    public setPaintingForTrigger (state: boolean) {
        if (this.painting !== state && this.autoLink) {
            this.painting = state
        }
    }
    public pullTrigger () {
        if (this.autoLink) {
            this.linkTrigger = (this.linkTrigger + 1) % 1000;
        }
    }
    public setAutoLinkMode (auto: boolean) {
        this.autoLink = auto;
    }
}