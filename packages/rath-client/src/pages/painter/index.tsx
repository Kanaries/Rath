import { IFieldMeta, ISemanticType } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { IMutField } from '@kanaries/graphic-walker/dist/interfaces';
import { Specification } from 'visual-insights';
import {
    DefaultButton,
    Slider,
    Stack,
    SwatchColorPicker,
    ChoiceGroup,
    Pivot,
    PivotItem,
    Toggle,
} from '@fluentui/react';
import { toJS } from 'mobx';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import embed, { vega } from 'vega-embed';
import { Item, ScenegraphEvent } from 'vega';
import intl from 'react-intl-universal';
import { IVegaSubset, PAINTER_MODE } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { deepcopy, getRange } from '../../utils';
import { transVegaSubset2Schema } from '../../utils/transform';
import { viewSampling } from '../../lib/stat/sampling';
import { batchMutInCatRange, batchMutInCircle, clearAggregation, debounceShouldNeverBeUsed, labelingData } from './utils';
import EmbedAnalysis from './embedAnalysis';
import { useViewData } from './viewDataHook';
import { COLOR_CELLS, LABEL_FIELD_KEY, LABEL_INDEX, PAINTER_MODE_LIST } from './constants';
import NeighborAutoLink from './neighborAutoLink';
import EmptyError from './emptyError';
import Operations from './operations';

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
    const container = useRef<HTMLDivElement>(null);
    const isPainting = useRef(false);
    const { dataSourceStore, painterStore, langStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { painterView, painterViewData } = painterStore
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
    }, [painterView.spec, clearAgg])

    const initValue = mutFeatValues[0];

    const painting = painterMode !== PAINTER_MODE.MOVE;

    const clearPainting = useCallback(() => {
        setViewData(labelingData(painterViewData, initValue));
    }, [painterViewData, initValue, setViewData]);

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

    useEffect(() => {
        const size = Math.min(painterViewData.length, Math.round(painterViewData.length * samplePercent));
        const sampleData = viewSampling(painterViewData, fieldsInView, size);
        setViewData(labelingData(sampleData, initValue));
    }, [painterViewData, fieldMetas, initValue, setViewData, samplePercent, fieldsInView]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const linkNearViz = useCallback(debounceShouldNeverBeUsed(() => {
        painterStore.setPaintingForTrigger(true);
    }, () => {
        painterStore.pullTrigger()
    }, 800), [painterStore])

    const noViz = viewData.length === 0 || fieldMetas.length === 0 || vizSpec === null;
    const painterSpec = useMemo<IVegaSubset | null>(() => {
        if (!noViz) {
            const mvd: any = {
                ...deepcopy(vizSpec),
                data: {
                    name: 'dataSource',
                    // values: mutData
                },
            };
            mvd.encoding.color = {
                field: LABEL_FIELD_KEY,
                type: 'nominal',
                title: 'custom feature',
                scale: {
                    domain: mutFeatValues,
                },
            };
            if (painterMode === PAINTER_MODE.MOVE) {
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
    }, [vizSpec, mutFeatValues, noViz, painterMode]);
    useEffect(() => {
        if (painterSpec !== null && container.current) {

            // @ts-ignore
            embed(container.current, painterSpec, {
                actions: painterMode === PAINTER_MODE.MOVE,
            }).then((res) => {
                res.view.change(
                    'dataSource',
                    vega
                        .changeset()
                        .remove(() => true)
                        .insert(viewData)
                );
                if (!(painterSpec.encoding.x && painterSpec.encoding.y)) return;
                const xField = painterSpec.encoding.x.field;
                const yField = painterSpec.encoding.y.field;
                const xFieldType = painterSpec.encoding.x.type as ISemanticType;
                const yFieldType = painterSpec.encoding.y.type as ISemanticType;
                const limitFields: string[] = [];
                if (painterSpec.encoding.column) limitFields.push(painterSpec.encoding.column.field);
                if (painterSpec.encoding.row) limitFields.push(painterSpec.encoding.row.field);
                if (xFieldType === 'quantitative' && yFieldType === 'quantitative') {
                    const xRange = getRange(viewData.map((r) => r[xField]));
                    const yRange = getRange(viewData.map((r) => r[yField]));
                    const hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // @ts-ignore
                        if (!isPainting.current && e.vegaType !== 'touchmove') return;
                        if (painting && item && item.datum) {
                            const { mutIndices, mutValues } = batchMutInCircle({
                                mutData: viewData,
                                fields: [xField, yField],
                                point: [item.datum[xField], item.datum[yField]],
                                a: xRange[1] - xRange[0],
                                b: yRange[1] - yRange[0],
                                r: painterSize,
                                key: LABEL_FIELD_KEY,
                                indexKey: LABEL_INDEX,
                                value: mutFeatValues[mutFeatIndex],
                                datum: item.datum,
                                painterMode,
                                limitFields
                            });
                            if (painterMode === PAINTER_MODE.COLOR) {
                                linkNearViz();
                                res.view
                                    .change(
                                        'dataSource',
                                        vega
                                            .changeset()
                                            .remove((r: any) => mutIndices.has(r[LABEL_INDEX]))
                                            .insert(mutValues)
                                    )
                                    .runAsync();
                            } else if (painterMode === PAINTER_MODE.ERASE) {
                                res.view
                                    .change(
                                        'dataSource',
                                        vega.changeset().remove((r: any) => mutIndices.has(r[LABEL_INDEX]))
                                    )
                                    .runAsync();
                                maintainViewDataRemove((r: any) => mutIndices.has(r[LABEL_INDEX]));
                            }
                        }
                    };
                    res.view.addEventListener('mousedown', () => {
                        isPainting.current = true;
                    });
                    res.view.addEventListener('mouseup', () => {
                        isPainting.current = false;
                    });
                    res.view.addEventListener('mousemove', hdr);
                    res.view.addEventListener('touchmove', hdr);
                } else if (xFieldType !== 'quantitative' && yFieldType === 'quantitative') {
                    const yRange = getRange(viewData.map((r) => r[yField]));
                    const hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // @ts-ignore
                        if (!isPainting.current && e.vegaType !== 'touchmove') return;
                        if (painting && item && item.datum) {
                            const { mutIndices, mutValues } = batchMutInCatRange({
                                mutData: viewData,
                                fields: [xField, yField],
                                point: [item.datum[xField], item.datum[yField]],
                                r: painterSize,
                                key: LABEL_FIELD_KEY,
                                range: yRange[1] - yRange[0],
                                indexKey: LABEL_INDEX,
                                value: mutFeatValues[mutFeatIndex],
                            });
                            if (painterMode === PAINTER_MODE.COLOR) {
                                linkNearViz();
                                res.view
                                    .change(
                                        'dataSource',
                                        vega
                                            .changeset()
                                            .remove((r: any) => mutIndices.has(r[LABEL_INDEX]))
                                            .insert(mutValues)
                                    )
                                    .runAsync();
                            } else if (painterMode === PAINTER_MODE.ERASE) {
                                res.view
                                    .change(
                                        'dataSource',
                                        vega.changeset().remove((r: any) => mutIndices.has(r[LABEL_INDEX]))
                                    )
                                    .runAsync();
                                maintainViewDataRemove((r: any) => mutIndices.has(r[LABEL_INDEX]));
                            }
                        }
                    };
                    res.view.addEventListener('mousedown', () => {
                        isPainting.current = true;
                    });
                    res.view.addEventListener('mouseup', () => {
                        isPainting.current = false;
                    });
                    res.view.addEventListener('mousemove', hdr);
                    res.view.addEventListener('touchmove', hdr);
                } else if (yFieldType !== 'quantitative' && xFieldType === 'quantitative') {
                    const hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // @ts-ignore
                        if (!isPainting.current && e.vegaType !== 'touchmove') return;
                        if (painting && item && item.datum) {
                            const xRange = getRange(viewData.map((r) => r[xField]));
                            const { mutIndices, mutValues } = batchMutInCatRange({
                                mutData: viewData,
                                fields: [yField, xField],
                                point: [item.datum[yField], item.datum[xField]],
                                r: painterSize,
                                range: xRange[1] - xRange[0],
                                key: LABEL_FIELD_KEY,
                                indexKey: LABEL_INDEX,
                                value: mutFeatValues[mutFeatIndex],
                            });
                            if (painterMode === PAINTER_MODE.COLOR) {
                                linkNearViz();
                                res.view
                                    .change(
                                        'dataSource',
                                        vega
                                            .changeset()
                                            .remove((r: any) => mutIndices.has(r[LABEL_INDEX]))
                                            .insert(mutValues)
                                    )
                                    .runAsync();
                            } else if (painterMode === PAINTER_MODE.ERASE) {
                                res.view
                                    .change(
                                        'dataSource',
                                        vega.changeset().remove((r: any) => mutIndices.has(r[LABEL_INDEX]))
                                    )
                                    .runAsync();
                                maintainViewDataRemove((r: any) => mutIndices.has(r[LABEL_INDEX]));
                            }
                        }
                    };
                    res.view.addEventListener('mousedown', () => {
                        isPainting.current = true;
                    });
                    res.view.addEventListener('mouseup', () => {
                        isPainting.current = false;
                    });
                    res.view.addEventListener('mousemove', hdr);
                    res.view.addEventListener('touchmove', hdr);
                }
                res.view.resize();
                res.view.runAsync();
            });
        }
    }, [
        viewData,
        mutFeatValues,
        mutFeatIndex,
        painting,
        painterSize,
        painterMode,
        maintainViewDataRemove,
        linkNearViz,
        painterSpec
    ]);

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

    if (noViz) {
        return <EmptyError />;
    }
    return (
        <Cont style={{ padding: '1em' }}>
            <div className="cursor rounded"></div>
            <div className="card">
                <PainterContainer>
                    <div className="vis-segment" onTouchMove={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}>
                        <div ref={container}></div>
                        <Operations />
                    </div>
                    <div className="operation-segment">
                        <Stack tokens={{ childrenGap: 18 }}>
                            <Stack.Item>
                                <ChoiceGroup
                                    selectedKey={painterMode}
                                    onChange={(e, op) => {
                                        op && setPainterMode(op.key as PAINTER_MODE);
                                    }}
                                    options={PAINTER_MODE_LIST.map(r => ({
                                        ...r,
                                        text: intl.get(`painter.tools.${r.key}`)
                                    }))}
                                />
                            </Stack.Item>
                            {painterMode === PAINTER_MODE.COLOR && (
                                <Stack.Item>
                                    <SwatchColorPicker
                                        selectedId={mutFeatValues[mutFeatIndex]}
                                        columnCount={5}
                                        cellShape={'circle'}
                                        colorCells={COLOR_CELLS}
                                        onChange={(e, id) => {
                                            if (id) {
                                                const targetIndex = COLOR_CELLS.findIndex((f) => f.id === id);
                                                targetIndex > -1 && setMutFeatIndex(targetIndex);
                                            }
                                        }}
                                    />
                                </Stack.Item>
                            )}
                            <Stack.Item>
                                <Slider
                                    min={0.01}
                                    max={1}
                                    step={0.01}
                                    value={samplePercent}
                                    label={intl.get('painter.samplePercent')}
                                    onChange={(s, v) => {
                                        setSamplePercent(s);
                                    }}
                                />
                            </Stack.Item>
                            <Stack.Item>
                                <Slider
                                    min={0.01}
                                    max={1}
                                    step={0.01}
                                    value={painterSize}
                                    label={intl.get('painter.brushSize')}
                                    onChange={(s, v) => {
                                        setPainterSize(s);
                                    }}
                                />
                            </Stack.Item>
                            <Stack.Item>
                                <Toggle label={intl.get('painter.useOriginalDist')} inlineLabel checked={clearAgg} onChange={(e, checked) => {
                                    setClearAgg(Boolean(checked))
                                }} />
                            </Stack.Item>
                            {painterMode === PAINTER_MODE.COLOR && (
                                <Stack.Item>
                                    <DefaultButton
                                        disabled
                                        text={intl.get('painter.addLabel')}
                                        onClick={() => {
                                            setMutFeatValues((v) => [...v, `Label ${v.length + 1}`]);
                                        }}
                                    />
                                </Stack.Item>
                            )}
                        </Stack>
                    </div>
                </PainterContainer>
                <div>
                    <Stack horizontal tokens={{ childrenGap: 10 }}>
                        <DefaultButton
                            iconProps={{ iconName: 'Trash' }}
                            text={intl.get('painter.clearPainting')}
                            onClick={clearPainting}
                        />
                        <DefaultButton
                            iconProps={{ iconName: 'Sync' }}
                            text={intl.get('painter.syncData')}
                            onClick={() => {
                                setGWTrigger(v => !v)
                            }}
                        />
                    </Stack>
                </div>
                <hr style={{ margin: '1em' }} />
                <Pivot
                    selectedKey={pivotKey}
                    onLinkClick={(item) => {
                        item && setPivotKey(item.props.itemKey as PIVOT_TAB_KEYS);
                    }}
                    style={{ marginTop: '1em' }}
                >
                    <PivotItem headerText={intl.get('painter.search')} itemKey={PIVOT_TAB_KEYS.SEARCH} itemIcon="Search" />
                    <PivotItem
                        headerText={intl.get('painter.explore')}
                        itemKey={PIVOT_TAB_KEYS.EXPLORE}
                        itemIcon="BarChartVerticalEdit"
                    />
                </Pivot>
            </div>
            {pivotKey === PIVOT_TAB_KEYS.SEARCH && <NeighborAutoLink
                vizSpec={vizSpec}
                dataSource={viewData}
                fieldMetas={fieldMetas}
            />}
            {pivotKey === PIVOT_TAB_KEYS.EXPLORE && (
                <EmbedAnalysis dataSource={viewData} spec={walkerSchema} fields={fieldsInWalker} trigger={gwTrigger} i18nLang={langStore.lang} />
            )}
        </Cont>
    );
};

export default observer(Painter);
