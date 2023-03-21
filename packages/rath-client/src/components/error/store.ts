import { makeAutoObservable } from "mobx";
import { ReactElement } from 'react';

const MESSAGE_SHOW_TINE = 30000;

export interface IErrorInfo {
    title: string;
    content: string | ReactElement; 
    type: 'error' | 'warning' | 'info' | 'success'
}
class ErrorStore {
    public queue: IErrorInfo[]
    constructor () {
        this.queue = [];
        makeAutoObservable(this);
    }
    public append (message: IErrorInfo) {
        this.queue.push(message)
        callTerminator()
    }
    public popFront () {
        this.queue.shift()
    }
    public remove(index: number) {
        this.queue.splice(index, 1)
    }
}

const errorStore = {
    ref: new ErrorStore()
}

export function getErrorStore () {
    return errorStore.ref;
}

const terminatorRef: { ref: number } = {
    ref: -1
}

export function callTerminator () {
    if (terminatorRef.ref !== -1) {
        cancelTerminator();
    }
    terminatorRef.ref = window.setTimeout(() => {
        const store = getErrorStore();
        store.popFront()
        if (store.queue.length > 0) {
            callTerminator();
        }
    }, MESSAGE_SHOW_TINE)
}

export function cancelTerminator () {
    clearTimeout(terminatorRef.ref);
    terminatorRef.ref = -1;
}