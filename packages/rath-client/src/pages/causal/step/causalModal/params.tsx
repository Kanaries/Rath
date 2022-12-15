import {
    ActionButton,
    Dropdown,
    Label,
    Panel,
    PanelType,
    PrimaryButton,
} from '@fluentui/react';
import produce from 'immer';
import { runInAction, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useMemo, useState } from 'react';
import { makeRenderLabelHandler } from '../../../../components/labelTooltip';
import { useGlobalStore } from '../../../../store';
import { useCausalViewContext } from '../../../../store/causalStore/viewStore';
import { IAlgoSchema } from '../../config';
import DynamicForm from '../../dynamicForm';
import { getI18n } from '../../locales';

const Params: FC = () => {
    const { causalStore } = useGlobalStore();
    const { algorithm, causalAlgorithmForm, params: causalParams, causalAlgorithmOptions, serverActive } = causalStore.operator;
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
            <ActionButton
                text={getI18n('form.trigger')}
                iconProps={{ iconName: 'Settings' }}
                disabled={!serverActive}
                onClick={() => viewContext?.openAlgorithmPanel()}
                style={{ height: '32px' }}
            />
            <Panel
                isOpen={shouldDisplayAlgorithmPanel}
                type={PanelType.medium}
                onDismiss={() => viewContext?.closeAlgorithmPanel()}
            >
                <Label>{getI18n('form.title')}</Label>
                <Dropdown
                    label={getI18n('form.first_level')}
                    options={causalAlgorithmOptions}
                    selectedKey={algoName}
                    onChange={(e, o) => {
                        o && setAlgoName(o.key as string);
                    }}
                    onRenderLabel={makeRenderLabelHandler(getI18n('form.first_level_desc'))}
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
                            text={getI18n('form.run')}
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
