import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { combineLatest, distinctUntilChanged, map, Subject, switchAll } from "rxjs";
import { notify } from "../../components/error";
import type { IFieldMeta } from "../../interfaces";
import type { IFunctionalDep, PagLink, WeightedPagLink } from "../../pages/causal/config";
import { toStream } from "../../utils/mobx-utils";
import type CausalDatasetStore from "./datasetStore";
import type CausalOperatorStore from "./operatorStore";
import { findUnmatchedCausalResults, mergePAGs, resolveCausality, transformAssertionsToPag, transformFuncDepsToPag, transformPagToAssertions } from "./pag";
import type { IDiscoverResult } from "./service";


export enum NodeAssert {
    FORBID_AS_CAUSE = '!-x->',
    FORBID_AS_EFFECT = '!<-x-',
}

export type CausalModelNodeAssertion = {
    fid: string;
    assertion: NodeAssert;
};

export enum EdgeAssert {
    TO_BE_RELEVANT = '---->',
    TO_BE_NOT_RELEVANT = '--x->',
    TO_EFFECT = 'o---o',
    TO_NOT_EFFECT = 'o-x-o',
}

export type CausalModelEdgeAssertion = {
    sourceFid: string;
    targetFid: string;
    assertion: EdgeAssert;
};

export type CausalModelAssertion = CausalModelNodeAssertion | CausalModelEdgeAssertion;

export default class CausalModelStore {

    public readonly destroy: () => void;

    public modelId: string | null = null;

    public generatedFDFromExtInfo: readonly IFunctionalDep[] = [];
    public functionalDependencies: readonly IFunctionalDep[] = [];
    public functionalDependenciesAsPag: readonly PagLink[] = [];

    /**
     * Modifiable assertions based on background knowledge of user,
     * reset with the non-weak value of the causal result when the latter changes.
     */
    public assertions: readonly CausalModelAssertion[] = [];
    public assertionsAsPag: readonly PagLink[] = [];

    public mutualMatrix: readonly (readonly number[])[] | null = null;
    public condMutualMatrix: readonly (readonly number[])[] | null = null;
    
    public causalityRaw: readonly (readonly number[])[] | null = null;
    public causality: readonly WeightedPagLink[] | null = null;
    /** causality + assertionsAsPag */
    public mergedPag: readonly PagLink[] = [];

    constructor(datasetStore: CausalDatasetStore, operatorStore: CausalOperatorStore) {
        const fields$ = toStream(() => datasetStore.allSelectableFields.map(f => datasetStore.allFields[f.field]), true);
        const extFields$ = new Subject<readonly IFieldMeta[]>();
        const causality$ = toStream(() => this.causality, true);
        const assertionsPag$ = toStream(() => this.assertionsAsPag, true);
        
        makeAutoObservable(this, {
            modelId: false,
            destroy: false,
            functionalDependencies: observable.ref,
            generatedFDFromExtInfo: observable.ref,
            assertions: observable.ref,
            assertionsAsPag: observable.ref,
            mutualMatrix: observable.ref,
            causalityRaw: observable.ref,
            condMutualMatrix: observable.ref,
            causality: observable.ref,
            mergedPag: observable.ref,
        });

        const mobxReactions = [
            reaction(() => this.mutualMatrix, () => {
                runInAction(() => {
                    this.condMutualMatrix = null;
                });
            }),
            reaction(() => this.functionalDependencies, funcDeps => {
                runInAction(() => {
                    this.functionalDependenciesAsPag = transformFuncDepsToPag(funcDeps);
                    this.causalityRaw = null;
                    this.causality = null;
                });
            }),
            // update assertions
            reaction(() => this.assertions, assertions => {
                runInAction(() => {
                    this.assertionsAsPag = transformAssertionsToPag(assertions, datasetStore.fields);
                });
            }),
        ];

        const rxReactions = [
            // find extInfo in fields
            fields$.subscribe(fields => {
                runInAction(() => {
                    this.assertions = [];
                    this.assertionsAsPag = [];
                    this.mutualMatrix = null;
                    this.condMutualMatrix = null;
                    this.causalityRaw = null;
                    this.causality = null;
                });
                extFields$.next(fields.filter(f => Boolean(f.extInfo)));
            }),
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
                runInAction(() => {
                    this.generatedFDFromExtInfo = deps;
                });
            }),
            // compute mutual matrix
            combineLatest({
                dataSignal: datasetStore.sampleMetaInfo$,
                fields: fields$,
            }).pipe(
                map(({ fields }) => operatorStore.computeMutualMatrix(datasetStore.sample, fields)),
                switchAll()
            ).subscribe(matrix => {
                runInAction(() => {
                    this.mutualMatrix = matrix;
                });
            }),
            // compute merged pag
            combineLatest({
                basis: causality$,
                assertions: assertionsPag$,
            }).pipe(
                map(({ basis, assertions }) => mergePAGs(basis ?? [], assertions))
            ).subscribe(pag => {
                runInAction(() => {
                    this.mergedPag = pag;
                });
            }),
        ];

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

    // TODO: expose it as a button action
    public synchronizeAssertionsWithResult() {
        const nodeAssertions = this.assertions.filter(decl => 'fid' in decl);
        this.assertions = this.causality ? nodeAssertions.concat(transformPagToAssertions(this.causality)) : [];
    }

    public clearAssertions() {
        this.assertions = [];
    }

    public addNodeAssertion(fid: string, assertion: NodeAssert): boolean {
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

    public removeNodeAssertion(fid: string): boolean {
        const assertionIndex = this.assertions.findIndex(decl => 'fid' in decl && decl.fid === fid);
        if (assertionIndex === -1) {
            return false;
        }
        this.assertions = produce(this.assertions, draft => {
            draft.splice(assertionIndex, 1);
        });
        return true;
    }

    public revertNodeAssertion(fid: string) {
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

    public addEdgeAssertion(sourceFid: string, targetFid: string, assertion: EdgeAssert) {
        if (sourceFid === targetFid || this.assertions.some(decl => 'fid' in decl && [sourceFid, targetFid].includes(decl.fid))) {
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

    public removeEdgeAssertion(nodes: [string, string]) {
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

    public revertEdgeAssertion(nodes: [string, string]) {
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

    public updateCausalResult(result: IDiscoverResult) {
        const { data: { matrix, fields }, modelId, edges } = result;
        this.modelId = modelId;
        this.causalityRaw = matrix;
        const confMatrix: number[][] = fields.map(() => fields.map(() => NaN));
        const weightMatrix: number[][] = fields.map(() => fields.map(() => NaN));
        for (const { data: edge } of edges) {
            const srcIdx = fields.findIndex(f => f.fid === edge.source);
            const tarIdx = fields.findIndex(f => f.fid === edge.target);
            if (srcIdx === -1) {
                console.warn('not found:', edge.source);
                continue;
            }
            if (tarIdx === -1) {
                console.warn('not found:', edge.target);
                continue;
            }
            confMatrix[srcIdx][tarIdx] = edge.confidence;
            weightMatrix[srcIdx][tarIdx] = edge.weight;
        }
        const causalPag = resolveCausality(fields, {
            causality: matrix,
            weight: weightMatrix,
            confidence: confMatrix,
        });
        const unmatched = findUnmatchedCausalResults(this.assertionsAsPag, causalPag);
        if (unmatched.length > 0 && process.env.NODE_ENV !== 'production') {
            const getFieldName = (fid: string) => {
                const field = fields.find(f => f.fid === fid);
                return field?.name ?? fid;
            };
            for (const info of unmatched.slice(0, 0)) { // temporarily disable this
                notify({
                    title: 'Causal Result Not Matching',
                    type: 'error',
                    content: `Conflict in edge "${getFieldName(info.srcFid)} -> ${getFieldName(info.tarFid)}":\n`
                        + `  Expected: ${info.expected.src_type} -> ${info.expected.tar_type}\n`
                        + `  Received: ${info.received.src_type} -> ${info.received.tar_type}`,
                });
            }
        }
        this.causality = causalPag;
    }

}
