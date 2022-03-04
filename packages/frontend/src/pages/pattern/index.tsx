import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NextVICore } from '../../dev';
import { useGlobalStore } from '../../store';
import { distVis } from '../../queries/distVis'
import ReactVega from '../../components/react-vega';
import { DefaultButton, Stack } from 'office-ui-fabric-react';
import { AssoContainer, MainViewContainer } from './components';

const BUTTON_STYLE = { marginRight: '1em' }

const core = new NextVICore([], []);
const PatternPage: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    // const [specs, setSpecs] = useState<any[]>([]);
    const [views, setViews] = useState<any[]>([])
    const [pined, setPined] = useState<any>(null);
    const [mergeView, setMergeView] = useState<any>(null);
    useEffect(() => {
        core.init(cleanedData, fieldMetas)
        const patterns = core.searchPatterns();
        setViews(patterns);
    }, [fieldMetas, cleanedData])

    const specs = useMemo(() => {
        return views.map(view => distVis({ measures: view.measures }))
    }, [views])

    const assViews = useCallback((view: any) => {
        core.firstPattern();
        const morePatterns = core.createHighOrderPatterns(view.measures);
        // core.patterns[index]
        setViews(morePatterns);
    }, [])

    const adviceCompareFeature = useCallback(() => {
        const ans = core.fewatureSelectionForSecondPatternWithSpecifiedViews(pined.measures.slice(0, 2), mergeView.measures.slice(0, 2))
        if (ans !== null) {
            setViews([
                {
                    ...pined,
                    measures: [...pined.measures, ...ans.features]
                },
                {
                    ...mergeView,
                    measures: [...mergeView.measures, ...ans.features]
                },
            ])
        }

        console.log(ans);
    }, [pined, mergeView])

    const advicePureFeature = useCallback(() => {
        const ans = core.pureFeatureRecommand(pined.measures);
        console.log(ans)
        setViews(ans.map(([fs, score]) => ({
            measures: fs,
            imp: score
        })))
    }, [pined])

    useEffect(() => {
        if (pined) {
            assViews(pined)
        }
    }, [pined, assViews])

    return <div className="content-container">
        <div className="card">
            <MainViewContainer>
                <h2>Main View</h2>
                <div className="vis-container">
                    {pined !== null && <ReactVega spec={distVis({ measures: pined.measures })} dataSource={cleanedData} />}
                    {mergeView !== null && <ReactVega spec={distVis({ measures: mergeView.measures })} dataSource={cleanedData} />}
                </div>
                <div className="action-buttons">
                    <DefaultButton style={BUTTON_STYLE} text="related patterns" onClick={() => {
                        assViews(pined)
                    }} />
                    <DefaultButton style={BUTTON_STYLE} text="related features"
                        disabled={pined === null}
                        onClick={advicePureFeature}
                    />
                    <DefaultButton style={BUTTON_STYLE} text="explain diff"
                        disabled={pined === null || mergeView === null}
                        onClick={adviceCompareFeature}
                    />
                </div>
            </MainViewContainer>
            <hr />
            <AssoContainer>
                {
                    specs.map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
                        <div className="chart-container">
                            <ReactVega spec={spec} dataSource={cleanedData} />
                        </div>
                        <Stack horizontal>
                            <DefaultButton style={BUTTON_STYLE} text="Specify" onClick={() => {
                                setPined(views[i])
                            }} />
                            <DefaultButton style={BUTTON_STYLE} text="Compare" onClick={() => {
                                setMergeView(views[i])
                            }} /></Stack>
                    </div>)
                }
            </AssoContainer>
        </div>
    </div>
}

export default observer(PatternPage);