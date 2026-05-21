import type { IDropdownOption } from "@fluentui/react";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import { distinctUntilChanged, Subject, switchAll } from "rxjs";
import { getGlobalStore } from "..";
import { notify } from "../../components/error";
import type { IFieldMeta } from "../../interfaces";
import { IAlgoSchema, IFunctionalDep, makeFormInitParams, PagLink, PAG_NODE } from "../../pages/causal/config";
import { causalService } from "../../pages/causal/service";
import type { IteratorStorage } from "../../utils/iteStorage";
import type { DataSourceStore } from "../dataSourceStore";
import { resolveCausality } from "./pag";

type CausalJobStatus = 'idle' | 'creating' | 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

type CausalJobState = {
    id: string;
    status: CausalJobStatus;
    algoName: string;
    createdAt: number;
    updatedAt?: number;
    error?: string;
};


export default class CausalOperatorStore {

    public causalServer = (
        decodeURIComponent(new URL(window.location.href).searchParams.get('causalServer') ?? '').replace(/\/$/, '')
        || (
            ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
                ? window.location.origin
                : `${window.location.protocol}//causal.gateway.kanaries.net`
        )
    );

    public busy = false;

    public runningJob: CausalJobState | null = null;
    public lastJobResult: { raw: number[][]; pag: PagLink[] } | null = null;
    public lastJobError: string | null = null;
    protected jobAbortController: AbortController | null = null;

    protected _causalAlgorithmForm: IAlgoSchema = {};
    public get causalAlgorithmForm(): IAlgoSchema {
        return this._causalAlgorithmForm;
    }
    public params: { [algo: string]: { [key: string]: any } } = {};
    protected set causalAlgorithmForm(schema: IAlgoSchema) {
        if (Object.keys(schema).length === 0) {
            // This can happen transiently while (re)loading schema; avoid noisy console errors.
            this._causalAlgorithmForm = {};
            return;
        }
        this._causalAlgorithmForm = schema;
    }
    public get causalAlgorithmOptions() {
        return Object.entries(this._causalAlgorithmForm).map(([key, form]) => {
            return { key: key, text: `${key}: ${form.title}` } as IDropdownOption;
        });
    }
    protected _algorithm: string | null = null;
    public get algorithm() {
        return this._algorithm;
    }
    public set algorithm(algoName: string | null) {
        if (this.busy) {
            return;
        } else if (algoName === null) {
            this._algorithm = null;
        } else if (algoName in this._causalAlgorithmForm) {
            this._algorithm = algoName;
        }
    }

    public readonly destroy: () => void;

    constructor(dataSourceStore: DataSourceStore) {
        const allFields$ = new Subject<IFieldMeta[]>();
        const dynamicFormSchema$ = new Subject<ReturnType<typeof this.fetchCausalAlgorithmList>>();

        makeAutoObservable(this, {
            destroy: false,
        });

        const mobxReactions = [
            reaction(() => dataSourceStore.fieldMetas, fieldMetas => {
                allFields$.next(fieldMetas);
            }),
            // this reaction requires `makeAutoObservable` to be called before
            reaction(() => this._causalAlgorithmForm, form => {
                runInAction(() => {
                    this._algorithm = null;
                    this.params = {};
                    for (const algoName of Object.keys(form)) {
                        this.params[algoName] = makeFormInitParams(form[algoName]);
                    }
                    const [firstAlgoName] = Object.keys(form);
                    if (firstAlgoName) {
                        this._algorithm = firstAlgoName;
                    }
                });
            }),
        ];

        const rxReactions = [
            // fetch schema
            allFields$.pipe(
                distinctUntilChanged((prev, next) => {
                    return prev.length === next.length && next.every(f => prev.some(which => which.fid === f.fid));
                }),
            ).subscribe(fields => {
                runInAction(() => {
                    this.causalAlgorithmForm = {};
                });
                dynamicFormSchema$.next(this.fetchCausalAlgorithmList(fields));
            }),
            // update form
            dynamicFormSchema$.pipe(
                switchAll()
            ).subscribe(schema => {
                runInAction(() => {
                    this.causalAlgorithmForm = schema ?? {};
                });
            }),
        ];

        this.destroy = () => {
            mobxReactions.forEach(dispose => {
                dispose();
            });
            rxReactions.forEach(subscription => {
                subscription.unsubscribe();
            });
        };
    }
    
    protected async fetchCausalAlgorithmList(fields: readonly IFieldMeta[]): Promise<IAlgoSchema | null> {
        try {
            const res = await fetch(`${this.causalServer}/algo/list`, {
                method: 'POST',
                body: JSON.stringify({
                    fieldIds: fields.map((f) => f.fid),
                    fieldMetas: fields,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const text = await res.text();
            try {
                return JSON.parse(text) as IAlgoSchema;
            } catch {
                console.error('[CausalAlgorithmList error]: non-JSON response', res.status, text.slice(0, 200));
                return null;
            }
        } catch (error) {
            console.error('[CausalAlgorithmList error]:', error);
            return null;
        }
    }

    public cancelRunningJob() {
        if (this.jobAbortController) {
            this.jobAbortController.abort();
        }
        runInAction(() => {
            this.jobAbortController = null;
            if (this.runningJob) {
                this.runningJob = { ...this.runningJob, status: 'cancelled', updatedAt: Date.now() };
            }
            this.busy = false;
        });
    }

    protected abortJobPoller() {
        if (this.jobAbortController) {
            this.jobAbortController.abort();
        }
        runInAction(() => {
            this.jobAbortController = null;
        });
    }

    protected async pollJobUntilDone(jobId: string, signal: AbortSignal): Promise<any> {
        const start = Date.now();
        const maxMs = 24 * 60 * 60 * 1000; // 24h; still bounded to avoid accidental infinite loops.
        let delayMs = 1500;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (signal.aborted) {
                throw new Error('Polling cancelled');
            }
            if (Date.now() - start > maxMs) {
                throw new Error('Timed out waiting for background job');
            }

            // eslint-disable-next-line no-await-in-loop
            const r = await fetch(`${this.causalServer}/jobs/${jobId}`, { signal });
            // eslint-disable-next-line no-await-in-loop
            const t = await r.text();
            let j: any;
            try {
                j = JSON.parse(t);
            } catch {
                throw new Error(`Non-JSON job response (${r.status}). ${t.slice(0, 200)}`);
            }
            const job = j?.data;
            const st = job?.status as string | undefined;

            runInAction(() => {
                if (this.runningJob && this.runningJob.id === jobId) {
                    this.runningJob = {
                        ...this.runningJob,
                        status: (st as CausalJobStatus) ?? this.runningJob.status,
                        updatedAt: typeof job?.updatedAt === 'number' ? Math.floor(job.updatedAt * 1000) : Date.now(),
                        error: job?.error ?? undefined,
                    };
                }
            });

            if (st === 'done') return job?.result;
            if (st === 'failed') {
                throw new Error(job?.error ?? 'Background job failed');
            }

            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            delayMs = Math.min(10000, Math.floor(delayMs * 1.15));
        }
    }

    public async computeMutualMatrix(data: IteratorStorage, fields: readonly IFieldMeta[]): Promise<number[][] | null> {
        const dataSource = await data.getAll();
        const res = await causalService({ task: 'ig', dataSource, fields });
        return res;
    }

    public async computeCondMutualMatrix(
        data: IteratorStorage, fields: readonly IFieldMeta[], mutualMatrix: readonly (readonly number[])[]
    ): Promise<number[][] | null> {
        const dataSource = await data.getAll();
        const res = await causalService({ task: 'ig_cond', dataSource, fields, matrix: mutualMatrix });
        return res;
    }

    public async causalDiscovery(
        data: IteratorStorage,
        fields: readonly IFieldMeta[],
        functionalDependencies: readonly IFunctionalDep[],
        assertions: readonly PagLink[],
    ): Promise<{ raw: number[][]; pag: PagLink[] } | null> {
        if (this.busy) {
            return null;
        }
        let causality: { raw: number[][]; pag: PagLink[] } | null = null;
        const { fieldMetas: allFields } = getGlobalStore().dataSourceStore;
        const focusedFields = fields.map(f => {
            return allFields.findIndex(which => which.fid === f.fid);
        }).filter(idx => idx !== -1);
        const algoName = this._algorithm;
        const inputFields = focusedFields.map(idx => allFields[idx]);
        if (!algoName) {
            notify({
                title: 'Causal Discovery Error',
                type: 'error',
                content: 'Algorithm is not chosen yet.',
            });
            return null;
        }
        try {
            runInAction(() => {
                this.busy = true;
                this.lastJobResult = null;
                this.lastJobError = null;
            });
            const originFieldsLength = inputFields.length;
            const dataSource = await data.getAll();
            const shouldUseJob = (algoName === 'XLearner' || originFieldsLength >= 10 || dataSource.length >= 500);
            if (shouldUseJob) {
                notify({
                    title: 'Causal discovery started',
                    type: 'info',
                    content: 'Running in background. You can keep using the app; you will be notified when it finishes.',
                });
                // Cancel previous poller (if any) so we don't have multiple loops running.
                this.abortJobPoller();
                const controller = new AbortController();
                runInAction(() => {
                    this.jobAbortController = controller;
                });
                const createRes = await fetch(`${this.causalServer}/jobs/causal/${algoName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        dataSource,
                        fields: allFields,
                        focusedFields: inputFields.map(f => f.fid),
                        bgKnowledgesPag: assertions,
                        funcDeps: functionalDependencies,
                        params: this.params[algoName],
                    }),
                });
                const createText = await createRes.text();
                let createJson: any;
                try {
                    createJson = JSON.parse(createText);
                } catch {
                    throw new Error(`Non-JSON response (${createRes.status}). ${createText.slice(0, 200)}`);
                }
                const jobId = createJson?.data?.jobId as string | undefined;
                if (!jobId) {
                    throw new Error('Failed to create background job.');
                }
                runInAction(() => {
                    this.runningJob = {
                        id: jobId,
                        status: 'queued',
                        algoName,
                        createdAt: Date.now(),
                    };
                    // Let the user continue using the app immediately.
                    this.busy = false;
                });

                // Poll asynchronously; do NOT block the caller (prevents "infinite loop" feel).
                void (async () => {
                    try {
                        const result = await this.pollJobUntilDone(jobId, controller.signal);
                        notify({
                            title: 'Causal discovery finished',
                            type: 'success',
                            content: 'Results are ready.',
                        });
                        const rawMatrix = (result?.data?.matrix ?? result?.data?.data) as PAG_NODE[][] | undefined;
                        if (!rawMatrix) {
                            throw new Error('Background job returned no matrix.');
                        }
                        const causalMatrix = rawMatrix
                            .slice(0, originFieldsLength)
                            .map((row) => row.slice(0, originFieldsLength));
                        const causalPag = resolveCausality(causalMatrix, inputFields);
                        runInAction(() => {
                            this.lastJobResult = { raw: causalMatrix, pag: causalPag };
                            if (this.runningJob?.id === jobId) {
                                this.runningJob = { ...this.runningJob, status: 'done', updatedAt: Date.now() };
                            }
                            this.jobAbortController = null;
                        });
                    } catch (e) {
                        const msg = e instanceof Error ? e.message : String(e);
                        notify({
                            title: 'Causal Discovery Error',
                            type: 'error',
                            content: msg,
                        });
                        runInAction(() => {
                            this.lastJobError = msg;
                            if (this.runningJob?.id === jobId) {
                                this.runningJob = { ...this.runningJob, status: 'failed', updatedAt: Date.now(), error: msg };
                            }
                            this.jobAbortController = null;
                        });
                    }
                })();

                return null;
            } else {
                const res = await fetch(`${this.causalServer}/causal/${algoName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        dataSource,
                        fields: allFields,
                        focusedFields: inputFields.map(f => f.fid),
                        bgKnowledgesPag: assertions,
                        funcDeps: functionalDependencies,
                        params: this.params[algoName],
                    }),
                });
                const text = await res.text();
                let result: unknown;
                try {
                    result = JSON.parse(text);
                } catch {
                    throw new Error(`Non-JSON response (${res.status}). ${text.slice(0, 200)}`);
                }
                const typed = result as { success?: boolean; data?: any; message?: any };
                if (typed.success) {
                    const rawMatrix = typed.data.matrix as PAG_NODE[][];
                    const causalMatrix = rawMatrix
                        .slice(0, originFieldsLength)
                        .map((row) => row.slice(0, originFieldsLength));
                    const causalPag = resolveCausality(causalMatrix, inputFields);
                    causality = { raw: causalMatrix, pag: causalPag };
                } else {
                    throw new Error(typed.message ?? 'Causal service returned success=false');
                }
            }
        } catch (error) {
            notify({
                title: 'Causal Discovery Error',
                type: 'error',
                content: `${error}`,
            });
        } finally {
            runInAction(() => {
                // In async-job mode we already flipped busy=false above.
                this.busy = false;
            });
        }
        return causality;
    }

    public updateConfig(algoName: string, params: typeof this.params[string]): boolean {
        this.algorithm = algoName;
        if (this._algorithm !== null && this._algorithm in this.params) {
            this.params[this._algorithm] = params;
            return true;
        }
        return false;
    }

}
