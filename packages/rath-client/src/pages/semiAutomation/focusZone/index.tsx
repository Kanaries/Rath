import { observer } from 'mobx-react-lite';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react';
import React, { useCallback } from 'react';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import { MainViewContainer } from '../components';
import MainCanvas from './mainCanvas';
import intl from 'react-intl-universal';
import MiniFloatCanvas from './miniFloatCanvas';

const BUTTON_STYLE = { marginRight: '1em' }

const FocusZone: React.FC = props => {
    const { discoveryMainStore } = useGlobalStore();
    const { mainView, compareView, showMiniFloatView, autoAsso } = discoveryMainStore;
    const advicePureFeature = useCallback(() => {
        discoveryMainStore.featAssociate()
    }, [discoveryMainStore])
    const assViews = useCallback(() => {
        discoveryMainStore.pattAssociate();
        discoveryMainStore.featAssociate();
    }, [discoveryMainStore])
    const recommandFilter = useCallback(() => {
        discoveryMainStore.filterAssociate();
    }, [discoveryMainStore])
    const explainDiff = useCallback(() => {
        if (mainView && compareView) {
            discoveryMainStore.explainViewDiff(mainView, compareView);
        }
    }, [mainView, compareView, discoveryMainStore])
    return <MainViewContainer>
        {mainView && showMiniFloatView && <MiniFloatCanvas pined={mainView} />}
        <div className="vis-container">
            <div>
                {mainView && <MainCanvas pined={mainView} />}
            </div>
            <div>
                {compareView && <MainCanvas pined={compareView} />}
            </div>
        </div>
        <div className="fields-container">
        {
            mainView && mainView.fields.map((f: IFieldMeta) => <ViewField
                key={f.fid}
                type={f.analyticType}
                text={f.name || f.fid}
                onRemove={() => {
                    discoveryMainStore.removeMainViewField(f.fid)
                }}
            />)
        }
        </div>
        <div className="fields-container">
        {
            mainView &&  mainView.filters && mainView.filters.map(f => <ViewField
                key={f.field.fid}
                type={f.field.analyticType}
                text={`${f.field.name || f.field.fid} | ${f.values.join(',')}`}
                onRemove={() => {
                    discoveryMainStore.removeMainViewFilter(f.field.fid)
                }}
            />)
        }
        </div>
        <div className="action-buttons">
            {
                !autoAsso.pattViews && <DefaultButton style={BUTTON_STYLE}
                    disabled={mainView === null}
                    iconProps={{ iconName: 'ScatterChart' }}
                    text={intl.get('discovery.main.relatePatterns')} onClick={assViews}
                />
            }
            {
                !autoAsso.featViews && <PrimaryButton style={BUTTON_STYLE} text={intl.get('discovery.main.relateFeatures')}
                    iconProps={{ iconName: 'AddLink'}}
                    disabled={mainView === null}
                    onClick={advicePureFeature}
                />
            }
            <PrimaryButton style={BUTTON_STYLE} text={intl.get('discovery.main.explainDiff')}
                iconProps={{ iconName: 'Compare' }}
                disabled={mainView === null || compareView === null}
                onClick={explainDiff}
            />
            {
                !autoAsso.filterViews && <DefaultButton style={BUTTON_STYLE} text={intl.get('discovery.main.pointInterests')}
                    iconProps={{ iconName: 'SplitObject' }}
                    disabled={mainView === null}
                    onClick={recommandFilter}
                />
            }
        </div>
    </MainViewContainer>
}

export default observer(FocusZone);
