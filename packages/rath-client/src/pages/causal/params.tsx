import {
    Dropdown,
    IconButton,
    Label,
    Panel,
    PanelType,
    PrimaryButton,
} from '@fluentui/react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { makeRenderLabelHandler } from '../../components/labelTooltip';
import { IRow } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { BgKnowledge, CAUSAL_ALGORITHM_FORM, CAUSAL_ALGORITHM_OPTIONS, ICausalAlgorithm } from './config';
import DynamicForm from './dynamicForm';

const Params: React.FC<{ dataSource: IRow[], focusFields: string[]; precondition: BgKnowledge[] }> = ({ focusFields, precondition, dataSource }) => {
    const { causalStore } = useGlobalStore();
    const { causalAlgorithm, causalParams, showSettings } = causalStore;
    const { causalAlgorithmForm, causalAlgorithmOptions } = causalStore;
    return (
        <div>
            <IconButton
                text="Params"
                iconProps={{ iconName: 'Settings' }}
                onClick={() => causalStore.toggleSettings(true)}
            />
            <Panel
                isOpen={showSettings}
                type={PanelType.medium}
                onDismiss={() => {
                    causalStore.toggleSettings(false);
                }}
            >
                
                <Label>Settings</Label>
                
                <Dropdown
                    label="Algorithm"
                    options={causalAlgorithmOptions}
                    selectedKey={causalAlgorithm}
                    onChange={(e, o) => {
                        o && causalStore.switchCausalAlgorithm(o.key as string);
                    }}
                    onRenderLabel={makeRenderLabelHandler('The algorithm to use.')}
                />
                <pre>{ causalStore.causalAlgorithmForm[causalAlgorithm].description }</pre>
                <DynamicForm
                    form={causalAlgorithmForm[causalAlgorithm as string]!}
                    values={toJS(causalParams[causalAlgorithm])}
                    onChange={(key, value) => {
                        causalStore.updateCausalParamsValue(key as any, value);
                    }}
                />
                <PrimaryButton
                    style={{ marginTop: '10px' }}
                    text="Run"
                    onClick={() => {
                        causalStore.reRunCausalDiscovery(dataSource, focusFields, precondition);
                        causalStore.toggleSettings(false);
                    }}
                />
            </Panel>
        </div>
    );
};

export default observer(Params);
