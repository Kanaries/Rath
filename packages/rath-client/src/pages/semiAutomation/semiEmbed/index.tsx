import { ActionButton, Panel, PanelType } from '@fluentui/react';
import { runInAction } from 'mobx';
import React, { useEffect } from 'react';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import LiteFocusZone from './liteFocusZone';
import LitePredictZone from './litePredictZone';

interface IProps {
    fields?: IFieldMeta[];
    show?: boolean;
    toggleShow?: (show: boolean) => void;
}
const SemiEmbed: React.FC<IProps> = (props) => {
    const { fields = [], show, toggleShow } = props;
    const { semiAutoStore } = useGlobalStore();
    useEffect(() => {
        if (show && fields.length > 0) {
            runInAction(() => {
                semiAutoStore.clearMainView();
                semiAutoStore.updateMainView({
                    fields,
                    imp: 0,
                });
                // semiAutoStore.addMainViewField(focusVarId);
            });
        }
    }, [fields, show, semiAutoStore]);

    return (
        <div>
            <ActionButton
                iconProps={{
                    iconName: 'Lightbulb',
                }}
                text="Explore Clues"
                onClick={() => {
                    toggleShow && toggleShow(!show);
                }}
            />
            <Panel
                type={PanelType.medium}
                headerText="Clues"
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
