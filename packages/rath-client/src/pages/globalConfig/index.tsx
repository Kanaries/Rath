import { PIVOT_KEYS } from '../../constants';
import intl from 'react-intl-universal';
import { Pivot, PivotItem, Spinner, SpinnerSize } from '@fluentui/react';
import AnalysisSettings from './analysisSettings';
import SemiAutoSettings from './semiAutoSettings';
import MegaAutoSettings from './megaAutoSetting';
import styled from 'styled-components';
import { useState } from 'react';

const MaskDiv = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 999;
    background-color: rgba(98, 91, 91, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const GlobalConfig = () => {
    const [saveLoading, setSaveLoading] = useState(false);
    const globalConfigLink = [
        {
            key: PIVOT_KEYS.dataSource,
            name: PIVOT_KEYS.dataSource,
            element: (onSave: (check: boolean) => void) => {
                return <AnalysisSettings onSave={onSave} />;
            },
        },
        {
            key: PIVOT_KEYS.semiAuto,
            name: PIVOT_KEYS.semiAuto,
            element: (onSave: (check: boolean) => void) => {
                return <SemiAutoSettings onSave={onSave} />;
            },
        },
        {
            key: PIVOT_KEYS.megaAuto,
            name: PIVOT_KEYS.megaAuto,
            element: (onSave: (check: boolean) => void) => {
                return <MegaAutoSettings onSave={onSave} />;
            },
        },
    ];

    const onSave = (check: boolean | ((prevState: boolean) => boolean)) => {
        setSaveLoading(check);
    };
    return (
        <div className="content-container">
            <div className="card pb-0 relative">
                {saveLoading && (
                    <MaskDiv>
                        <Spinner size={SpinnerSize.large} label={intl.get(`function.save.save`)} />
                    </MaskDiv>
                )}
                <Pivot>
                    {globalConfigLink.map((item) => (
                        <PivotItem headerText={intl.get(`menu.${item.name}`)} key={item.key}>
                            {item.element(onSave)}
                        </PivotItem>
                    ))}
                </Pivot>
            </div>
        </div>
    );
};

export default GlobalConfig;
