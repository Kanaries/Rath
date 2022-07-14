import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import FocusZone from './focusZone';
import PredictZone from './predictZone';
import { throttle } from '../../utils';

const BUTTON_STYLE = { marginRight: '1em' }

function applyFilter (dataSource: IRow[], filters?: IFilter[]): IRow[] {
    if (!filters || filters.length === 0) return dataSource;
    const subset: IRow[] = [];
    const filterValueSetList: Array<Set<any>> = [];
    for (let i = 0; i < filters.length; i++) {
        filterValueSetList.push(new Set(filters[i].values))
    }
    for (let i = 0; i < dataSource.length; i++) {
        for (let j = 0; j < filters.length; j++) {
            if (filterValueSetList[j].has(dataSource[i][filters[j].field.fid])) {
                subset.push(dataSource[i])
            }
        }
    }
    return subset
    // return dataSource.filter(row => {
    //     return filters.every(f => f.values.includes(row[f.field.fid]))
    // })
}

const RENDER_BATCH_SIZE = 5;

const PatternPage: React.FC = () => {
    const focusZoneContainer = useRef<HTMLDivElement>(null);
    const { dataSourceStore, discoveryMainStore } = useGlobalStore();
    // const { fieldMetas, cleanedData } = dataSourceStore;
    const [views, setViews] = useState<IPattern[]>([]);
    const [pined, setPined] = useState<IPattern | null>(null);
    const [computing, setComputing] = useState<boolean>(false);
    const [renderAmount, setRenderAmount] = useState<number>(RENDER_BATCH_SIZE);
    const [mergeView, setMergeView] = useState<IPattern | null>(null);
    const { mainVizSetting,
        featViews,
        filterViews,
        pattViews,
        fieldMetas,
        dataSource,
        featSpecList,
        pattSpecList,
        filterSpecList
    } = discoveryMainStore;
    const vizRecSys = discoveryMainStore.settings.vizAlgo;

    useEffect(() => {
        discoveryMainStore.initAssociate();
    }, [fieldMetas, dataSource])

    const assViews = useCallback((view: IPattern) => {
        discoveryMainStore.pattAssociate();
        discoveryMainStore.featAssociate();
    }, [])

    const adviceCompareFeature = useCallback(() => {
        if (pined === null || mergeView === null) return;
        // footmanEngineService({
        //     dataSource: cleanedData,
        //     fields: fieldMetas,
        //     task: 'featureSelection',
        //     props: 
        // })
        footmanEngineService({
            dataSource,
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
    }, [pined, mergeView, dataSource, fieldMetas])

    const advicePureFeature = useCallback(() => {
        discoveryMainStore.featAssociate()
    }, [])

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
        discoveryMainStore.filterAssociate();
    }, [])

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

    useEffect(() => {
        const ele = document.querySelector('.main-app-content');
        const callback = throttle((e: Event) => {
            if (focusZoneContainer.current && ele) {
                if (focusZoneContainer.current.offsetTop + focusZoneContainer.current.offsetHeight < ele.scrollTop) {
                    discoveryMainStore.setShowMiniFloatView(true)
                } else {
                    discoveryMainStore.setShowMiniFloatView(false);
                }
            }
        }, 300)
        ele!.addEventListener('scroll', callback)
        return () => {
            if (ele) {
                ele.removeEventListener('scroll', callback);
            }
        }
    }, [discoveryMainStore])

    return <div className="content-container">
        <Settings />
        <div className="card" ref={focusZoneContainer}>
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
            <FocusZone />
            {/* <DefaultButton disabled={renderAmount >= specs.length}
                style={{ marginTop: '5px' }}
                text={intl.get('discovery.main.loadMore')}
                onClick={() => {
                    setRenderAmount(a => a + RENDER_BATCH_SIZE)
                }}
            /> */}
        </div>
        <PredictZone />
    </div>
}

export default observer(PatternPage);