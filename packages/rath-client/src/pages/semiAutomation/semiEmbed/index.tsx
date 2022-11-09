import { ActionButton, Panel, PanelType } from '@fluentui/react';
import { IPattern } from '@kanaries/loa';
import { runInAction } from 'mobx';
import React, { useEffect } from 'react';
import { useGlobalStore } from '../../../store';
import LiteFocusZone from './liteFocusZone';
import LitePredictZone from './litePredictZone';

interface IProps {
    show?: boolean;
    toggleShow?: (show: boolean) => void;
    view: IPattern | null;
}
const SemiEmbed: React.FC<IProps> = (props) => {
    const { show, toggleShow, view } = props;
    const { semiAutoStore } = useGlobalStore();
    useEffect(() => {
        if (show && view && view.fields.length > 0) {
            runInAction(() => {
                semiAutoStore.clearMainView();
                semiAutoStore.updateMainView(view);
                // semiAutoStore.addMainViewField(focusVarId);
            });
        }
    }, [view, show, semiAutoStore]);

    return (
        <div>
            <ActionButton
                iconProps={{
                    iconName: 'Lightbulb',
                }}
                text="线索发现"
                onClick={() => {
                    toggleShow && toggleShow(!show);
                }}
            />
            <Panel
                type={PanelType.medium}
                headerText="线索"
                isOpen={show}
                isBlocking={false}
                onDismiss={() => {
                    toggleShow && toggleShow(false);
                }}
            >
                <LiteFocusZone />
                <LitePredictZone />
            </Panel>
        </div>
    );
};

export default SemiEmbed;
