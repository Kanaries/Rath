import intl from 'react-intl-universal';
import { DetailsList, IColumn, SelectionMode } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useMemo } from "react";
import { useGlobalStore } from "../../../../store";
import { useCausalViewContext } from "../../../../store/causalStore/viewStore";
import { PAG_NODE } from "../../config";


const NeighborList: FC = () => {
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { mutualMatrix, causality } = causalStore.model;
    const viewContext = useCausalViewContext();
    const { selectedFieldGroup = [] } = viewContext ?? {};

    const neighbors = useMemo(() => {
        if (!mutualMatrix || !causality) {
            return [];
        }
        return causality.reduce<{
            cause: string;
            effect: string;
            corr: number;
        }[]>((list, link) => {
            const isIncluded = [link.src, link.tar].some(fid => selectedFieldGroup.some(f => f.fid === fid));
            const srcIdx = fields.findIndex(f => f.fid === link.src);
            const tarIdx = fields.findIndex(f => f.fid === link.tar);
            const src = fields[srcIdx];
            const tar = fields[tarIdx];
            if (isIncluded && src && tar) {
                if (link.src_type !== PAG_NODE.ARROW) {
                    list.push({ cause: src.name || src.fid, effect: tar.name || tar.fid, corr: mutualMatrix[srcIdx][tarIdx] });
                }
                if (link.tar_type !== PAG_NODE.ARROW) {
                    list.push({ cause: tar.name || tar.fid, effect: src.name || src.fid, corr: mutualMatrix[tarIdx][srcIdx] });
                }
            }
            return list;
        }, []);
    }, [mutualMatrix, causality, selectedFieldGroup, fields]);

    const columns = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'cause',
                name: intl.get('causal.analyze.cause'),
                minWidth: 100,
                maxWidth: 100,
                isResizable: false,
                onRender(item: typeof neighbors[number]) {
                    return item.cause;
                },
            },
            {
                key: 'corr',
                name: intl.get('causal.analyze.corr'),
                minWidth: 120,
                maxWidth: 120,
                isResizable: false,
                onRender(item: typeof neighbors[number]) {
                    const value = item.corr;
                    if (typeof value === 'number') {
                        if (Number.isFinite(value)) {
                            if (Math.abs(value - Math.floor(value)) < Number.MIN_VALUE) {
                                return value.toFixed(0);
                            }
                            return value > 0 && value < 1e-2 ? value.toExponential(2) : value.toPrecision(4);
                        }
                        return '-';
                    }
                    return value ?? '-';
                },
            },
            {
                key: 'effect',
                name: intl.get('causal.analyze.effect'),
                minWidth: 100,
                maxWidth: 100,
                isResizable: false,
                onRender(item: typeof neighbors[number]) {
                    return item.effect;
                },
            },
        ];
    }, []);

    return selectedFieldGroup?.length ? (
        <div>
            <header>
                {intl.get('causal.analyze.corr_atoms')}
            </header>
            <DetailsList
                items={neighbors}
                columns={columns}
                selectionMode={SelectionMode.none}
            />
        </div>
    ) : null;
};


export default observer(NeighborList);
