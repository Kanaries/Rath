import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { PrimaryButton } from '@fluentui/react';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import FieldPlaceholder from '../../../components/fieldPlaceholder';
import { MainViewContainer } from '../components';
import FilterCreationPill from '../../../components/filterCreationPill';
import MainCanvas from './mainCanvas';
import MiniFloatCanvas from './miniFloatCanvas';
import Narrative from '../narrative';
import { ActionButton } from '@fluentui/react';
import { FloatingOver } from '../components';

const BUTTON_STYLE = { marginRight: '1em', marginTop: '1em' };

const FocusZone: React.FC = props => {
    const { semiAutoStore, commonStore } = useGlobalStore();
    const { mainVizSetting, mainView, compareView, showMiniFloatView, mainViewSpec, compareViewSpec, fieldMetas } = semiAutoStore;
    const explainDiff = useCallback(() => {
        if (mainView && compareView) {
            semiAutoStore.explainViewDiff(mainView, compareView);
        }
    }, [mainView, compareView, semiAutoStore])

    const appendFieldHandler = useCallback((fid: string) => {
        semiAutoStore.addMainViewField(fid);
    }, [semiAutoStore])

    const editChart = useCallback(() => {
        if (mainViewSpec) {
            commonStore.visualAnalysisInGraphicWalker(mainViewSpec);
        }
    }, [mainViewSpec, commonStore]);

    const paintChart = useCallback(() => {
        if (mainViewSpec) {
            commonStore.analysisInPainter(mainViewSpec);
        }
    }, [mainViewSpec, commonStore]);

    const [showExplanation, setShowExplanation] = useState<boolean>(false);

    return <MainViewContainer>
        {mainView && showMiniFloatView && <MiniFloatCanvas pined={mainView} />}
        <div className="vis-container">
            <div>
                {mainView && mainViewSpec && <MainCanvas view={mainView} spec={mainViewSpec} />}
            </div>
            <div>
                {compareView && compareViewSpec && <MainCanvas view={compareView} spec={compareViewSpec} />}
            </div>
            { mainVizSetting.nlg && 
            <div style={{ overflow:'auto', visibility:showExplanation?'visible':'hidden' }}>
                <Narrative setShow={(show) => {setShowExplanation(show)}} />
            </div>}
            {mainVizSetting.nlg && <FloatingOver>
                <ActionButton iconProps={{ iconName: 'Lightbulb', style: { scale: "3" } }} onClick={() => {
                    setShowExplanation(!showExplanation);
                }} />
            </FloatingOver>
            }
        </div>
        <hr style={{ marginTop: '1em' }} />
        <div className="fields-container">
        {
            mainView && mainView.fields.map((f: IFieldMeta) => <ViewField
                key={f.fid}
                type={f.analyticType}
                text={f.name || f.fid}
                onRemove={() => {
                    semiAutoStore.removeMainViewField(f.fid)
                }}
            />)
        }
        <FieldPlaceholder
            fields={fieldMetas}
            onAdd={appendFieldHandler}
        />
        </div>
        <div className="fields-container">
        {
            mainView &&  mainView.filters && mainView.filters.map(f => {
                const targetField = fieldMetas.find(m => m.fid === f.fid);
                if (!targetField) return null;
                let filterDesc = `${targetField.name || targetField.fid} ∈ `;
                filterDesc += (f.type === 'range' ? `[${f.range.join(',')}]` : `{${f.values.join(',')}}`)
                return  <ViewField
                    key={f.fid}
                    type={targetField.analyticType}
                    text={filterDesc}
                    onRemove={() => {
                        semiAutoStore.removeMainViewFilter(f.fid)
                    }}
                />
            })
        }
        <FilterCreationPill fields={fieldMetas} onFilterSubmit={(field, filter) => {
            semiAutoStore.addMainViewFilter(filter);
        }} />
        </div>
        <div className="action-buttons">
            <PrimaryButton
                style={BUTTON_STYLE}
                text={intl.get('megaAuto.commandBar.editing')}
                iconProps={{ iconName: 'BarChartVerticalEdit'}}
                disabled={mainView === null}
                onClick={editChart}
            />
            <PrimaryButton
                    style={BUTTON_STYLE}
                    text={intl.get('megaAuto.commandBar.painting')}
                    iconProps={{ iconName: 'EditCreate' }}
                    disabled={mainView === null}
                    onClick={paintChart}
                />
            <PrimaryButton style={BUTTON_STYLE} text={intl.get('semiAuto.main.explainDiff')}
                iconProps={{ iconName: 'Compare' }}
                disabled={mainView === null || compareView === null}
                onClick={explainDiff}
            />
        </div>
    </MainViewContainer>
}

export default observer(FocusZone);
