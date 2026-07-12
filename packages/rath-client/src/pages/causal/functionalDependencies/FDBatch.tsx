import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import produce from 'immer';
import { Button } from '../../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Spinner } from '../../../components/ui/spinner';
import { RathIcon } from '../../../components/icons';
import { useGlobalStore } from '../../../store';
import type { IFunctionalDep } from '../config';
import { getGeneratedFDFromAutoDetection } from './utils';
import FDEditor from './FDEditor';

const Mask = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff8;
    > div {
        box-shadow: 0 0 12px rgba(0, 0, 0, 0.15), 0 0 8px rgba(0, 0, 0, 0.03);
        background-color: #fff;
        padding: 2em;
        > div.container {
            width: 600px;
            > * {
                width: 100%;
            }
        }
    }
`;

enum BatchUpdateMode {
    OVERWRITE_ONLY = 'overwrite-only',
    FILL_ONLY = 'fill-only',
    FULLY_REPLACE = 'fully replace',
}

const batchUpdateModes = [BatchUpdateMode.OVERWRITE_ONLY, BatchUpdateMode.FILL_ONLY, BatchUpdateMode.FULLY_REPLACE] as const;

const FDBatch: FC = () => {
    const { causalStore } = useGlobalStore();
    const { sample } = causalStore.dataset;
    const { functionalDependencies } = causalStore.model;
    const [displayPreview, setDisplayPreview] = useState(false);
    const [preview, setPreview] = useState<readonly IFunctionalDep[] | null>(null);
    const isPending = displayPreview && preview === null;
    const [mode, setMode] = useState(BatchUpdateMode.OVERWRITE_ONLY);

    const dropdownOptions = useMemo<{ key: BatchUpdateMode; text: string }[]>(() => {
        return batchUpdateModes.map((key) => ({
            key,
            text: intl.get(`causal.analyze.${key}`),
        }));
    }, []);

    const updatePreview = useMemo<(fdArr: IFunctionalDep[] | ((prev: readonly IFunctionalDep[] | null) => readonly IFunctionalDep[])) => void>(() => {
        if (displayPreview) {
            return setPreview;
        }
        return () => {};
    }, [displayPreview]);

    const generateFDFromExtInfo = useCallback(() => {
        setPreview(causalStore.model.generatedFDFromExtInfo);
        setDisplayPreview(true);
    }, [causalStore]);

    const pendingRef = useRef<Promise<unknown> | undefined>(undefined);
    useEffect(() => {
        if (!displayPreview) {
            pendingRef.current = undefined;
        }
    }, [displayPreview]);
    const generateFDFromAutoDetection = useCallback(() => {
        const p = sample.getAll().then((data) => getGeneratedFDFromAutoDetection(data));
        pendingRef.current = p;
        p.then((res) => {
            if (p === pendingRef.current) {
                setPreview(res);
            }
        })
            .catch((err) => {
                if (p === pendingRef.current) {
                    setPreview([]);
                }
                console.warn(err);
            })
            .finally(() => {
                pendingRef.current = undefined;
            });
        setDisplayPreview(true);
    }, [sample]);

    const handleClear = useCallback(() => {
        causalStore.model.updateFunctionalDependencies([]);
    }, [causalStore]);

    const submittable = useMemo<IFunctionalDep[]>(() => {
        if (preview) {
            switch (mode) {
                case BatchUpdateMode.OVERWRITE_ONLY: {
                    return preview.reduce<IFunctionalDep[]>((deps, dep) => {
                        const overloadIdx = deps.findIndex((which) => which.fid === dep.fid);
                        if (overloadIdx !== -1) {
                            return produce(deps, (draft) => {
                                draft.splice(overloadIdx, 1, dep);
                            });
                        }
                        return deps.concat([dep]);
                    }, functionalDependencies.slice(0));
                }
                case BatchUpdateMode.FILL_ONLY: {
                    return preview.reduce<IFunctionalDep[]>((deps, dep) => {
                        const overloadIdx = deps.findIndex((which) => which.fid === dep.fid);
                        if (overloadIdx !== -1) {
                            return produce(deps, (draft) => {
                                const overload = draft[overloadIdx];
                                for (const prm of dep.params) {
                                    if (!overload.params.some((p) => p.fid === prm.fid)) {
                                        overload.params.push(prm);
                                    }
                                }
                            });
                        }
                        return deps;
                    }, functionalDependencies.slice(0));
                }
                case BatchUpdateMode.FULLY_REPLACE: {
                    return preview.slice(0);
                }
                default: {
                    return functionalDependencies.slice(0);
                }
            }
        } else {
            return functionalDependencies.slice(0);
        }
    }, [preview, functionalDependencies, mode]);

    const handleSubmit = useCallback(() => {
        causalStore.model.updateFunctionalDependencies(submittable);
        setDisplayPreview(false);
        setPreview(null);
    }, [causalStore, submittable]);

    const handleCancel = useCallback(() => {
        setPreview(null);
        setDisplayPreview(false);
    }, []);

    return (
        <>
            <h3>{intl.get('causal.actions.one_click')}</h3>
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleClear}>
                    <RathIcon name="Delete" />
                    {intl.get('causal.analyze.clear_all')}
                </Button>
                <Button variant="ghost" onClick={generateFDFromExtInfo}>
                    <RathIcon name="EngineeringGroup" />
                    {intl.get('causal.actions.use_ext_diagram')}
                </Button>
                <Button variant="ghost" onClick={generateFDFromAutoDetection}>
                    <RathIcon name="HintText" />
                    {intl.get('causal.actions.auto_detect')}
                </Button>
            </div>
            {displayPreview && (
                <Mask>
                    <div>
                        <div className="container">
                            {isPending ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Spinner aria-hidden="true" />
                                    <span>computing</span>
                                </div>
                            ) : (
                                <FDEditor
                                    title={intl.get('causal.actions.preview')}
                                    functionalDependencies={submittable}
                                    setFunctionalDependencies={updatePreview}
                                />
                            )}
                        </div>
                        <div className="flex justify-center gap-5">
                            <div className="inline-flex">
                                <Button type="button" className="rounded-r-none" onClick={handleSubmit}>
                                    {dropdownOptions.find((opt) => opt.key === mode)?.text ?? intl.get('common.apply')}
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" size="icon" className="rounded-l-none border-l border-primary-foreground/25 px-0">
                                            <RathIcon name="CaretSolidDown" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {dropdownOptions.map((option) => (
                                            <DropdownMenuItem
                                                key={option.key}
                                                onSelect={() => {
                                                    setMode(option.key);
                                                }}
                                            >
                                                {option.text}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <Button variant="outline" onClick={handleCancel}>
                                {intl.get('common.cancel')}
                            </Button>
                        </div>
                    </div>
                </Mask>
            )}
        </>
    );
};

export default observer(FDBatch);
