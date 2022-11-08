import { ActionButton, Panel, PanelType } from '@fluentui/react';
import { runInAction } from 'mobx';
import React, { useEffect, useState } from 'react';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import LiteFocusZone from './liteFocusZone';
import LitePredictZone from './litePredictZone';

interface IProps {
    fields?: IFieldMeta[]
}
const SemiEmbed: React.FC<IProps> = (props) => {
    const { fields = [] } = props;
    const { semiAutoStore } = useGlobalStore();
    const [show, setShow] = useState(false);
    useEffect(() => {
        if (show && fields.length > 0) {
            runInAction(() => {
                semiAutoStore.clearMainView();
                semiAutoStore.updateMainView({
                    fields,
                    imp: 0
                })
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
                    setShow((v) => !v);
                }}
            />
            <Panel
                type={PanelType.medium}
                headerText="Clues"
                isOpen={show}
                isBlocking={false}
                onDismiss={() => {
                    setShow(false);
                }}
            >
                <LiteFocusZone />
                <LitePredictZone />
            </Panel>
        </div>
    );
};

export default SemiEmbed;
