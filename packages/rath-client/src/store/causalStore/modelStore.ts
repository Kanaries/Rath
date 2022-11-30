import produce from "immer";
import { makeAutoObservable, observable, reaction } from "mobx";
import { combineLatest, distinctUntilChanged, map, Subject } from "rxjs";
import type { IFieldMeta } from "../../interfaces";
import type { IFunctionalDep, PagLink } from "../../pages/causal/config";
import type CausalDatasetStore from "./datasetStore";
import { mergePAGs, transformAssertionsToPag, transformTagToAssertions } from "./pag";


export enum NodeAssert {
    FORBID_AS_CAUSE,
    FORBID_AS_EFFECT,
}

export type CausalModelNodeAssertion = {
    fid: string;
    assertion: NodeAssert;
};

export enum EdgeAssert {
    TO_BE_RELEVANT,
    TO_BE_NOT_RELEVANT,
    TO_EFFECT,
    TO_NOT_EFFECT,
}

export type CausalModelEdgeAssertion = {
    sourceFid: string;
    targetFid: string;
    assertion: EdgeAssert;
};

export type CausalModelAssertion = CausalModelNodeAssertion | CausalModelEdgeAssertion;

export default class CausalModelStore {

    public readonly destroy: () => void;

    public functionalDependencies: readonly IFunctionalDep[] = [];
    public generatedFDFromExtInfo: readonly IFunctionalDep[] = [];

    /**
     * Modifiable assertions based on background knowledge of user,
     * reset with the non-weak value of the causal result when the latter changes.
     */
    public assertions: readonly CausalModelAssertion[] = [];
    public assertionsAsPag: readonly PagLink[] = [];

    public causality: readonly PagLink[] | null = null;
    /** causality + assertionsAsPag */
    public mergedPag: readonly PagLink[] = [];

    constructor(datasetStore: CausalDatasetStore) {
        const extFields$ = new Subject<readonly IFieldMeta[]>();
        const causality$ = new Subject<readonly PagLink[]>();
        const assertions$ = new Subject<readonly PagLink[]>();

        const mobxReactions = [
            reaction(() => datasetStore.fields, fields => {
                extFields$.next(fields.filter(f => Boolean(f.extInfo)));
                this.assertions = [];
                this.assertionsAsPag = [];
            }),
            reaction(() => this.assertions, assertions => {
                this.assertionsAsPag = transformAssertionsToPag(assertions, datasetStore.fields);
                assertions$.next(this.assertionsAsPag);
            }),
            reaction(() => this.functionalDependencies, () => {
                this.causality = null;
                this.mergedPag = [];
            }),
            reaction(() => this.causality, () => {
                this.synchronizeAssertionsWithResult();
                causality$.next(this.causality ?? []);
            }),
        ];

        const rxReactions = [
            // auto update FD using extInfo
            extFields$.pipe(
                distinctUntilChanged((prev, curr) => {
                    return prev.length === curr.length && curr.every(f => prev.some(which => which.fid === f.fid));
                }),
                map(extFields => {
                    return extFields.reduce<IFunctionalDep[]>((list, f) => {
                        if (f.extInfo) {
                            list.push({
                                fid: f.fid,
                                params: f.extInfo.extFrom.map(from => ({
                                    fid: from,
                                })),
                                func: f.extInfo.extOpt,
                                extInfo: f.extInfo,
                            });
                        }
                        return list;
                    }, []);
                }),
            ).subscribe(deps => {
                this.generatedFDFromExtInfo = deps;
            }),
            // compute merged pag
            combineLatest({
                basis: causality$,
                assertions: assertions$,
            }).pipe(
                map(({ basis, assertions }) => mergePAGs(basis, assertions))
            ).subscribe(pag => {
                this.mergedPag = pag;
            }),
        ];
        
        makeAutoObservable(this, {
            destroy: false,
            functionalDependencies: observable.ref,
            generatedFDFromExtInfo: observable.ref,
            assertions: observable.ref,
            assertionsAsPag: observable.ref,
            causality: observable.ref,
            mergedPag: observable.ref,
        });

        this.destroy = () => {
            mobxReactions.forEach(dispose => dispose());
            rxReactions.forEach(subscription => subscription.unsubscribe());
        };
    }

    public updateFunctionalDependencies(functionalDependencies: readonly IFunctionalDep[]) {
        this.functionalDependencies = functionalDependencies;
    }

    public addFunctionalDependency(sourceFid: string, targetFid: string) {
        this.functionalDependencies = produce(this.functionalDependencies, draft => {
            const linked = draft.find(fd => fd.fid === targetFid);
            if (linked && !linked.params.some(prm => prm.fid === sourceFid)) {
                linked.params.push({ fid: sourceFid });
                if (!linked.func) {
                    linked.func = '<user-defined>';
                } else if (linked.func !== '<user-defined>') {
                    linked.func = '<mixed>';
                }
            } else {
                draft.push({
                    fid: targetFid,
                    params: [{
                        fid: sourceFid,
                    }],
                    func: '<user-defined>',
                });
            }
        });
    }

    public removeFunctionalDependency(sourceFid: string, targetFid: string) {
        this.functionalDependencies = produce(this.functionalDependencies, draft => {
            const linkedIdx = draft.findIndex(fd => fd.fid === targetFid && fd.params.some(prm => prm.fid === sourceFid));
            if (linkedIdx !== -1) {
                const linked = draft[linkedIdx];
                if (linked.params.length > 1) {
                    linked.params = linked.params.filter(prm => prm.fid !== sourceFid);
                    if (linked.func !== '<user-defined>') {
                        linked.func = '<mixed>';
                    }
                } else {
                    draft.splice(linkedIdx, 1);
                }
            }
        });
    }

    protected synchronizeAssertionsWithResult() {
        const nodeAssertions = this.assertions.filter(decl => 'fid' in decl);
        this.assertions = this.causality ? nodeAssertions.concat(transformTagToAssertions(this.causality)) : [];
    }

    protected addNodeAssertion(fid: string, assertion: NodeAssert): boolean {
        const assertionsWithoutThisNode = this.assertions.filter(decl => {
            if ('fid' in decl) {
                return decl.fid !== fid;
            }
            return [decl.sourceFid, decl.targetFid].every(node => node !== fid);
        });
        this.assertions = assertionsWithoutThisNode.concat([{
            fid,
            assertion,
        }]);
        return true;
    }

    protected removeNodeAssertion(fid: string): boolean {
        const assertionIndex = this.assertions.findIndex(decl => 'fid' in decl && decl.fid === fid);
        if (assertionIndex === -1) {
            return false;
        }
        this.assertions = produce(this.assertions, draft => {
            draft.splice(assertionIndex, 1);
        });
        return true;
    }

    protected revertNodeAssertion(fid: string) {
        const assertionIndex = this.assertions.findIndex(decl => 'fid' in decl && decl.fid === fid);
        if (assertionIndex === -1) {
            return false;
        }
        this.assertions = produce(this.assertions, draft => {
            const decl = draft[assertionIndex] as CausalModelNodeAssertion;
            decl.assertion = ({
                [NodeAssert.FORBID_AS_CAUSE]: NodeAssert.FORBID_AS_EFFECT,
                [NodeAssert.FORBID_AS_EFFECT]: NodeAssert.FORBID_AS_CAUSE,
            })[decl.assertion];
        });
        return true;
    }

    protected addEdgeAssertion(sourceFid: string, targetFid: string, assertion: EdgeAssert) {
        if (sourceFid === targetFid && this.assertions.some(decl => 'fid' in decl && [sourceFid, targetFid].includes(decl.fid))) {
            return false;
        }
        const assertionsWithoutThisEdge = this.assertions.filter(
            decl => 'fid' in decl || !([decl.sourceFid, decl.targetFid].every(fid => [sourceFid, targetFid].includes(fid)))
        );
        this.assertions = assertionsWithoutThisEdge.concat([{
            sourceFid,
            targetFid,
            assertion,
        }]);
    }

    protected removeEdgeAssertion(nodes: [string, string]) {
        if (nodes[0] === nodes[1]) {
            return false;
        }
        const assertionIndex = this.assertions.findIndex(decl => 'sourceFid' in decl && nodes.every(fid => [decl.sourceFid, decl.targetFid].includes(fid)));
        if (assertionIndex === -1) {
            return false;
        }
        this.assertions = produce(this.assertions, draft => {
            draft.splice(assertionIndex, 1);
        });
        return true;
    }

    protected revertEdgeAssertion(nodes: [string, string]) {
        if (nodes[0] === nodes[1]) {
            return false;
        }
        const assertionIndex = this.assertions.findIndex(decl => 'sourceFid' in decl && nodes.every(fid => [decl.sourceFid, decl.targetFid].includes(fid)));
        if (assertionIndex === -1) {
            return false;
        }
        this.assertions = produce(this.assertions, draft => {
            const decl = draft[assertionIndex] as CausalModelEdgeAssertion;
            decl.assertion = ({
                [EdgeAssert.TO_BE_RELEVANT]: EdgeAssert.TO_BE_NOT_RELEVANT,
                [EdgeAssert.TO_BE_NOT_RELEVANT]: EdgeAssert.TO_BE_RELEVANT,
                [EdgeAssert.TO_EFFECT]: EdgeAssert.TO_NOT_EFFECT,
                [EdgeAssert.TO_NOT_EFFECT]: EdgeAssert.TO_EFFECT,
            })[decl.assertion];
        });
        return true;
    }

}
