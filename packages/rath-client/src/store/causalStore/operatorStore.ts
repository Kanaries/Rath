import type { IDropdownOption } from "@fluentui/react";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import { nanoid } from "nanoid";
import { distinctUntilChanged, Subject, switchAll } from "rxjs";
import { getGlobalStore } from "..";
import type { IFieldMeta } from "../../interfaces";
import { IAlgoSchema, makeFormInitParams } from "../../pages/causal/config";
import { causalService } from "../../pages/causal/service";
import type { IteratorStorage } from "../../utils/iteStorage";
import type { DataSourceStore } from "../dataSourceStore";
import { connectToSession, fetchCausalAlgorithmList, updateDataSource } from "./service";


export default class CausalOperatorStore {

    public causalServer = (
        decodeURIComponent(new URL(window.location.href).searchParams.get('causalServer') ?? '').replace(/\/$/, '')
        || 'http://gateway.kanaries.cn:2080/causal'
    );

    public busy = false;
    public progress = 0;

    protected _causalAlgorithmForm: IAlgoSchema = {};
    public get causalAlgorithmForm(): IAlgoSchema {
        return this._causalAlgorithmForm;
    }
    public params: { [algo: string]: { [key: string]: any } } = {};
    protected set causalAlgorithmForm(schema: IAlgoSchema) {
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

    public sessionId: string | null = null;
    protected dataId: string = nanoid(12);
    public tableId: string | null = null;

    public get serverActive(): boolean {
        return this.sessionId !== null;
    }

    public readonly destroy: () => void;

    constructor(dataSourceStore: DataSourceStore) {
        const allFields$ = new Subject<IFieldMeta[]>();
        const dynamicFormSchema$ = new Subject<ReturnType<typeof fetchCausalAlgorithmList>>();

        makeAutoObservable(this, {
            destroy: false,
            // @ts-expect-error non-public field
            pendingConnectAction: false,
            dataId: false,
        });

        const mobxReactions = [
            reaction(() => dataSourceStore.fieldMetas, fieldMetas => {
                allFields$.next(fieldMetas);
                // fieldMetas update whenever cleanedData update
                this.updateDataSource();
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
            reaction(() => this.serverActive, ok => {
                if (ok) {
                    dynamicFormSchema$.next(fetchCausalAlgorithmList(dataSourceStore.fieldMetas));
                } else {
                    runInAction(() => {
                        this.causalAlgorithmForm = {};
                    });
                }
            }),
            reaction(() => this.sessionId, sessionId => {
                if (sessionId) {
                    this.updateDataSource();
                }
            }),
            reaction(() => this.busy, () => {
                runInAction(() => {
                    this.progress = 0;
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
                dynamicFormSchema$.next(fetchCausalAlgorithmList(fields));
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
            mobxReactions.forEach(dispose => dispose());
            rxReactions.forEach(subscription => subscription.unsubscribe());
        };
    }

    protected pendingConnectAction: Promise<unknown> | undefined = undefined;

    public async connect(server?: string): Promise<boolean> {
        this.pendingConnectAction = undefined;
        runInAction(() => {
            if (server) {
                this.causalServer = server;
            }
            this.sessionId = null;
            this.tableId = null;
        });
        this.disconnect();
        const connection = connectToSession(reason => {
            console.warn('Causal server session disconnected', reason);
            this.disconnect();
        });
        this.pendingConnectAction = connection;
        const sessionId = await connection;
        if (this.pendingConnectAction !== connection) {
            return false;
        }
        this.pendingConnectAction = undefined;
        if (sessionId) {
            runInAction(() => {
                this.sessionId = sessionId;
                this.tableId = null;
            });
            return true;
        }
        return false;
    }

    public disconnect() {
        this.sessionId = null;
        this.tableId = null;
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

    protected async updateDataSource() {
        const { sample: data, allFields: fields } = getGlobalStore().causalStore.dataset;
        const dataId = nanoid(12);
        this.dataId = dataId;
        const prevTableId = this.tableId;
        runInAction(() => {
            this.tableId = null;
        });
        const tableId = await updateDataSource(data, fields, prevTableId);
        if (tableId && dataId === this.dataId) {
            runInAction(() => {
                this.tableId = tableId;
            });
        }
    }

    public updateConfig(algoName: string, params: typeof this.params[string]): boolean {
        this.algorithm = algoName;
        if (this._algorithm !== null && this._algorithm in this.params) {
            this.params[this._algorithm] = params;
            return true;
        }
        return false;
    }

    public updateTaskProgress(progress: number) {
        if (this.busy) {
            this.progress = progress;
        }
    }

    public toggleRunning() {
        this.busy = !this.busy;
    }

}
