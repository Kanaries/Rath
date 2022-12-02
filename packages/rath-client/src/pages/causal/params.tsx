import {
    Dropdown,
    IconButton,
    Label,
    Panel,
    PanelType,
    PrimaryButton,
} from '@fluentui/react';
import produce from 'immer';
import { runInAction, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useMemo, useState } from 'react';
import { makeRenderLabelHandler } from '../../components/labelTooltip';
import { useGlobalStore } from '../../store';
import { useCausalViewContext } from '../../store/causalStore/viewStore';
import { IAlgoSchema } from './config';
import DynamicForm from './dynamicForm';

const Params: FC = () => {
    const { causalStore } = useGlobalStore();
    const { algorithm, causalAlgorithmForm, params: causalParams, causalAlgorithmOptions } = causalStore.operator;
    const viewContext = useCausalViewContext();
    const { shouldDisplayAlgorithmPanel } = viewContext ?? {};

    const [algoName, setAlgoName] = useState(algorithm);
    const [params, setParams] = useState<{ [key: string]: any }>(algorithm ? causalParams[algorithm] : {});

    useEffect(() => {
        setAlgoName(algorithm);
    }, [algorithm, shouldDisplayAlgorithmPanel]);

    useEffect(() => {
        setParams(algoName && algoName in causalParams ? causalParams[algoName] : {});
    }, [causalParams, algoName, shouldDisplayAlgorithmPanel]);

    const form = useMemo<IAlgoSchema[string] | null>(() => {
        return algoName && algoName in causalAlgorithmForm ? causalAlgorithmForm[algoName] : null;
    }, [causalAlgorithmForm, algoName]);

    const updateParam = (key: string, value: any) => {
        setParams(p => produce(toJS(p), draft => {
            draft[key] = value;
        }));
    };

    const saveParamsAndRun = () => {
        if (algoName === null) {
            return;
        }
        runInAction(() => {
            causalStore.operator.updateConfig(algoName, params);
            causalStore.run();
            viewContext?.closeAlgorithmPanel();
        });
    };

    return (
        <div>
            <IconButton
                text="Params"
                iconProps={{ iconName: 'Settings' }}
                onClick={() => viewContext?.openAlgorithmPanel()}
            />
            <Panel
                isOpen={shouldDisplayAlgorithmPanel}
                type={PanelType.medium}
                onDismiss={() => viewContext?.closeAlgorithmPanel()}
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
                {form && (
                    <>
                        <pre>{ form.description }</pre>
                        <DynamicForm
                            form={form}
                            values={params}
                            onChange={updateParam}
                        />
                        <PrimaryButton
                            style={{ marginTop: '10px' }}
                            text="Run"
                            disabled={algoName === null}
                            onClick={saveParamsAndRun}
                        />
                    </>
                )}
            </Panel>
        </div>
    );
};

export default observer(Params);
