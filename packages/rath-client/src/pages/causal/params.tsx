import intl from 'react-intl-universal';
import produce from 'immer';
import { runInAction, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { useGlobalStore } from '../../store';
import { useCausalViewContext } from '../../store/causalStore/viewStore';
import { IAlgoSchema } from './config';
import DynamicForm from './dynamicForm';

const Params: FC = () => {
    const { causalStore } = useGlobalStore();
    const { algorithm, causalAlgorithmForm, params: causalParams } = causalStore.operator;
    const viewContext = useCausalViewContext();
    const { shouldDisplayAlgorithmPanel } = viewContext ?? {};

    const [params, setParams] = useState<{ [key: string]: any }>(algorithm ? causalParams[algorithm] : {});

    useEffect(() => {
        setParams(algorithm && algorithm in causalParams ? causalParams[algorithm] : {});
    }, [causalParams, algorithm, shouldDisplayAlgorithmPanel]);

    const form = useMemo<IAlgoSchema[string] | null>(() => {
        return algorithm && algorithm in causalAlgorithmForm ? causalAlgorithmForm[algorithm] : null;
    }, [causalAlgorithmForm, algorithm]);

    const updateParam = (key: string, value: any) => {
        setParams((p) =>
            produce(toJS(p), (draft) => {
                draft[key] = value;
            })
        );
    };

    const saveParamsAndRun = () => {
        if (algorithm === null) {
            return;
        }
        runInAction(() => {
            causalStore.operator.updateConfig(algorithm, params);
            causalStore.run();
            viewContext?.closeAlgorithmPanel();
        });
    };

    return (
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
                    <SheetTitle>{intl.get('causal.actions.params')}</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                    {form ? (
                        <>
                            <p className="text-sm font-medium">{algorithm ? `${algorithm}: ${form.title}` : form.title}</p>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{form.description}</p>
                            <DynamicForm form={form} values={params} onChange={updateParam} />
                            <Button className="mt-4" disabled={algorithm === null} onClick={saveParamsAndRun}>
                                {intl.get('causal.actions.run')}
                            </Button>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">{intl.get('causal.status.no_algorithm')}</p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default observer(Params);
