import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IFilter, IPattern } from '../../dev';
import { useGlobalStore } from '../../store';
import { distVis } from '../../queries/distVis'
import ReactVega from '../../components/react-vega';
import { DefaultButton, Stack, PrimaryButton, ActionButton, CommandButton, Spinner } from 'office-ui-fabric-react';
import { AssoContainer, LoadingLayer, MainViewContainer } from './components';
import ViewField from '../megaAutomation/vizOperation/viewField';
import { IFieldMeta, IResizeMode, IRow } from '../../interfaces';
import { footmanEngineService } from '../../service';
import Settings from './settings';
import { labDistVis } from '../../queries/labdistVis';
import { notify } from '../../components/error';
import intl from 'react-intl-universal';
import MainCanvas from './mainCanvas';
import produce from 'immer';

const BUTTON_STYLE = { marginRight: '1em' }

function applyFilter (dataSource: IRow[], filters?: IFilter[]): IRow[] {
    if (!filters || filters.length === 0) return dataSource;
    return dataSource.filter(row => {
        return filters.every(f => f.values.includes(row[f.field.fid]))
    })
}

const RENDER_BATCH_SIZE = 5;

const PatternPage: React.FC = props => {
    const { dataSourceStore, discoveryMainStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const [views, setViews] = useState<IPattern[]>([])
    const [images, setImages] = useState<string[]>([]);
    const [assoViews, setAssoViews] = useState<{
        patterns: IPattern[];
        features: IPattern[];
        filters: IPattern[];
    }>({
        patterns: [],
        features: [],
        filters: []
    });
    const [pined, setPined] = useState<IPattern | null>(null);
    const [computing, setComputing] = useState<boolean>(false);
    const [renderAmount, setRenderAmount] = useState<number>(RENDER_BATCH_SIZE);
    const [mergeView, setMergeView] = useState<IPattern | null>(null);
    const { mainVizSetting } = discoveryMainStore;

    useEffect(() => {
        // core.init(cleanedData, fieldMetas)
        footmanEngineService({
            dataSource: cleanedData,
            fields: fieldMetas,
            task: 'univar',
        }, 'local').then(res => {
            setViews(res);
            // setAssoViews(views => {
            //     const nextViews = produce(views, draft => {
            //         draft.patterns = res;
            //     })
            //     return nextViews;
            // })
        }).catch(console.error)
        // const patterns = core.searchPatterns();
        // setViews(patterns);
    }, [fieldMetas, cleanedData])

    const specs = useMemo(() => {
        return views.map(view => distVis({ pattern: view }))
    }, [views])

    useEffect(() => {
        footmanEngineService({
            dataSource: cleanedData,
            fields: fieldMetas,
            task: 'render',
            props: views
        }, 'local').then(res => {
            // setAssoViews()
            setImages(res);
        }).catch(console.error);
    }, [views, cleanedData, fieldMetas])

    console.log('pattern render')

    // const 

    const assViews = useCallback((view: IPattern) => {
        setComputing(true)
        footmanEngineService({
            dataSource: cleanedData,
            fields: fieldMetas,
            task: 'patterns',
            props: view
        }).then(res => {
            setViews(res);
            setComputing(false)
            setRenderAmount(RENDER_BATCH_SIZE)
        }).catch(err => {
            console.error(err)
            setComputing(false)
        });
    }, [fieldMetas, cleanedData])

    const adviceCompareFeature = useCallback(() => {
        if (pined === null || mergeView === null) return;
        // footmanEngineService({
        //     dataSource: cleanedData,
        //     fields: fieldMetas,
        //     task: 'featureSelection',
        //     props: 
        // })
        footmanEngineService({
            dataSource: cleanedData,
            fields: fieldMetas,
            task: 'comparison',
            props: [pined, mergeView]
        }).then(res => {
            if (res !== null) {
                setViews([
                    {
                        ...pined,
                        fields: [...pined.fields, ...res.features]
                    },
                    {
                        ...mergeView,
                        fields: [...mergeView.fields, ...res.features]
                    },
                ])
            }
        }).catch(err => {
            notify({
                title: 'comparsion error',
                type: 'error',
                content: `${err}`
            })
        })
    }, [pined, mergeView, cleanedData, fieldMetas])

    const advicePureFeature = useCallback(() => {
        if (pined === null) return;
        footmanEngineService({
            dataSource: cleanedData,
            fields: fieldMetas,
            task: 'featureSelection',
            props: pined
        }).then(ans => {
            setViews(ans)
            setRenderAmount(RENDER_BATCH_SIZE)
        }).catch(console.error);
    }, [pined, cleanedData, fieldMetas])

    const removeFromPined = useCallback((fid: string) => {
        if (pined === null) return;
        const fields: IFieldMeta[] = [...pined.fields];
        const targetIndex = fields.findIndex(f => f.fid === fid);
        if (targetIndex > -1) {
            fields.splice(targetIndex, 1)
            setPined({
                ...pined,
                fields: fields
            })
        }
    }, [pined])

    const recommandFilter = useCallback(() => {
        if (pined === null) return;
        footmanEngineService({
            task: 'filterSelection',
            fields: fieldMetas,
            dataSource: cleanedData,
            props: pined
        }).then(res => {
            setViews(res);
            setRenderAmount(RENDER_BATCH_SIZE)
        }).catch(console.error);

    }, [cleanedData, fieldMetas, pined])

    const removePinedFilter = useCallback((filterField: IFieldMeta) => {
        setPined(p => {
            if (!p?.filters) return p;
            return {
                ...p,
                filters: p.filters.filter(f => f.field.fid !== filterField.fid)
            }
        })
    }, [])

    useEffect(() => {
        if (pined) {
            assViews(pined)
            setRenderAmount(RENDER_BATCH_SIZE)
        }
    }, [pined, assViews])

    // const 

    const vizRecSys = discoveryMainStore.settings.vizAlgo;

    return <div className="content-container">
        <Settings />
        <div className="card">
            { computing && 'yes' }
            <ActionButton
                style={{ float: 'right' }}
                iconProps={{ iconName: 'Settings' }}
                ariaLabel={intl.get('common.settings')}
                title={intl.get('common.settings')}
                text={intl.get('common.settings')}
                onClick={() => {
                    discoveryMainStore.setShowSettings(true);
                }}
            />
            <MainViewContainer>
                <h2>{intl.get('discovery.main.mainView')}</h2>
                <div className="vis-container">
                    <div>
                        {
                            pined !== null && <MainCanvas pined={pined} />
                        }
                    </div>
                    
                    {mergeView !== null && <div>
                        {
                            vizRecSys === 'lite' && <ReactVega
                                actions={mainVizSetting.debug}
                                spec={distVis({
                                    pattern: mergeView,
                                    resizeMode: mainVizSetting.resize.mode,
                                    width: mainVizSetting.resize.width,
                                    height: mainVizSetting.resize.height,
                                })}
                                dataSource={applyFilter(cleanedData, mergeView.filters)}
                            />
                        }
                        {
                            vizRecSys === 'strict' && <ReactVega
                                actions={mainVizSetting.debug}
                                spec={labDistVis({
                                    pattern: mergeView,
                                    dataSource: cleanedData,
                                    width: mainVizSetting.resize.width,
                                    height: mainVizSetting.resize.height,
                                })}
                                dataSource={applyFilter(cleanedData, mergeView.filters)}
                            />
                        }
                    </div>}

                </div>
                <div className="fields-container">
                {
                    pined && pined.fields.map((f: IFieldMeta) => <ViewField
                        key={f.fid}
                        type={f.analyticType}
                        text={f.name || f.fid}
                        onRemove={() => { removeFromPined(f.fid) }}
                    />)
                }
                </div>
                <div className="fields-container">
                {
                    pined &&  pined.filters && pined.filters.map(f => <ViewField
                        key={f.field.fid}
                        type={f.field.analyticType}
                        text={`${f.field.name || f.field.fid} | ${f.values.join(',')}`}
                        onRemove={() => {
                            removePinedFilter(f.field)
                        }}
                    />)
                }
                </div>
                <div className="action-buttons">
                    <DefaultButton style={BUTTON_STYLE}
                        disabled={pined === null}
                        iconProps={{ iconName: 'ScatterChart' }}
                        text={intl.get('discovery.main.relatePatterns')} onClick={() => {
                            if (pined) {
                                assViews(pined)
                            }
                        }}
                    />
                    <PrimaryButton style={BUTTON_STYLE} text={intl.get('discovery.main.relateFeatures')}
                        iconProps={{ iconName: 'AddLink'}}
                        disabled={pined === null}
                        onClick={advicePureFeature}
                    />
                   <PrimaryButton style={BUTTON_STYLE} text={intl.get('discovery.main.explainDiff')}
                        iconProps={{ iconName: 'Compare' }}
                        disabled={pined === null || mergeView === null}
                        onClick={adviceCompareFeature}
                    />
                    <DefaultButton style={BUTTON_STYLE} text={intl.get('discovery.main.pointInterests')}
                        iconProps={{ iconName: 'SplitObject' }}
                        disabled={pined === null}
                        onClick={recommandFilter}
                    />
                </div>
            </MainViewContainer>
            <hr />
            <AssoContainer>
                {
                    specs.slice(0, renderAmount).map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
                        {
                            computing && <LoadingLayer>
                                <Spinner label="loading" />
                            </LoadingLayer>
                        }
                        <Stack horizontal>
                            <CommandButton
                                iconProps={{ iconName: 'Pinned' }}
                                text={intl.get('discovery.main.pin')}
                                onClick={() => {
                                    setPined(views[i])
                                }}
                            />
                            <CommandButton
                                iconProps={{ iconName: 'Compare' }}
                                text={intl.get('discovery.main.compare')}
                                onClick={() => {
                                    setMergeView(views[i])
                                    discoveryMainStore.updateMainVizSettings(s => {
                                        s.resize.mode = IResizeMode.auto
                                    })
                                }}
                            />
                            {/* <IconButton iconProps={{ iconName: 'Pinned' }}
                                title={intl.get('discovery.main.pin')}
                                onClick={() => {
                                    setPined(views[i])
                                }}
                            />
                            <IconButton iconProps={{ iconName: 'Compare' }}
                                title={intl.get('discovery.main.compare')}
                                onClick={() => {
                                    setMergeView(views[i])
                                    discoveryMainStore.updateMainVizSettings(s => {
                                        s.resize.mode = IResizeMode.auto
                                    })
                                }}
                            /> */}
                        </Stack>
                        <div className="chart-container">
                            {
                                vizRecSys === 'lite' && <ReactVega
                                    actions={mainVizSetting.debug}
                                    spec={spec}
                                    dataSource={applyFilter(cleanedData, views[i].filters)}
                                />
                            }
                            {
                                vizRecSys === 'strict' && <ReactVega
                                    actions={mainVizSetting.debug}
                                    spec={labDistVis({
                                        dataSource: cleanedData,
                                        pattern: views[i]
                                    })}
                                    dataSource={applyFilter(cleanedData, views[i].filters)}
                                />
                            }
                        </div>
                        {
                            views[i].filters && <div>
                                <h4>filters</h4>
                                {views[i].filters!.map(f => `${f.field.name || f.field.fid} = ${f.values.join(',')}`).join('\n')}
                            </div>
                        }
                    </div>)
                }
                {
                    images.map((img, i) => <img key={i} alt="none" src={img} />)
                }
            </AssoContainer>
            <DefaultButton disabled={renderAmount >= specs.length}
                style={{ marginTop: '5px' }}
                text={intl.get('discovery.main.loadMore')}
                onClick={() => {
                    setRenderAmount(a => a + RENDER_BATCH_SIZE)
                }}
            />
        </div>
    </div>
}

export default observer(PatternPage);