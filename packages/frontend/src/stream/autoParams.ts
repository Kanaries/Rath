import { combineLatest, Observable } from "rxjs";
import { Subspace } from "../service";
import * as op from 'rxjs/operators';
/**
 * A temporay implement of auto params, should be replaced by using recommanded advice from vi engine.
 * @param TOP_K_DIM_GROUP_PERCENT$ 
 * @param auto$ 
 * @param fullDataSubspaces$ 
 */
export function get_TOP_K_DIM_GROUP_NUM$(
TOP_K_DIM_GROUP_NUM$: Observable<number>,
auto$: Observable<boolean>,
fullDataSubspaces$: Observable<Subspace[]>) {
    // return fullDataSubspaces$
    const auto_K$ = combineLatest([fullDataSubspaces$]).pipe(
        op.map(([subspaces]) => {
            const x = subspaces.length;
            if (subspaces.length < 50) return x;
            if (subspaces.length < 500) return Math.sqrt(x - 50) + 50;
            const bias = Math.sqrt(500 - 50) + 50;
            return bias + Math.log2(x - 500 + 1);
        }),
        op.share()
    )
    /**
     * TOP_K_DIM_GROUP_NUM 有效流，在auto=true时，不会触发。
     */
    const EFFECTIVE_TOP_K_DIM_GROUP_NUM$ = TOP_K_DIM_GROUP_NUM$.pipe(
        op.withLatestFrom(auto$),
        op.filter(([TOP_K_DIM_GROUP_NUM, auto]) => {
            return !auto;
        }),
        op.map(([TOP_K_DIM_GROUP_NUM, auto]) => {
            return TOP_K_DIM_GROUP_NUM;
        }),
    )
    const USED_TOP_K_DIM_GROUP_NUM$ = combineLatest([auto_K$, auto$, EFFECTIVE_TOP_K_DIM_GROUP_NUM$]).pipe(
        op.map(([auto_K, auto, TOP_K_DIM_GROUP_PERCENT]) => {
            if (auto) return auto_K;
            return TOP_K_DIM_GROUP_PERCENT
        }),
        op.share()
    )
    return {
        auto_K$,
        USED_TOP_K_DIM_GROUP_NUM$
    }
}

// export function createAutoParams<T>(params$: Observable<T>, auto: Observable<boolean>): Observable<T> {

// }