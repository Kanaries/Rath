import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NextVICore } from '../../dev';
import { useGlobalStore } from '../../store';
import { distVis } from '../../queries/distVis'
import ReactVega from '../../components/react-vega';
import { DefaultButton, Stack, IconButton, PrimaryButton } from 'office-ui-fabric-react';
import { AssoContainer, MainViewContainer } from './components';
import ViewField from '../lts/vizOperation/viewField';
import { IFieldMeta } from '../../interfaces';


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
        setViews(ans.map(([fs, score]) => ({
            measures: fs,
            imp: score
        })))
    }, [pined])

    const removeFromPined = useCallback((fid: string) => {
        const fields: IFieldMeta[] = [...pined.measures];
        const targetIndex = fields.findIndex(f => f.fid === fid);
        if (targetIndex > -1) {
            fields.splice(targetIndex, 1)
            setPined({
                ...pined,
                measures: fields
            })
        }
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
                    {pined !== null && <div>
                        <ReactVega spec={distVis({ measures: pined.measures })} dataSource={cleanedData} />
                        <hr />
                        <div className="fields-container">
                        {
                            pined.measures.map((f: IFieldMeta) => <ViewField
                                key={f.fid}
                                type={f.analyticType}
                                text={f.name || f.fid}
                                onRemove={() => { removeFromPined(f.fid) }}
                            />)
                        }
                        </div>
                    </div>}
                    {mergeView !== null && <div>
                        <ReactVega spec={distVis({ measures: mergeView.measures })} dataSource={cleanedData} />
                        {/* <hr />
                        <div className="fields-container">
                        </div> */}
                    </div>}
                </div>
                <div className="action-buttons">
                    <DefaultButton style={BUTTON_STYLE}
                        disabled={pined === null}
                        text="related patterns" onClick={() => {
                            assViews(pined)
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
                </div>
            </MainViewContainer>
            <hr />
            <AssoContainer>
                {
                    specs.map((spec, i) => <div className="asso-segment" key={`p-${i}`}>
                        <Stack horizontal>
                            <IconButton iconProps={{ iconName: 'Pinned' }} onClick={() => {
                                setPined(views[i])
                            }} />
                            <IconButton iconProps={{ iconName: 'Compare' }} onClick={() => {
                                setMergeView(views[i])
                            }} />
                        </Stack>
                        <div className="chart-container">
                            <ReactVega spec={spec} dataSource={cleanedData} />
                        </div>
                    </div>)
                }
            </AssoContainer>
        </div>
    </div>
}

export default observer(PatternPage);