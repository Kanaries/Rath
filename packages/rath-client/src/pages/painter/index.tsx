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
} from '@fluentui/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import embed, { vega } from 'vega-embed';
import { Item, ScenegraphEvent } from 'vega';
import { PAINTER_MODE } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { deepcopy, getRange } from '../../utils';
import { transVegaSubset2Schema } from '../../utils/transform';
import { batchMutInCatRange, batchMutInCircle, debounceShouldNeverBeUsed, labelingData } from './utils';
import EmbedAnalysis from './embedAnalysis';
import { useViewData } from './viewDataHook';
import { viewSampling } from './sample';
import { COLOR_CELLS, LABEL_FIELD_KEY, LABEL_INDEX, PAINTER_MODE_LIST } from './constants';
import NeighborAutoLink from './neighborAutoLink';

const Cont = styled.div`
    /* cursor: none !important; */
`;

const PainterContainer = styled.div`
    display: flex;
    .vis-segment {
        flex-grow: 1;
    }
    .operation-segment {
        flex-grow: 0;
        flex-shrink: 0;
        min-width: 200px;
    }
`;

enum PIVOT_TAB_KEYS {
    SEARCH = 'Search',
    EXPLORE = 'Explore',
}

const Painter: React.FC = (props) => {
    const container = useRef<HTMLDivElement>(null);
    const { dataSourceStore, commonStore, painterStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const { vizSpec } = commonStore;
    const [mutFeatValues, setMutFeatValues] = useState<string[]>(COLOR_CELLS.map((c) => c.id));
    const [mutFeatIndex, setMutFeatIndex] = useState<number>(1);
    const [painterSize, setPainterSize] = useState<number>(0.1);
    const { trigger, viewData, setViewData, maintainViewDataRemove } = useViewData(cleanedData);
    const [samplePercent, setSamplePercent] = useState<number>(1);
    const [painterMode, setPainterMode] = useState<PAINTER_MODE>(PAINTER_MODE.COLOR);
    const [pivotKey, setPivotKey] = useState<PIVOT_TAB_KEYS>(PIVOT_TAB_KEYS.SEARCH);

    const initValue = mutFeatValues[0];

    const painting = painterMode !== PAINTER_MODE.NONE;

    const clearPainting = useCallback(() => {
        setViewData(labelingData(cleanedData, initValue));
    }, [cleanedData, initValue, setViewData]);

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
        const size = Math.min(cleanedData.length, Math.round(cleanedData.length * samplePercent));
        const sampleData = viewSampling(cleanedData, fieldsInView, size);
        setViewData(labelingData(sampleData, initValue));
    }, [cleanedData, fieldMetas, initValue, setViewData, samplePercent, fieldsInView]);

    const linkNearViz = useCallback(debounceShouldNeverBeUsed(() => {
        painterStore.setPaintingForTrigger(true);
    }, () => {
        painterStore.pullTrigger()
    }, 800), [painterStore])

    const noViz = viewData.length === 0 || fieldMetas.length === 0 || vizSpec === null;
    useEffect(() => {
        if (!noViz && container.current) {
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
            if (painterMode === PAINTER_MODE.NONE) {
                if (!(mvd.params instanceof Array)) {
                    mvd.params = [];
                }
                mvd.params.push({
                    name: 'grid',
                    select: 'interval',
                    bind: 'scales',
                });
            }

            // @ts-ignore
            embed(container.current, mvd, {
                actions: painterMode === PAINTER_MODE.NONE,
            }).then((res) => {
                res.view.change(
                    'dataSource',
                    vega
                        .changeset()
                        .remove(() => true)
                        .insert(viewData)
                );
                const xField = mvd.encoding.x.field;
                const yField = mvd.encoding.y.field;
                const xFieldType = mvd.encoding.x.type as ISemanticType;
                const yFieldType = mvd.encoding.y.type as ISemanticType;
                if (xFieldType === 'quantitative' && yFieldType === 'quantitative') {
                    const xRange = getRange(viewData.map((r) => r[xField]));
                    const yRange = getRange(viewData.map((r) => r[yField]));
                    const hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
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
                                painterMode,
                            });
                            if (painterMode === PAINTER_MODE.COLOR) {
                                linkNearViz();
                                // const rd = mutValues.filter(f => Math.random() > 0.7)
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
                                // maintainViewDataChange(viewData.filter(r => !mutIndices.has(r[LABEL_INDEX])))
                            }
                        }
                    };
                    res.view.addEventListener('mouseover', hdr);
                    res.view.addEventListener('touchmove', hdr);
                } else if (xFieldType !== 'quantitative' && yFieldType === 'quantitative') {
                    const yRange = getRange(viewData.map((r) => r[yField]));
                    const hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
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
                            res.view.change(
                                'dataSource',
                                vega
                                    .changeset()
                                    .remove((r: any) => mutIndices.has(r[LABEL_INDEX]))
                                    .insert(mutValues)
                            );
                        }
                    };
                    res.view.addEventListener('mouseover', hdr);
                    res.view.addEventListener('touchmove', hdr);
                } else if (yFieldType !== 'quantitative' && xFieldType === 'quantitative') {
                    const hdr = (e: ScenegraphEvent, item: Item<any> | null | undefined) => {
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
                            res.view.change(
                                'dataSource',
                                vega
                                    .changeset()
                                    .remove((r: any) => mutIndices.has(r[LABEL_INDEX]))
                                    .insert(mutValues)
                            );
                        }
                    };
                    res.view.addEventListener('mouseover', hdr);
                    res.view.addEventListener('touchmove', hdr);
                }
                res.view.resize();
                res.view.runAsync();
            });
        }
    }, [
        noViz,
        vizSpec,
        viewData,
        mutFeatValues,
        mutFeatIndex,
        painting,
        painterSize,
        painterMode,
        maintainViewDataRemove,
        linkNearViz
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
                name: 'new field',
                semanticType: 'nominal',
                analyticType: 'dimension',
            });
    }, [fieldMetas]);

    const walkerSchema = useMemo<Specification>(() => {
        if (vizSpec) {
            return transVegaSubset2Schema(vizSpec);
        }
        return {};
    }, [vizSpec]);

    if (noViz) {
        return <div>404</div>;
    }
    return (
        <Cont style={{ padding: '1em' }}>
            <div className="cursor rounded"></div>
            <div className="card">
                <PainterContainer>
                    <div className="vis-segment">
                        <div ref={container}></div>
                    </div>
                    <div className="operation-segment">
                        <Stack tokens={{ childrenGap: 18 }}>
                            <Stack.Item>
                                <ChoiceGroup
                                    selectedKey={painterMode}
                                    onChange={(e, op) => {
                                        op && setPainterMode(op.key as PAINTER_MODE);
                                    }}
                                    options={PAINTER_MODE_LIST}
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
                                    label="Sample Percent (%)"
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
                                    label="Painter Size"
                                    onChange={(s, v) => {
                                        setPainterSize(s);
                                    }}
                                />
                            </Stack.Item>
                            {painterMode === PAINTER_MODE.COLOR && (
                                <Stack.Item>
                                    <DefaultButton
                                        disabled
                                        text="Add label"
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
                            text="Clear Painting"
                            onClick={clearPainting}
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
                    <PivotItem headerText={PIVOT_TAB_KEYS.SEARCH} itemKey={PIVOT_TAB_KEYS.SEARCH} itemIcon="Search" />
                    <PivotItem
                        headerText={PIVOT_TAB_KEYS.EXPLORE}
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
                <EmbedAnalysis dataSource={viewData} spec={walkerSchema} fields={fieldsInWalker} />
            )}
        </Cont>
    );
};

export default observer(Painter);
