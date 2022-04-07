import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IFilter, IPattern } from '../../dev';
import { useGlobalStore } from '../../store';
import { distVis } from '../../queries/distVis'
import ReactVega from '../../components/react-vega';
import { DefaultButton, Stack, IconButton, PrimaryButton } from 'office-ui-fabric-react';
import { AssoContainer, MainViewContainer } from './components';
import ViewField from '../lts/vizOperation/viewField';
import { IFieldMeta, IRow } from '../../interfaces';
import { footmanEngineService } from '../../service';
import Settings from './settings';
import { labDistVis } from '../../queries/labdistVis';
import { notify } from '../../components/error';

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
    const [pined, setPined] = useState<IPattern | null>(null);
    const [renderAmount, setRenderAmount] = useState<number>(RENDER_BATCH_SIZE);
    const [mergeView, setMergeView] = useState<IPattern | null>(null);

    useEffect(() => {
        // core.init(cleanedData, fieldMetas)
        footmanEngineService({
            dataSource: cleanedData,
            fields: fieldMetas,
            task: 'univar',
        }, 'local').then(res => {
            console.log(res)
            setViews(res);
        }).catch(console.error)
        // const patterns = core.searchPatterns();
        // setViews(patterns);
    }, [fieldMetas, cleanedData])

    const specs = useMemo(() => {
        return views.map(view => distVis({ pattern: view }))
    }, [views])

    const assViews = useCallback((view: IPattern) => {
        footmanEngineService({
            dataSource: cleanedData,
            fields: fieldMetas,
            task: 'patterns',
            props: view
        }).then(res => {
            setViews(res);
            setRenderAmount(RENDER_BATCH_SIZE)
        }).catch(console.error);
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

    useEffect(() => {
        if (pined) {
            assViews(pined)
            setRenderAmount(RENDER_BATCH_SIZE)
        }
    }, [pined, assViews])

    const vizRecSys = discoveryMainStore.settings.vizAlgo;

    return <div className="content-container">
        <Settings />
        <div className="card">
            <IconButton
                style={{ float: 'right' }}
                iconProps={{ iconName: 'Settings' }}
                ariaLabel="settings"
                title="settings"
                onClick={() => {
                    discoveryMainStore.setShowSettings(true);
                }}
            />
            <MainViewContainer>
                <h2>Main View</h2>
                <div className="vis-container">
                    {pined !== null && <div>
                        <ReactVega spec={distVis({ pattern: pined })} dataSource={cleanedData} />
                        <hr />
                        <div className="fields-container">
                        {
                            pined.fields.map((f: IFieldMeta) => <ViewField
                                key={f.fid}
                                type={f.analyticType}
                                text={f.name || f.fid}
                                onRemove={() => { removeFromPined(f.fid) }}
                            />)
                        }
                        </div>
                    </div>}
                    {mergeView !== null && <div>
                        {
                            vizRecSys === 'lite' && <ReactVega spec={distVis({ pattern: mergeView })} dataSource={cleanedData} />
                        }
                        {
                            vizRecSys === 'strict' && <ReactVega spec={labDistVis({
                                pattern: mergeView,
                                dataSource: cleanedData
                            })} dataSource={cleanedData} />
                        }
                    </div>}
                </div>
                <div className="action-buttons">
                    <DefaultButton style={BUTTON_STYLE}
                        disabled={pined === null}
                        text="related patterns" onClick={() => {
                            if (pined) {
                                assViews(pined)
                            }
                        }}
                    />
                    <PrimaryButton style={BUTTON_STYLE} text="related features"
                        iconProps={{ iconName: 'AddLink'}}
                        disabled={pined === null}
                        onClick={advicePureFeature}
                    />
                   <PrimaryButton style={BUTTON_STYLE} text="explain diff"
                        disabled={pined === null || mergeView === null}
                        onClick={adviceCompareFeature}
                    />
                    <DefaultButton style={BUTTON_STYLE} text="point interests"
                        disabled={pined === null}
                        onClick={recommandFilter}
                    />
                </div>
            </MainViewContainer>
            <hr />
            <AssoContainer>
                {
                    specs.slice(0, renderAmount).map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
                        <Stack horizontal>
                            <IconButton iconProps={{ iconName: 'Pinned' }} onClick={() => {
                                setPined(views[i])
                            }} />
                            <IconButton iconProps={{ iconName: 'Compare' }} onClick={() => {
                                setMergeView(views[i])
                            }} />
                        </Stack>
                        <div className="chart-container">
                            {
                                vizRecSys === 'lite' && <ReactVega spec={spec} dataSource={applyFilter(cleanedData, views[i].filters)} />
                            }
                            {
                                vizRecSys === 'strict' && <ReactVega spec={labDistVis({
                                    dataSource: cleanedData,
                                    pattern: views[i]
                                })} dataSource={applyFilter(cleanedData, views[i].filters)} />
                            }
                        </div>
                    </div>)
                }
            </AssoContainer>
            <DefaultButton disabled={renderAmount >= specs.length} text="load more" onClick={() => {
                setRenderAmount(a => a + RENDER_BATCH_SIZE)
            }} />
        </div>
    </div>
}

export default observer(PatternPage);