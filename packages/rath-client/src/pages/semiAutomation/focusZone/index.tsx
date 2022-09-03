import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { PrimaryButton } from 'office-ui-fabric-react';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ViewField from '../../megaAutomation/vizOperation/viewField';
import { MainViewContainer } from '../components';
import MainCanvas from './mainCanvas';
import MiniFloatCanvas from './miniFloatCanvas';

const BUTTON_STYLE = { marginRight: '1em', marginTop: '1em' };

const FocusZone: React.FC = (props) => {
    const { discoveryMainStore, commonStore } = useGlobalStore();
    const { mainView, compareView, showMiniFloatView, mainViewSpec, compareViewSpec } = discoveryMainStore;

    const explainDiff = useCallback(() => {
        if (mainView && compareView) {
            discoveryMainStore.explainViewDiff(mainView, compareView);
        }
    }, [mainView, compareView, discoveryMainStore]);

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
    return (
        <MainViewContainer>
            {mainView && showMiniFloatView && <MiniFloatCanvas pined={mainView} />}
            <div className="vis-container">
                <div>{mainView && mainViewSpec && <MainCanvas view={mainView} spec={mainViewSpec} />}</div>
                <div>{compareView && compareViewSpec && <MainCanvas view={compareView} spec={compareViewSpec} />}</div>
            </div>
            <hr style={{ marginTop: '1em' }} />
            <div className="fields-container">
                {mainView &&
                    mainView.fields.map((f: IFieldMeta) => (
                        <ViewField
                            key={f.fid}
                            type={f.analyticType}
                            text={f.name || f.fid}
                            onRemove={() => {
                                discoveryMainStore.removeMainViewField(f.fid);
                            }}
                        />
                    ))}
            </div>
            <div className="fields-container">
                {mainView &&
                    mainView.filters &&
                    mainView.filters.map((f) => (
                        <ViewField
                            key={f.field.fid}
                            type={f.field.analyticType}
                            text={`${f.field.name || f.field.fid} | ${f.values.join(',')}`}
                            onRemove={() => {
                                discoveryMainStore.removeMainViewFilter(f.field.fid);
                            }}
                        />
                    ))}
            </div>
            <div className="action-buttons">
                <PrimaryButton
                    style={BUTTON_STYLE}
                    text={intl.get('lts.commandBar.editing')}
                    iconProps={{ iconName: 'BarChartVerticalEdit' }}
                    disabled={mainView === null}
                    onClick={editChart}
                />
                <PrimaryButton
                    style={BUTTON_STYLE}
                    text={intl.get('lts.commandBar.painting')}
                    iconProps={{ iconName: 'EditCreate' }}
                    disabled={mainView === null}
                    onClick={paintChart}
                />

                <PrimaryButton
                    style={BUTTON_STYLE}
                    text={intl.get('discovery.main.explainDiff')}
                    iconProps={{ iconName: 'Compare' }}
                    disabled={mainView === null || compareView === null}
                    onClick={explainDiff}
                />
            </div>
        </MainViewContainer>
    );
};

export default observer(FocusZone);
