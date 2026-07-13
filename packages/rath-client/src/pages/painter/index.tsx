import { IFieldMeta, ISemanticType } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { IMutField } from '@kanaries/graphic-walker/dist/interfaces';
import { Specification } from 'visual-insights';
import { toJS } from 'mobx';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import embed from 'vega-embed';
import { Item, ScenegraphEvent, renderModule } from 'vega';
import intl from 'react-intl-universal';
//@ts-ignore
import { PainterModule, paint, startPaint, stopPaint } from 'vega-painter-renderer';
import { IVegaSubset, PAINTER_MODE } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { deepcopy, getRange } from '../../utils';
import { cn } from '../../utils/cn';
import { transVegaSubset2Schema } from '../../utils/transform';
import { viewSampling } from '../../lib/stat/sampling';
import { Card } from '../../components/card';
import { RathIcon } from '../../components/icons';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Slider } from '../../components/ui/slider';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { isContinuous, clearAggregation, debounceShouldNeverBeUsed, labelingData, VegaViewChanges, debounce } from './utils';
import EmbedAnalysis from './embedAnalysis';
import { useAppearance } from '../../appearance';
import { getVegaAppearanceConfig, mergeVegaAppearanceConfig } from '../../visualization/appearance';
import { useViewData } from './viewDataHook';
import { COLOR_CELLS, LABEL_FIELD_KEY, LABEL_INDEX, PAINTER_MODE_LIST } from './constants';
import NeighborAutoLink from './neighborAutoLink';
import EmptyError from './emptyError';
import Operations from './operations';
import CanvasContainer from './canvasContainer';

renderModule('painter', PainterModule);

const Cont = styled.div`
    /* cursor: none !important; */
`;

const PainterContainer = styled.div`
    display: flex;
    overflow-x: auto;
    .vis-segment {
        flex-grow: 1;
    }
    .operation-segment {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

enum PIVOT_TAB_KEYS {
    SEARCH = 'Search',
    EXPLORE = 'Explore',
}

const Painter: React.FC = (props) => {
    const { resolvedAppearance } = useAppearance();
    const container = useRef<HTMLDivElement>(null);
    const isPainting = useRef(false);
    const { dataSourceStore, painterStore, langStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { painterView, painterViewData } = painterStore;
    const [mutFeatValues, setMutFeatValues] = useState<string[]>(COLOR_CELLS.map((c) => c.id));
    const [mutFeatIndex, setMutFeatIndex] = useState<number>(1);
    const [painterSize, setPainterSize] = useState<number>(0.1);

    const [samplePercent, setSamplePercent] = useState<number>(1);
    const [painterMode, setPainterMode] = useState<PAINTER_MODE>(PAINTER_MODE.COLOR);
    const [pivotKey, setPivotKey] = useState<PIVOT_TAB_KEYS>(PIVOT_TAB_KEYS.SEARCH);
    const [clearAgg, setClearAgg] = useState<boolean>(false);
    const [gwTrigger, setGWTrigger] = useState<boolean>(false);

    const { viewData, setViewData, maintainViewDataRemove } = useViewData(painterViewData);
    const vizSpec = useMemo(() => {
        if (painterView.spec === null) return null;
        if (!clearAgg) return painterView.spec;
        return clearAggregation(toJS(painterView.spec));
    }, [painterView.spec, clearAgg]);

    const initValue = mutFeatValues[0];

    const painting = painterMode !== PAINTER_MODE.MOVE;

    const fieldsInView = useMemo<IFieldMeta[]>(() => {
        const res: IFieldMeta[] = [];
        if (vizSpec) {
            Object.values(vizSpec.encoding).forEach((ch) => {
                const f = fieldMetas.find((m) => m.fid === ch.field);
                if (f) {
                    res.push(f);
                }
            });
        }
        return res;
    }, [fieldMetas, vizSpec]);

    const spRef = useRef(samplePercent);
    spRef.current = samplePercent;
    const fieldsRef = useRef(fieldsInView);
    fieldsRef.current = fieldsInView;

    const clearPainting = useCallback(() => {
        const size = Math.min(painterViewData.length, Math.round(painterViewData.length * spRef.current));
        const sampleData = viewSampling(labelingData(painterViewData, initValue), fieldsRef.current, size);
        setViewData(sampleData);
    }, [painterViewData, initValue, setViewData]);

    useEffect(() => {
        const size = Math.min(painterViewData.length, Math.round(painterViewData.length * samplePercent));
        const sampleData = viewSampling(painterViewData, fieldsInView, size);
        setViewData(labelingData(sampleData, initValue));
    }, [painterViewData, fieldMetas, initValue, setViewData, samplePercent, fieldsInView]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const linkNearViz = useCallback(
        debounceShouldNeverBeUsed(
            () => {
                painterStore.setPaintingForTrigger(true);
            },
            () => {
                painterStore.pullTrigger();
            },
            800
        ),
        [painterStore]
    );

    const noViz = viewData.length === 0 || fieldMetas.length === 0 || vizSpec === null;
    const axisResizable = painterMode === PAINTER_MODE.MOVE;
    const painterSpec = useMemo<IVegaSubset | null>(() => {
        if (!noViz) {
            const mvd: any = {
                ...deepcopy(vizSpec),
                background: resolvedAppearance === 'dark' ? '#1a1a1a' : '#ffffff',
                data: {
                    name: 'dataSource',
                    // values: mutData
                },
            };
            mvd.config = mergeVegaAppearanceConfig(mvd.config, resolvedAppearance);
            mvd.encoding.color = {
                field: LABEL_FIELD_KEY,
                type: 'nominal',
                title: 'custom feature',
                scale: {
                    domain: mutFeatValues,
                },
            };
            if (axisResizable) {
                if (!(mvd.params instanceof Array)) {
                    mvd.params = [];
                }
                mvd.params.push({
                    name: 'grid',
                    select: 'interval',
                    bind: 'scales',
                });
            }
            return mvd;
        }
        return null;
    }, [vizSpec, mutFeatValues, noViz, axisResizable, resolvedAppearance]);
    const [realPainterSize, setRealPainterSize] = useState(0);
    useEffect(() => {
        if (painterSpec === null || !container.current) return;

        let disposed = false;
        let embeddedResult: Awaited<ReturnType<typeof embed>> | null = null;
        // @ts-ignore
        void embed(container.current, painterSpec, {
            actions: painterMode === PAINTER_MODE.MOVE,
            renderer: 'painter',
            config: getVegaAppearanceConfig(resolvedAppearance),
        })
            .then((res) => {
                if (disposed) {
                    res.view.finalize();
                    return;
                }
                embeddedResult = res;
                const viewChanges = new VegaViewChanges(res.view, 'dataSource', LABEL_INDEX);
                viewChanges
                    .insert(viewData)
                    .runAsync()
                    .then((viewChanges) => {
                        // if (testConfig.printLog) { window.console.log("changes =", changes); }
                    });

                if (!disposed) setRealPainterSize((res.view as unknown as { _width: number })._width * painterSize);
                if (!(painterSpec.encoding.x && painterSpec.encoding.y)) return;

                const xField = painterSpec.encoding.x.field;
                const yField = painterSpec.encoding.y.field;
                const xFieldType = painterSpec.encoding.x.type as ISemanticType;
                const yFieldType = painterSpec.encoding.y.type as ISemanticType;
                const isContX = isContinuous(xFieldType),
                    isContY = isContinuous(yFieldType);
                const limitFields: string[] = [];
                if (painterSpec.encoding.column) limitFields.push(painterSpec.encoding.column.field);
                if (painterSpec.encoding.row) limitFields.push(painterSpec.encoding.row.field);

                const [rotXField, rotYField] = !isContX ? [yField, xField] : [xField, yField];
                const [rotIsContX, rotIsContY] = !isContX ? [isContY, isContX] : [isContX, isContY];
                let hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
                    // window.console.warn('hdr case', [xFieldType, yField], 'not implemented');
                };
                if (rotIsContX && rotIsContY) {
                    const xRange = getRange(viewData.map((r) => r[rotXField]));
                    const yRange = getRange(viewData.map((r) => r[rotYField]));
                    hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // @ts-ignore
                        if (!isPainting.current && e.vegaType !== 'touchmove') return;
                        startPaint(res.view);
                        if (painting && item && item.datum) {
                            let limits: { [key: string]: any } = {};
                            for (let f of limitFields) {
                                limits[f] = item.datum[f];
                            }
                            /** directly setting 'fill' of scenegraph */
                            const result = paint({
                                view: res.view,
                                painterMode,
                                fields: [rotXField, rotYField],
                                point: [item.datum[rotXField], item.datum[rotYField]],
                                radius: painterSize / 2,
                                range: [xRange[1] - xRange[0], yRange[1] - yRange[0]],
                                limits: limits,
                                groupValue: mutFeatValues[mutFeatIndex],
                                indexKey: LABEL_INDEX,
                                newColor: COLOR_CELLS[mutFeatIndex].color,
                            });
                            /** mutIndices: tupleid */
                            const { mutIndices, mutValues, view } = result;
                            res.view = view;
                            if (painterMode === PAINTER_MODE.COLOR) {
                                viewChanges.modify(mutIndices, mutValues);
                            } else if (painterMode === PAINTER_MODE.ERASE) {
                                viewChanges.remove(mutIndices);
                            }
                        }
                    };
                } else if (rotIsContX && !rotIsContY) {
                    const xRange = getRange(viewData.map((r) => r[rotXField]));
                    hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // @ts-ignore
                        if (!isPainting.current && e.vegaType !== 'touchmove') return;
                        startPaint(res.view);
                        if (painting && item && item.datum) {
                            let limits: { [key: string]: any } = {};
                            for (let f of limitFields) {
                                limits[f] = item.datum[f];
                            }
                            const { mutIndices, mutValues, view } = paint({
                                view: res.view,
                                painterMode,
                                fields: [rotXField, rotYField],
                                point: [item.datum[rotXField], item.datum[rotYField]],
                                radius: painterSize / 2,
                                range: xRange[1] - xRange[0],
                                limits: limits,
                                groupValue: mutFeatValues[mutFeatIndex],
                                indexKey: LABEL_INDEX,
                                newColor: COLOR_CELLS[mutFeatIndex].color,
                            });
                            res.view = view;
                            if (painterMode === PAINTER_MODE.COLOR) {
                                viewChanges.modify(mutIndices, mutValues);
                            } else if (painterMode === PAINTER_MODE.ERASE) {
                                viewChanges.remove(mutIndices);
                            }
                        }
                    };
                }
                // else { /** !rotIsContX && !rotIsContY */ }
                res.view.addEventListener('mousedown', (e) => {
                    isPainting.current = true;
                    startPaint(res.view);
                });
                const endup = () => {
                    if (disposed) return;
                    isPainting.current = false;
                    stopPaint(res.view);
                    viewChanges.runAsync().then((removedIds: Set<number>) => {
                        if (disposed) return;
                        linkNearViz();
                        maintainViewDataRemove((r: any) => removedIds.has(r[LABEL_INDEX]));
                    });
                };
                res.view.addEventListener('mouseup', endup);
                res.view.addEventListener('touchend', debounce(endup, 200));
                // TODO: use renderer to check nearest points
                // res.view.addEventListener('gl_mousemove', hdr);
                // res.view.addEventListener('gl_touchmove', hdr);
                res.view.addEventListener('mousemove', hdr);
                res.view.addEventListener('touchmove', hdr);
                res.view.resize();
                res.view.runAsync();
            })
            .catch((error) => {
                if (!disposed) console.error(error);
            });

        return () => {
            disposed = true;
            embeddedResult?.view.finalize();
        };
    }, [viewData, mutFeatValues, mutFeatIndex, painting, painterSize, painterMode, maintainViewDataRemove, linkNearViz, painterSpec, resolvedAppearance]);

    const fieldsInWalker = useMemo<IMutField[]>(() => {
        return fieldMetas
            .map((f) => ({
                fid: f.fid,
                name: f.name,
                semanticType: f.semanticType,
                analyticType: f.analyticType,
            }))
            .concat({
                fid: LABEL_FIELD_KEY,
                name: intl.get('painter.newField'),
                semanticType: 'nominal',
                analyticType: 'dimension',
            });
    }, [fieldMetas]);

    const walkerSchema = useMemo<Specification>(() => {
        if (painterSpec) {
            return transVegaSubset2Schema(painterSpec);
        }
        return {};
    }, [painterSpec]);

    const [showCursorPreview, setShowCursorPreview] = useState(false);

    const currentColor = COLOR_CELLS.find((f) => f.id === mutFeatValues[mutFeatIndex])?.color;
    const painterColor = currentColor && painterMode === PAINTER_MODE.COLOR ? currentColor : '#8888';

    useEffect(() => {
        setRealPainterSize(0);
    }, [painterSize]);

    useEffect(() => {
        setShowCursorPreview(true);
        const timer = setTimeout(() => {
            setShowCursorPreview(false);
        }, 1_000);

        return () => {
            clearTimeout(timer);
        };
    }, [realPainterSize, painterColor]);

    if (noViz) {
        return <EmptyError />;
    }
    return (
        <Cont style={{ padding: '1em' }}>
            <div className="cursor rounded-sm"></div>
            <Card>
                <PainterContainer>
                    <div
                        className="vis-segment"
                        onTouchMove={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                    >
                        <CanvasContainer
                            showTrack={painterMode === PAINTER_MODE.COLOR || painterMode === PAINTER_MODE.ERASE}
                            color={painterColor}
                            size={realPainterSize}
                            preview={showCursorPreview}
                        >
                            <div ref={container}></div>
                        </CanvasContainer>
                        <Operations />
                    </div>
                    <div className="operation-segment">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div>
                                <RadioGroup
                                    value={painterMode}
                                    onValueChange={(value) => {
                                        setPainterMode(value as PAINTER_MODE);
                                    }}
                                >
                                    {PAINTER_MODE_LIST.map((r) => (
                                        <Label
                                            key={r.key}
                                            className={cn(r.disabled && 'opacity-50')}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                        >
                                            <RadioGroupItem value={r.key} disabled={r.disabled} />
                                            <span>{intl.get(`painter.tools.${r.key}`)}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>
                            {painterMode === PAINTER_MODE.COLOR && (
                                <div>
                                    <div className="mx-[1.2em] my-2 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Painter colors">
                                        {COLOR_CELLS.map((cell, index) => {
                                            const selected = mutFeatValues[mutFeatIndex] === cell.id;
                                            return (
                                                <button
                                                    key={cell.id}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={selected}
                                                    className={cn(
                                                        'h-7 w-7 rounded-full border border-border transition-transform focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                                        selected ? 'scale-105 ring-2 ring-ring ring-offset-2' : 'hover:scale-105'
                                                    )}
                                                    style={{ backgroundColor: cell.color }}
                                                    onClick={() => {
                                                        setMutFeatIndex(index);
                                                    }}
                                                >
                                                    <span className="sr-only">{cell.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gap: 8, minWidth: 220 }}>
                                <Label>{intl.get('painter.samplePercent')}</Label>
                                <Slider
                                    min={0.01}
                                    max={1}
                                    step={0.01}
                                    value={[samplePercent]}
                                    onValueChange={([value]) => {
                                        setSamplePercent(value);
                                    }}
                                />
                            </div>
                            <div style={{ display: 'grid', gap: 8, minWidth: 220 }}>
                                <Label>{intl.get('painter.brushSize')}</Label>
                                <Slider
                                    min={0.01}
                                    max={1}
                                    step={0.01}
                                    value={[painterSize]}
                                    onValueChange={([value]) => {
                                        setPainterSize(value);
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Switch
                                    id="painter-use-original-dist"
                                    checked={clearAgg}
                                    onCheckedChange={(checked) => {
                                        setClearAgg(Boolean(checked));
                                    }}
                                />
                                <Label htmlFor="painter-use-original-dist">{intl.get('painter.useOriginalDist')}</Label>
                            </div>
                            {painterMode === PAINTER_MODE.COLOR && (
                                <div>
                                    <Button
                                        variant="outline"
                                        disabled
                                        onClick={() => {
                                            setMutFeatValues((v) => [...v, `Label ${v.length + 1}`]);
                                        }}
                                    >
                                        {intl.get('painter.addLabel')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </PainterContainer>
                <div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button variant="outline" onClick={clearPainting}>
                            <RathIcon name="Trash" />
                            {intl.get('painter.clearPainting')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setGWTrigger((v) => !v);
                            }}
                        >
                            <RathIcon name="Sync" />
                            {intl.get('painter.syncData')}
                        </Button>
                    </div>
                </div>
                <hr style={{ margin: '1em' }} />
                <Tabs value={pivotKey} onValueChange={(value) => setPivotKey(value as PIVOT_TAB_KEYS)} className="mt-4">
                    <TabsList>
                        <TabsTrigger value={PIVOT_TAB_KEYS.SEARCH}>
                            <RathIcon name="Search" className="mr-1" />
                            {intl.get('painter.search')}
                        </TabsTrigger>
                        <TabsTrigger value={PIVOT_TAB_KEYS.EXPLORE}>
                            <RathIcon name="BarChartVerticalEdit" className="mr-1" />
                            {intl.get('painter.explore')}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </Card>
            {pivotKey === PIVOT_TAB_KEYS.SEARCH && <NeighborAutoLink vizSpec={vizSpec} dataSource={viewData} fieldMetas={fieldMetas} />}
            {pivotKey === PIVOT_TAB_KEYS.EXPLORE && (
                <EmbedAnalysis dataSource={viewData} spec={walkerSchema} fields={fieldsInWalker} trigger={gwTrigger} i18nLang={langStore.lang} />
            )}
        </Cont>
    );
};

export default observer(Painter);
