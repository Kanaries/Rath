import {
    Dropdown,
    IconButton,
    Label,
    Panel,
    PanelType,
    PrimaryButton,
} from '@fluentui/react';
import produce from 'immer';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useState } from 'react';
import { makeRenderLabelHandler } from '../../components/labelTooltip';
import { IRow } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { BgKnowledge, CAUSAL_ALGORITHM_FORM, CAUSAL_ALGORITHM_OPTIONS, ICausalAlgorithm } from './config';
import DynamicForm from './dynamicForm';

const Params: React.FC<{ dataSource: IRow[], focusFields: string[]; precondition: BgKnowledge[] }> = ({ focusFields, precondition, dataSource }) => {
    const { causalStore } = useGlobalStore();
    const { causalAlgorithm, causalParams, showSettings, causalAlgorithmForm, causalAlgorithmOptions } = causalStore;

    const [algoName, setAlgoName] = useState(causalAlgorithm);
    const [params, setParams] = useState<{ [algo: string]: { [key: string]: any } }>(causalParams[causalAlgorithm]);

    useEffect(() => {
        setAlgoName(causalAlgorithm);
    }, [causalAlgorithm, showSettings]);

    useEffect(() => {
        setParams(causalParams[algoName]);
    }, [causalParams, algoName, showSettings]);

    const form = useMemo(() => causalAlgorithmForm[algoName], [causalAlgorithmForm, algoName]);

    const updateParam = (key: string, value: any) => {
        setParams(p => produce(toJS(p), draft => {
            draft[key] = value;
        }));
    };

    const saveParamsAndRun = () => {
        causalStore.updateCausalAlgoAndParams(algoName, params);
        causalStore.reRunCausalDiscovery(dataSource, focusFields, precondition);
        causalStore.toggleSettings(false);
    };

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
                    selectedKey={algoName}
                    onChange={(e, o) => {
                        o && setAlgoName(o.key as string);
                    }}
                    onRenderLabel={makeRenderLabelHandler('The algorithm to use.')}
                />
                <pre>{ form.description }</pre>
                <DynamicForm
                    form={form}
                    values={params}
                    onChange={updateParam}
                />
                <PrimaryButton
                    style={{ marginTop: '10px' }}
                    text="Run"
                    onClick={saveParamsAndRun}
                />
            </Panel>
        </div>
    );
};

export default observer(Params);
