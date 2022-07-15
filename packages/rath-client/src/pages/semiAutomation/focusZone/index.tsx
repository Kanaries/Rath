import { observer } from 'mobx-react-lite';
import { PrimaryButton } from 'office-ui-fabric-react';
import React, { useCallback } from 'react';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import { MainViewContainer } from '../components';
import MainCanvas from './mainCanvas';
import intl from 'react-intl-universal';
import MiniFloatCanvas from './miniFloatCanvas';

const BUTTON_STYLE = { marginRight: '1em', marginTop: '1em' }

const FocusZone: React.FC = props => {
    const { discoveryMainStore } = useGlobalStore();
    const { mainView, compareView, showMiniFloatView } = discoveryMainStore;

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
        <hr style={{ marginTop: '1em' }} />
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
            <PrimaryButton style={BUTTON_STYLE} text={intl.get('discovery.main.explainDiff')}
                iconProps={{ iconName: 'Compare' }}
                disabled={mainView === null || compareView === null}
                onClick={explainDiff}
            />
        </div>
    </MainViewContainer>
}

export default observer(FocusZone);
