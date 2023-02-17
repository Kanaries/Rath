import { computed, makeAutoObservable, observable, observe } from "mobx"
import { Observable, Subscription } from "rxjs"

export function toStream<T>(
    expression: () => T,
    fireImmediately: boolean = false
): Observable<T> {
    const computedValue = computed(expression)
    return new Observable<T>((subscriber) => observe<T>(computedValue, (props) => {
        subscriber.next(props.newValue as any)
    }, fireImmediately))
}
export class StreamListener<T> {
    public current: T
    private subscription!: Subscription

    constructor(ob: Observable<T>, initialValue: T) {
        this.current = initialValue;
        this.subscription = ob.subscribe(this);
        makeAutoObservable(this, {
            current: observable.ref,
        })
    }

    private dispose() {
        if (this.subscription) {
            this.subscription.unsubscribe()
        }
    }

    next(value: T) {
        this.current = value
    }

    complete() {
        this.dispose()
    }

    error(value: T) {
        this.current = value
        this.dispose()
    }
}

export function fromStream<T>(
    observable: Observable<T>,
    initialValue: T = undefined as any
): StreamListener<T> {
    return new StreamListener(observable, initialValue)
}