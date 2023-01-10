import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Spinner } from '@fluentui/react';
import { useGlobalStore } from '../../../store';
import { getInsightExpl } from '../../../services/insights';

const InsightContainer = styled.div({
    height: '40vh',
    overflow: 'hidden auto',
});

const InsightDesc = styled.div`
    margin: 4px 12px 0px 12px;
    padding: 12px;
    border: 1px solid #95de64;
    font-size: 12px;
    max-width: 500px;
    overflow-y: auto;
    .insight-header {
        display: flex;
        font-size: 14px;
        line-height: 14px;
        margin-bottom: 8px;
        .type-title {
        }
        .type-score {
            margin-left: 1em;
            padding-left: 1em;
            border-left: 1px solid #bfbfbf;
        }
    }
    .type-label {
        background-color: green;
        color: white;
        display: inline-block;
        padding: 0px 1em;
        border-radius: 8px;
        font-size: 12px;
    }
`;

const Narrative: React.FC = (props) => {
    const { megaAutoStore, langStore } = useGlobalStore();
    const { pageIndex, insightSpaces, dataSource, fieldMetas, nlgThreshold } = megaAutoStore;
    const [explainLoading, setExplainLoading] = useState(false);
    const requestId = useRef<number>(0);
    const fms = toJS(fieldMetas);
    const fieldsInViz = useMemo(() => {
        return insightSpaces[pageIndex]
            ? [...insightSpaces[pageIndex].dimensions, ...insightSpaces[pageIndex].measures].map((fid) => fms.find((fm) => fm.fid === fid))
            : [];
    }, [insightSpaces, pageIndex, fms]);
    const [viewInfo, setViewInfo] = useState<any[]>([]);
    useEffect(() => {
        setViewInfo([]);
        setExplainLoading(false);
    }, [pageIndex]);
    useEffect(() => {
        setExplainLoading(true);
        requestId.current++;
        getInsightExpl({
            requestId: requestId,
            dataSource: dataSource,
            fields: fieldsInViz,
            aggrType: 'mean',
            langType: langStore.lang,
            setExplainLoading: setExplainLoading,
            resolveInsight: setViewInfo,
        });
    }, [pageIndex, dataSource, fieldsInViz, langStore.lang]);
    const explains = useMemo<any[]>(() => {
        if (!viewInfo || viewInfo.length === 0) return [];
        return Object.keys(viewInfo[0])
            .filter((k: string) => viewInfo[0][k].score > 0)
            .map((k: string) => ({
                score: viewInfo[0][k].score,
                type: k,
                explain: viewInfo[0][k].para.explain,
            }));
    }, [viewInfo]);
    return (
        <InsightContainer>
            {!explainLoading &&
                explains
                    .filter((ex) => ex.score > nlgThreshold)
                    .sort((a, b) => b.score - a.score)
                    .map((ex) => (
                        <InsightDesc key={ex.type}>
                            <div className="insight-header">
                                <div className="type-title">{ex.type}</div>
                                <div className="type-score">{(ex.score * 100).toFixed(1)} %</div>
                            </div>
                            <p>{ex.explain}</p>
                        </InsightDesc>
                    ))}
            {explainLoading && (
                <div>
                    <Spinner label="explain loading..." />
                </div>
            )}
        </InsightContainer>
    );
};

export default observer(Narrative);
