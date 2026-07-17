import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import { Spinner } from '../../../components/ui/spinner';
import { RathIcon } from '../../../components/icons';
import { RathSelect } from '../../../components/rath-ui/rath-select';
import { useGlobalStore } from '../../../store';
import { useCausalViewContext } from '../../../store/causalStore/viewStore';
import ModelStorage from '../modelStorage';
import Params from '../params';

const CommandBar: FC = () => {
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { busy, algorithm, causalAlgorithmOptions } = causalStore.operator;
    const { mergedPag } = causalStore.model;
    const viewContext = useCausalViewContext();

    return (
        <div className="flex flex-none flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2">
            <RathSelect
                options={causalAlgorithmOptions}
                selectedKey={algorithm}
                disabled={busy || causalAlgorithmOptions.length === 0}
                ariaLabel={intl.get('causal.analyze.algorithm')}
                onChange={(key) => {
                    causalStore.operator.algorithm = String(key);
                }}
                triggerClassName="h-8 w-56"
                renderValue={(option) => (
                    <>
                        <span className="mr-1.5 text-muted-foreground">{intl.get('causal.analyze.algorithm')}</span>
                        {option ? option.text.split(':')[0] : '—'}
                    </>
                )}
            />
            <Button
                className="gap-1.5"
                disabled={busy || algorithm === null}
                onClick={() => {
                    if (!causalStore.operator.busy) {
                        causalStore.run();
                    }
                }}
            >
                {busy ? <Spinner aria-hidden="true" /> : <RathIcon name="Play" />}
                {intl.get('causal.actions.run')}
            </Button>
            <Button
                variant="outline"
                size="icon"
                title={intl.get('causal.actions.params')}
                aria-label={intl.get('causal.actions.params')}
                onClick={() => viewContext?.openAlgorithmPanel()}
            >
                <RathIcon name="Settings" />
            </Button>
            <Params />
            <Separator orientation="vertical" className="h-5" />
            <ModelStorage />
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                {busy ? (
                    <>
                        <Spinner aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>{intl.get('causal.status.computing')}</span>
                    </>
                ) : mergedPag.length > 0 ? (
                    <>
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>
                            {intl.get('causal.status.result', {
                                algorithm: algorithm ?? '—',
                                edges: mergedPag.length,
                                fields: fields.length,
                            })}
                        </span>
                    </>
                ) : (
                    <span>{intl.get('causal.status.no_result')}</span>
                )}
            </div>
        </div>
    );
};

export default observer(CommandBar);
