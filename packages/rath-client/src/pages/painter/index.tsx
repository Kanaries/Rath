import { IFieldMeta, ISemanticType } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { IMutField } from '@kanaries/graphic-walker/dist/interfaces';
import { Specification } from 'visual-insights';
import {
    DefaultButton,
    Slider,
    SwatchColorPicker,
    Pivot,
    PivotItem,
    Icon,
} from '@fluentui/react';
import { toJS } from 'mobx';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import embed, { vega } from 'vega-embed';
import { Item, ScenegraphEvent } from 'vega';
import {
    ArrowPathIcon,
    ArrowUturnLeftIcon,
    DocumentMagnifyingGlassIcon,
    PaintBrushIcon,
    PencilIcon,
} from '@heroicons/react/24/solid';
import { FunnelIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import intl from 'react-intl-universal';
import { IVegaSubset, PAINTER_MODE } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { deepcopy, getRange } from '../../utils';
import { transVegaSubset2Schema } from '../../utils/transform';
import { viewSampling } from '../../lib/stat/sampling';
import Toolbar, { ToolbarItemProps } from '../../components/toolbar';
import { batchMutInCatRange, batchMutInCircle, clearAggregation, debounceShouldNeverBeUsed, labelingData } from './utils';
import EmbedAnalysis from './embedAnalysis';
import { useViewData } from './viewDataHook';
import { COLOR_CELLS, LABEL_FIELD_KEY, LABEL_INDEX } from './constants';
import NeighborAutoLink from './neighborAutoLink';
import EmptyError from './emptyError';
import Operations from './operations';
import CanvasContainer from './canvasContainer';


const MainHeader = styled.div`
    font-size: 1.5em;
    font-weight: 500;
`;

const PainterContainer = styled.div`
    margin-top: 1.5em;
    padding: 1.2em 1em;
    border: 1px solid #f6f6f6;
    display: flex;
    overflow-x: auto;
    background-color: #fffe;
    .vis-segment {
        flex-grow: 1;
    }
    .operation-segment {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

const FormContainer = styled.div`
    margin: 2px;
    border-radius: 1.2px;
    padding: 0.5em;
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
    const [realPainterSize, setRealPainterSize] = useState(0);
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
                setRealPainterSize((res.view as unknown as { _width: number })._width * painterSize);
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
                                r: painterSize / 2,
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
                                r: painterSize / 2,
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
                                r: painterSize / 2,
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

    const currentColor = COLOR_CELLS.find(f => f.id === mutFeatValues[mutFeatIndex])?.color;

    const tools: ToolbarItemProps[] = [
        {
            key: 'clear',
            label: intl.get('painter.clearPainting'),
            icon: ArrowUturnLeftIcon,
            onClick: () => clearPainting(),
        },
        {
            key: 'sync',
            label: intl.get('painter.syncData'),
            icon: ArrowPathIcon,
            onClick: () => setGWTrigger(v => !v),
        },
        '-',
        {
            key: PAINTER_MODE.MOVE,
            label: intl.get(`painter.tools.${PAINTER_MODE.MOVE}`),
            icon: () => <Icon iconName="Move" />,
            checked: painterMode === PAINTER_MODE.MOVE,
            onChange: selected => {
                if (selected) {
                    setPainterMode(PAINTER_MODE.MOVE);
                }
            },
        },
        {
            key: PAINTER_MODE.COLOR,
            label: intl.get(`painter.tools.${PAINTER_MODE.COLOR}`),
            icon: () => <Icon iconName="ColorSolid" style={{ color: painterMode === PAINTER_MODE.COLOR ? currentColor : 'currentColor' }} />,
            checked: painterMode === PAINTER_MODE.COLOR,
            onChange: selected => {
                if (selected) {
                    setPainterMode(PAINTER_MODE.COLOR);
                }
            },
            form: painterMode === PAINTER_MODE.COLOR ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <SwatchColorPicker
                        styles={{ root: { margin: '0.5em 1.2em' } }}
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
                    <DefaultButton
                        styles={{ root: { margin: '4px 8px 8px' } }}
                        onClick={() => setMutFeatValues((v) => [...v, `Label ${v.length + 1}`])}
                        disabled
                    >
                        <PlusCircleIcon width="1.5em" height="1.5em" style={{ marginRight: '0.4em' }} />
                        <span>{intl.get('painter.addLabel')}</span>
                    </DefaultButton>
                </div>
            ) : undefined,
        },
        {
            key: PAINTER_MODE.ERASE,
            label: intl.get(`painter.tools.${PAINTER_MODE.ERASE}`),
            icon: () => <Icon iconName="EraseTool" />,
            checked: painterMode === PAINTER_MODE.ERASE,
            onChange: selected => {
                if (selected) {
                    setPainterMode(PAINTER_MODE.ERASE);
                }
            },
        },
        {
            key: PAINTER_MODE.CREATE,
            label: intl.get(`painter.tools.${PAINTER_MODE.CREATE}`),
            icon: PaintBrushIcon,
            checked: painterMode === PAINTER_MODE.CREATE,
            onChange: selected => {
                if (selected) {
                    setPainterMode(PAINTER_MODE.CREATE);
                }
            },
            disabled: true,
        },
        {
            key: 'paint_size',
            label: intl.get('painter.brushSize'),
            icon: PencilIcon,
            form: (
                <FormContainer>
                    <Slider
                        min={0.01}
                        max={1}
                        step={0.01}
                        value={painterSize}
                        label={intl.get('painter.brushSize')}
                        styles={{ root: { width: '200px' } }}
                        onChange={(s, v) => {
                            setPainterSize(s);
                        }}
                    />
                </FormContainer>
            ),
        },
        '-',
        {
            key: 'sample_rate',
            label: intl.get('painter.samplePercent'),
            icon: FunnelIcon,
            form: (
                <FormContainer>
                    <Slider
                        min={0.01}
                        max={1}
                        step={0.01}
                        value={samplePercent}
                        valueFormat={val => `${Math.floor(val * 100)}%`}
                        label={intl.get('painter.samplePercent')}
                        styles={{ root: { width: '200px' } }}
                        onChange={(s, v) => {
                            setSamplePercent(s);
                        }}
                    />
                </FormContainer>
            ),
        },
        {
            key: 'disable_aggregation',
            label: intl.get('painter.useOriginalDist'),
            icon: DocumentMagnifyingGlassIcon,
            checked: clearAgg,
            onChange: checked => setClearAgg(Boolean(checked)),
        },
    ];

    const [showCursorPreview, setShowCursorPreview] = useState(false);
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
        <div className="content-container">
            <div className="card">
                <MainHeader>
                    {intl.get('menu.painter')}
                </MainHeader>
                <PainterContainer>
                    <div className="vis-segment" onTouchMove={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}>
                        <div className="operation-segment" style={{ marginBottom: '2em' }}>
                            <Toolbar
                                items={tools}
                            />
                        </div>
                        <div>
                            <CanvasContainer
                                showTrack={painterMode === PAINTER_MODE.COLOR || painterMode === PAINTER_MODE.ERASE}
                                color={painterColor}
                                size={realPainterSize}
                                preview={showCursorPreview}
                            >
                                <div ref={container}></div>
                            </CanvasContainer>
                        </div>
                        <Operations />
                    </div>
                </PainterContainer>
                <PainterContainer>
                    <Pivot
                        selectedKey={pivotKey}
                        onLinkClick={(item) => {
                            item && setPivotKey(item.props.itemKey as PIVOT_TAB_KEYS);
                        }}
                    >
                        <PivotItem headerText={intl.get('painter.search')} itemKey={PIVOT_TAB_KEYS.SEARCH} itemIcon="Search">
                            <NeighborAutoLink
                                vizSpec={vizSpec}
                                dataSource={viewData}
                                fieldMetas={fieldMetas}
                            />
                        </PivotItem>
                        <PivotItem
                            headerText={intl.get('painter.explore')}
                            itemKey={PIVOT_TAB_KEYS.EXPLORE}
                            itemIcon="BarChartVerticalEdit"
                        >
                            <EmbedAnalysis dataSource={viewData} spec={walkerSchema} fields={fieldsInWalker} trigger={gwTrigger} i18nLang={langStore.lang} />
                        </PivotItem>
                    </Pivot>
                </PainterContainer>
            </div>
        </div>
    );
};

export default observer(Painter);
