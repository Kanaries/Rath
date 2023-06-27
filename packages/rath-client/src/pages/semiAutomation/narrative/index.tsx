import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from '@fluentui/react';
import { useGlobalStore } from '../../../store';
import { getInsightExpl } from '../../../services/insights';
import { InsightDesc } from '../components';


const Narrative: React.FC = () => {
    const { semiAutoStore, langStore } = useGlobalStore();
    const { dataSource, mainView } = semiAutoStore;
    const [explainLoading, setExplainLoading] = useState(false);
    const requestId = useRef<number>(0);
    const fieldsInViz = useMemo(() => {
        return mainView.dataViewQuery?.fields || [];
    }, [mainView.dataViewQuery]);
    const [viewInfo, setViewInfo] = useState<any[]>([])
    useEffect(() => {
        setViewInfo([])
        setExplainLoading(false);
    }, [mainView.dataViewQuery])
    useEffect(() => {
        (() => getInsightExpl({
            requestId,
            dataSource,
            fields: fieldsInViz,
            aggrType: 'mean',
            langType: langStore.lang,
            setExplainLoading,
            resolveInsight: setViewInfo
        }))()
    }, [dataSource, fieldsInViz, langStore.lang])
    const explains = useMemo<any[]>(() => {
        if (!viewInfo || viewInfo.length === 0) return []
        return Object.keys(viewInfo[0]).filter((k: string) => viewInfo[0][k].score > 0).map((k: string) => ({
            score: viewInfo[0][k].score,
            type: k,
            explain: viewInfo[0][k].para.explain
        }));
    }, [viewInfo])
    // const ref = useRef(null);
    // useEffect(() => {
    //     const onClick = function(e: MouseEvent) {
    //         if (ref.current && !(ref.current as any).contains(e.target)) {
    //             setShow(false);
    //         }
    //     }
    //     document.addEventListener('click', onClick, true);
    //     return () => {
    //         document.removeEventListener('click', onClick, true);
    //     }
    // }, [setShow])
    return <div style={{
        height: '90%', maxHeight: '40vh', minWidth: '20vw', overflow: 'auto', marginLeft: '2em', borderLeft: '1px solid #8888', paddingLeft: '1.5em'
        }}>
        {
            !explainLoading && explains.filter(ex => ex.score > 0.0).sort((a, b) => b.score - a.score).map(ex => <InsightDesc key={ex.type}>
                <div className="insight-header">
                    <div className="type-title">{ex.type}</div>
                    <div className="type-score">{(ex.score * 100).toFixed(1)} %</div>
                </div>
                {/* <div className="type-label">{ex.type}</div> */}
                <p>{ex.explain}</p>
            </InsightDesc>)
        }
        {
            explainLoading && <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%'}}>
                <Spinner label="explain loading..." />
            </div>
        }
        {/* <ReactJson src={viewInfo} /> */}
        {/* {JSON.stringify(viewInfo)} */}
    </div>
}

export default observer(Narrative);