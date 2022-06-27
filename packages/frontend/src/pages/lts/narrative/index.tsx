import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useState } from 'react';
import { useGlobalStore } from '../../../store';
import styled from 'styled-components';

const InsightDesc = styled.div`
    margin: 4px 12px 0px 12px;
    padding: 12px;
    border: 1px solid #95de64;
    font-size: 12px;
    max-width: 500px;
    overflow-y: auto;
    .insight-header{
        display: flex;
        font-size: 14px;
        line-height: 14px;
        margin-bottom: 8px;
        .type-title{

        }
        .type-score{
            margin-left: 1em;
            padding-left: 1em;
            border-left: 1px solid #bfbfbf;
        }
    }
    .type-label{
        background-color: green;
        color: white;
        display: inline-block;
        padding: 0px 1em;
        border-radius: 8px;
        font-size: 12px;
    }
`

const Narrative: React.FC = props => {
    const { exploreStore } = useGlobalStore();
    const { pageIndex, insightSpaces, dataSource, fieldMetas } = exploreStore;
    const fms = toJS(fieldMetas);
    const fieldsInViz = useMemo(() => {
        return insightSpaces[pageIndex] ? [...insightSpaces[pageIndex].dimensions, ...insightSpaces[pageIndex].measures].map(fid => fms.find(fm => fm.fid === fid)) : []
    }, [insightSpaces, pageIndex, fms]);
    const [viewInfo, setViewInfo] = useState<any[]>()
    useEffect(() => {
        if (true) {
            fetch('http://localhost:8000/insight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dataSource,
                    fields: fieldsInViz,
                    aggrType: 'sum'
                })
            }).then(res => res.json())
            .then(res => {
                if (res.success) {
                    const ans: { [key: string]: any } = {};
                    const data = res.data;
                    // if (data) {
                    //     Object.keys(data).forEach(k => {
                    //         if (data[k].score > 0) {
                    //             ans[k] = data[k]
                    //         }
                    //     })
                    // }
                    setViewInfo(res.data)
                }
            }).catch(err => {
                console.error(err);
                setViewInfo([])
            })
        }
        
    }, [pageIndex, dataSource, fieldsInViz])
    const explains = useMemo<any[]>(() => {
        if (!viewInfo || viewInfo.length === 0) return []
        return Object.keys(viewInfo[0]).filter((k: string) => viewInfo[0][k].score > 0).map((k: string) => ({
            score: viewInfo[0][k].score,
            type: k,
            explain: viewInfo[0][k].para.explain
        }));
    }, [viewInfo])
    return <div>
        {
            explains.map(ex => <InsightDesc key={ex.type}>
                <div className="insight-header">
                    <div className="type-title">{ex.type}</div>
                    <div className="type-score">{(ex.score * 100).toFixed(1)} %</div>
                </div>
                {/* <div className="type-label">{ex.type}</div> */}
                <p>{ex.explain}</p>
            </InsightDesc>)
        }
        {/* <ReactJson src={viewInfo} /> */}
        {/* {JSON.stringify(viewInfo)} */}
    </div>
}

export default observer(Narrative);