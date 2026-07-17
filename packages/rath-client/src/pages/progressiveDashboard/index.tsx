import React, { useCallback, useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import produce from 'immer';
import ReactVega from '../../components/react-vega';
import { IFieldMeta, IRow } from '../../interfaces';
import { distVis } from '../../queries/distVis';
import { useGlobalStore } from '../../store';
import { loaEngineService } from '../../services/index';
import { PIVOT_KEYS } from '../../constants';
import { RathIcon } from '../../components/icons';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Spinner } from '../../components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { RathSelect, RathSelectOption } from '../../components/rath-ui/rath-select';
import {
    createInitialViews,
    createWildcardView,
    IDashView,
    IViewRecommendation,
    recommendDashboard,
} from './autoDash';

/** 关系矩阵计算的采样上限：矩阵只用于排序推荐，采样后精度足够，速度可控 */
const MATRIX_SAMPLE_SIZE = 2000;

function sampleRows(rows: IRow[], cap: number): IRow[] {
    if (rows.length <= cap) return rows;
    const step = rows.length / cap;
    const ans: IRow[] = [];
    for (let i = 0; i < cap; i++) {
        ans.push(rows[Math.floor(i * step)]);
    }
    return ans;
}

function fieldName(field: IFieldMeta | undefined): string {
    if (!field) return '';
    return field.name || field.fid;
}

interface IViewCardProps {
    view: IDashView;
    rec: IViewRecommendation | undefined;
    metas: IFieldMeta[];
    themeConfig: any;
    dataSource: IRow[];
    editing: boolean;
    onToggleLock: (viewId: string) => void;
    onShuffle: (viewId: string) => void;
    onToggleEdit: (viewId: string) => void;
    onDelete: (viewId: string) => void;
    onChangeSlot: (viewId: string, slotIndex: number, fieldKey: string) => void;
    onRemoveSlot: (viewId: string, slotIndex: number) => void;
    onAddSlot: (viewId: string) => void;
}

const ViewCard: React.FC<IViewCardProps> = (props) => {
    const { view, rec, metas, themeConfig, dataSource, editing } = props;
    const { onToggleLock, onShuffle, onToggleEdit, onDelete, onChangeSlot, onRemoveSlot, onAddSlot } = props;

    const slotOptions = useMemo<RathSelectOption[]>(
        () =>
            [{ key: '*', text: intl.get('dashboardDesigner.autoOption') } as RathSelectOption].concat(
                metas.map((fm) => ({ key: fm.fid, text: fieldName(fm) }))
            ),
        [metas]
    );

    const autoFilledFields = useMemo(
        () => (rec ? rec.fields.filter((f) => rec.reasons.has(f.fid)) : []),
        [rec]
    );

    const spec = useMemo(() => {
        if (!rec || rec.fields.length === 0) return null;
        return distVis({
            pattern: { fields: rec.fields, imp: rec.quality },
        });
    }, [rec]);

    // 第 k 个占位符对应第 k 个自动补全的字段
    let wildcardCursor = -1;

    return (
        <Card className="flex flex-col p-3">
            <div className="flex items-center gap-2">
                <Badge variant={view.locked ? 'default' : 'secondary'}>
                    {intl.get(view.locked ? 'dashboardDesigner.status.pinned' : 'dashboardDesigner.status.suggested')}
                </Badge>
                {rec && rec.quality > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {intl.get('dashboardDesigner.quality')} {rec.quality.toFixed(2)}
                    </span>
                )}
                <div className="ml-auto flex items-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={intl.get(view.locked ? 'dashboardDesigner.actions.unpin' : 'dashboardDesigner.actions.pin')}
                                aria-pressed={view.locked}
                                onClick={() => onToggleLock(view.id)}
                            >
                                <RathIcon name={view.locked ? 'PinSolid12' : 'Pin'} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {intl.get(view.locked ? 'dashboardDesigner.actions.unpin' : 'dashboardDesigner.actions.pin')}
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={intl.get('dashboardDesigner.actions.shuffle')}
                                disabled={view.locked || !rec}
                                onClick={() => onShuffle(view.id)}
                            >
                                <RathIcon name="Refresh" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{intl.get('dashboardDesigner.actions.shuffle')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={intl.get('dashboardDesigner.actions.edit')}
                                aria-pressed={editing}
                                onClick={() => onToggleEdit(view.id)}
                            >
                                <RathIcon name="Settings" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{intl.get('dashboardDesigner.actions.edit')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={intl.get('dashboardDesigner.actions.delete')}
                                onClick={() => onDelete(view.id)}
                            >
                                <RathIcon name="Delete" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{intl.get('dashboardDesigner.actions.delete')}</TooltipContent>
                    </Tooltip>
                </div>
            </div>
            <div className="mt-2 max-h-[320px] flex-1 overflow-auto">
                {!rec && <Skeleton className="h-[200px] w-full" />}
                {rec && spec && <ReactVega dataSource={dataSource} spec={spec} config={themeConfig} />}
                {rec && !spec && (
                    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                        {intl.get('dashboardDesigner.emptyView')}
                    </div>
                )}
            </div>
            {rec && (autoFilledFields.length > 0 || rec.unfilled > 0) && (
                <div className="mt-2 space-y-1 border-t pt-2">
                    {autoFilledFields.map((f) => {
                        const reason = rec.reasons.get(f.fid)!;
                        const anchor = metas.find((m) => m.fid === reason.anchorFid);
                        return (
                            <div key={f.fid} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <RathIcon name="AutoEnhanceOn" size={12} className="shrink-0 text-primary" />
                                <span>
                                    {intl.get('dashboardDesigner.reason', {
                                        field: fieldName(f),
                                        anchor: fieldName(anchor),
                                        score: reason.score.toFixed(2),
                                    })}
                                </span>
                            </div>
                        );
                    })}
                    {rec.unfilled > 0 && (
                        <div className="text-xs text-muted-foreground">
                            {intl.get('dashboardDesigner.unfilled', { count: rec.unfilled })}
                        </div>
                    )}
                </div>
            )}
            {editing && (
                <div className="mt-2 space-y-2 border-t pt-2">
                    {view.fields.map((slot, slotIndex) => {
                        const selectedKey = slot === '*' ? '*' : slot.fid;
                        if (slot === '*') wildcardCursor += 1;
                        const resolvedField = slot === '*' ? autoFilledFields[wildcardCursor] : undefined;
                        return (
                            <div key={slotIndex} className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={intl.get('dashboardDesigner.actions.removeField')}
                                    disabled={view.fields.length <= 1}
                                    onClick={() => onRemoveSlot(view.id, slotIndex)}
                                >
                                    <RathIcon name="Delete" />
                                </Button>
                                <RathSelect
                                    className="min-w-[180px]"
                                    ariaLabel={intl.get('dashboardDesigner.fieldSlot', { index: slotIndex + 1 })}
                                    options={slotOptions}
                                    selectedKey={selectedKey}
                                    onChange={(key) => onChangeSlot(view.id, slotIndex, String(key))}
                                />
                                {resolvedField && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-muted-foreground"
                                                onClick={() => onChangeSlot(view.id, slotIndex, resolvedField.fid)}
                                            >
                                                → {fieldName(resolvedField)}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{intl.get('dashboardDesigner.actions.adopt')}</TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        );
                    })}
                    <Button variant="outline" size="sm" onClick={() => onAddSlot(view.id)}>
                        <RathIcon name="Add" />
                        {intl.get('dashboardDesigner.actions.addField')}
                    </Button>
                </div>
            )}
        </Card>
    );
};

const ProgressiveDashboard: React.FC = () => {
    const { dataSourceStore, commonStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;

    const metas = useMemo<IFieldMeta[]>(() => toJS(fieldMetas), [fieldMetas]);
    const datasetKey = useMemo(
        () => `${cleanedData.length}::${metas.map((f) => f.fid).join(',')}`,
        [cleanedData, metas]
    );

    const [views, setViews] = useState<IDashView[]>([]);
    const [matrixState, setMatrixState] = useState<{ key: string; matrix: number[][] } | null>(null);
    const [computing, setComputing] = useState(false);
    const [editingViewId, setEditingViewId] = useState<string | null>(null);

    const resetViews = useCallback(() => {
        const seed = metas.find((f) => f.analyticType === 'measure') || metas[0];
        setViews(createInitialViews(seed));
        setEditingViewId(null);
    }, [metas]);

    // 数据集或字段集合变化时，重建画布
    useEffect(() => {
        if (metas.length === 0) {
            setViews([]);
            return;
        }
        resetViews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datasetKey]);

    // 关系矩阵只依赖数据和字段，在 worker 中计算一次，之后所有交互都是主线程上的矩阵检索
    useEffect(() => {
        if (cleanedData.length === 0 || metas.length === 0) {
            setMatrixState(null);
            return;
        }
        let cancelled = false;
        setComputing(true);
        const rows = sampleRows(toJS(cleanedData), MATRIX_SAMPLE_SIZE);
        loaEngineService<number[][]>({
            task: 'relationMatrix',
            dataSource: rows,
            fields: metas,
        })
            .then((matrix) => {
                if (!cancelled) {
                    setMatrixState({ key: datasetKey, matrix });
                }
            })
            .catch((error) => {
                console.error('[dashboardDesigner] relation matrix failed', error);
                if (!cancelled) setMatrixState(null);
            })
            .finally(() => {
                if (!cancelled) setComputing(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datasetKey]);

    const recommendations = useMemo<IViewRecommendation[] | null>(() => {
        if (!matrixState || matrixState.key !== datasetKey || metas.length === 0) return null;
        return recommendDashboard({ fields: metas, matrix: matrixState.matrix, views });
    }, [matrixState, datasetKey, metas, views]);

    const recOf = useCallback(
        (viewId: string) => recommendations?.find((r) => r.viewId === viewId),
        [recommendations]
    );

    const toggleLock = useCallback(
        (viewId: string) => {
            setViews((vs) =>
                produce(vs, (draft) => {
                    const v = draft.find((d) => d.id === viewId);
                    if (!v) return;
                    if (v.locked) {
                        v.locked = false;
                        if (v.prevFields) {
                            v.fields = v.prevFields;
                            v.prevFields = undefined;
                        }
                    } else {
                        const rec = recOf(viewId);
                        if (rec && rec.fields.length > 0) {
                            v.prevFields = v.fields;
                            v.fields = rec.fields;
                            v.locked = true;
                        }
                    }
                })
            );
        },
        [recOf]
    );

    const shuffleView = useCallback((viewId: string) => {
        setViews((vs) =>
            produce(vs, (draft) => {
                const v = draft.find((d) => d.id === viewId);
                if (v) v.shuffleOffset += 1;
            })
        );
    }, []);

    const deleteView = useCallback((viewId: string) => {
        setViews((vs) => vs.filter((v) => v.id !== viewId));
        setEditingViewId((id) => (id === viewId ? null : id));
    }, []);

    const addView = useCallback(() => {
        setViews((vs) => [...vs, createWildcardView()]);
    }, []);

    const toggleEdit = useCallback((viewId: string) => {
        setEditingViewId((id) => (id === viewId ? null : viewId));
    }, []);

    const changeSlot = useCallback(
        (viewId: string, slotIndex: number, fieldKey: string) => {
            setViews((vs) =>
                produce(vs, (draft) => {
                    const v = draft.find((d) => d.id === viewId);
                    if (!v) return;
                    if (fieldKey === '*') {
                        v.fields[slotIndex] = '*';
                        return;
                    }
                    const field = metas.find((f) => f.fid === fieldKey);
                    if (!field) return;
                    const duplicated = v.fields.some(
                        (f, i) => i !== slotIndex && f !== '*' && f.fid === fieldKey
                    );
                    if (duplicated) return;
                    v.fields[slotIndex] = field;
                    // 用户手动改字段后重新从最优推荐开始
                    v.shuffleOffset = 0;
                })
            );
        },
        [metas]
    );

    const removeSlot = useCallback((viewId: string, slotIndex: number) => {
        setViews((vs) =>
            produce(vs, (draft) => {
                const v = draft.find((d) => d.id === viewId);
                if (v && v.fields.length > 1) {
                    v.fields.splice(slotIndex, 1);
                }
            })
        );
    }, []);

    const addSlot = useCallback((viewId: string) => {
        setViews((vs) =>
            produce(vs, (draft) => {
                const v = draft.find((d) => d.id === viewId);
                if (v) v.fields.push('*');
            })
        );
    }, []);

    const acceptAll = useCallback(() => {
        setViews((vs) =>
            produce(vs, (draft) => {
                for (const v of draft) {
                    if (v.locked) continue;
                    const rec = recommendations?.find((r) => r.viewId === v.id);
                    if (rec && rec.fields.length > 0) {
                        v.prevFields = v.fields;
                        v.fields = rec.fields;
                        v.locked = true;
                    }
                }
            })
        );
    }, [recommendations]);

    if (cleanedData.length === 0 || metas.length === 0) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Card className="flex max-w-md flex-col items-center gap-3 p-8 text-center">
                    <RathIcon name="Lightbulb" size={32} className="text-primary" />
                    <h2 className="text-lg font-semibold">{intl.get('dashboardDesigner.empty.title')}</h2>
                    <p className="text-sm text-muted-foreground">{intl.get('dashboardDesigner.empty.desc')}</p>
                    <Button onClick={() => commonStore.setAppKey(PIVOT_KEYS.dataSource)}>
                        {intl.get('dashboardDesigner.empty.goConnect')}
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="p-4">
                <header className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="mr-auto">
                        <h1 className="text-xl font-semibold">{intl.get('dashboardDesigner.title')}</h1>
                        <p className="text-sm text-muted-foreground">{intl.get('dashboardDesigner.desc')}</p>
                    </div>
                    {computing && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Spinner className="h-4 w-4" />
                            {intl.get('dashboardDesigner.computing')}
                        </span>
                    )}
                    <Button variant="outline" disabled={!recommendations} onClick={acceptAll}>
                        <RathIcon name="Pin" />
                        {intl.get('dashboardDesigner.actions.acceptAll')}
                    </Button>
                    <Button variant="outline" onClick={resetViews}>
                        <RathIcon name="Sync" />
                        {intl.get('dashboardDesigner.actions.reset')}
                    </Button>
                    <Button onClick={addView}>
                        <RathIcon name="ReportAdd" />
                        {intl.get('dashboardDesigner.actions.addView')}
                    </Button>
                </header>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {views.map((view) => (
                        <ViewCard
                            key={view.id}
                            view={view}
                            rec={recOf(view.id)}
                            metas={metas}
                            themeConfig={commonStore.themeConfig}
                            dataSource={cleanedData}
                            editing={editingViewId === view.id}
                            onToggleLock={toggleLock}
                            onShuffle={shuffleView}
                            onToggleEdit={toggleEdit}
                            onDelete={deleteView}
                            onChangeSlot={changeSlot}
                            onRemoveSlot={removeSlot}
                            onAddSlot={addSlot}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={addView}
                        className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                        <RathIcon name="Add" className="mr-1.5" />
                        {intl.get('dashboardDesigner.actions.addView')}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default observer(ProgressiveDashboard);
