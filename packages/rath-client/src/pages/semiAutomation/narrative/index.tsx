import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from '@fluentui/react';
import { useGlobalStore } from '../../../store';
import { getInsightExpl } from '../../../services/insights';
import { InsightDesc } from '../components';

interface INarrativeProps {
    setShow: (show: boolean) => any
}
const Narrative: React.FC<INarrativeProps> = (props: INarrativeProps) => {
    const { setShow } = props;
    const { semiAutoStore, langStore } = useGlobalStore();
    const { dataSource, mainView } = semiAutoStore;
    const [explainLoading, setExplainLoading] = useState(false);
    const requestId = useRef<number>(0);
    const fieldsInViz = useMemo(() => {
        return mainView?.fields || [];
    }, [mainView]);
    const [viewInfo, setViewInfo] = useState<any[]>([])
    useEffect(() => {
        setViewInfo([])
        setExplainLoading(false);
    }, [mainView])
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
    const ref = useRef(null);
    useEffect(() => {
        const onClick = function(e: MouseEvent) {
            if (ref.current && !(ref.current as any).contains(e.target)) {
                setShow(false);
            }
        }
        document.addEventListener('click', onClick, true);
        return () => {
            document.removeEventListener('click', onClick, true);
        }
    }, [setShow])
    return <div ref={ref} style={{
        height: '60%', maxWidth: '60%', right: '10%', top: '15%', overflow: 'auto', position: 'fixed', zIndex: '9999'
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
            explainLoading && <div>
                <Spinner label="explain loading..." />
            </div>
        }
        {/* <ReactJson src={viewInfo} /> */}
        {/* {JSON.stringify(viewInfo)} */}
    </div>
}

export default observer(Narrative);