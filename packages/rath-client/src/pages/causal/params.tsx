import produce from 'immer';
import { runInAction, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { RathIcon } from '../../components/icons';
import { LabelWithDesc } from '../../components/labelTooltip';
import { RathSelect, RathSelectOption } from '../../components/rath-ui/rath-select';
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
    const algorithmOptions = useMemo<RathSelectOption[]>(() => {
        return causalAlgorithmOptions.map((option) => ({
            key: option.key,
            text: option.text,
            disabled: option.disabled,
        }));
    }, [causalAlgorithmOptions]);

    const updateParam = (key: string, value: any) => {
        setParams((p) =>
            produce(toJS(p), (draft) => {
                draft[key] = value;
            })
        );
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
            <Button className="gap-1.5" variant="ghost" onClick={() => viewContext?.openAlgorithmPanel()}>
                <RathIcon name="Settings" />
                Params
            </Button>
            <Sheet
                open={shouldDisplayAlgorithmPanel}
                onOpenChange={(open) => {
                    if (!open) {
                        viewContext?.closeAlgorithmPanel();
                    }
                }}
            >
                <SheetContent className="flex h-full w-[min(592px,100vw)] flex-col overflow-hidden sm:max-w-none">
                    <SheetHeader>
                        <SheetTitle>Settings</SheetTitle>
                    </SheetHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                        <RathSelect
                            label={<LabelWithDesc label="Algorithm" description="The algorithm to use." />}
                            options={algorithmOptions}
                            selectedKey={algoName}
                            onChange={(key) => {
                                setAlgoName(key as string);
                            }}
                        />
                        {form && (
                            <>
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{form.description}</p>
                                <DynamicForm form={form} values={params} onChange={updateParam} />
                                <Button className="mt-4" disabled={algoName === null} onClick={saveParamsAndRun}>
                                    Run
                                </Button>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default observer(Params);
