import intl from 'react-intl-universal';
import { DetailsList, IColumn, SelectionMode, Stack } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useMemo, useRef } from "react";
import styled from "styled-components";
import useBoundingClientRect from "../../../../hooks/use-bounding-client-rect";
import { useGlobalStore } from "../../../../store";
import { useCausalViewContext } from "../../../../store/causalStore/viewStore";
import FullDistViz from "../../../dataSource/profilingView/fullDistViz";
import { PAG_NODE } from "../../config";


const Section = styled.div`
    display: flex;
    flex-direction: column;
    > header {
        font-size: 0.9rem;
        font-weight: 500;
        padding: 1em 0;
    }
`;

const META_VIEW_PADDING = 60;
const META_VIEW_HEIGHT = 200;

const CausalBlame: FC = () => {
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { mutualMatrix, causality } = causalStore.model;
    const viewContext = useCausalViewContext();
    const { selectedField } = viewContext ?? {};
    const metaViewContainerRef = useRef<HTMLDivElement>(null);
    const { width = META_VIEW_PADDING } = useBoundingClientRect(metaViewContainerRef, { width: true });

    const handleSelect = useCallback((ticks: readonly number[]) => {
        // hello world
    }, []);

    const neighbors = useMemo<{
        cause: string | undefined;
        causeWeight: number | undefined;
        causeCorr: number;
        effect: string | undefined;
        effectWeight: number | undefined;
        effectCorr: number;
    }[]>(() => {
        return selectedField ? fields.filter(f => f.fid !== selectedField.fid).map(f => {
            const cause = causality?.find(link => {
                if (![link.src, link.tar].every(node => [selectedField.fid, f.fid].includes(node))) {
                    return false;
                }
                const currType = link.tar === f.fid ? link.tar_type : link.src_type;
                return currType !== PAG_NODE.ARROW;
            });
            const effect = causality?.find(link => {
                if (![link.src, link.tar].every(node => [selectedField.fid, f.fid].includes(node))) {
                    return false;
                }
                const targetType = link.src === selectedField.fid ? link.src_type : link.tar_type;
                return targetType !== PAG_NODE.ARROW;
            });
            const selectedIdx = fields.findIndex(which => which.fid === selectedField.fid);
            const currIdx = fields.findIndex(which => which.fid === f.fid);
            return {
                cause: cause ? (f.name || f.fid) : undefined,
                causeWeight: cause ? -1 : undefined,
                causeCorr: mutualMatrix?.[currIdx]?.[selectedIdx] ?? -1,
                effect: effect ? (f.name || f.fid) : undefined,
                effectWeight: effect ? -1 : undefined,
                effectCorr: mutualMatrix?.[selectedIdx]?.[currIdx] ?? -1,
            };
        }) : [];
    }, [fields, selectedField, mutualMatrix, causality]);

    const columns = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'cause',
                name: 'Cause',
                iconName: 'AlignHorizontalLeft',
                isResizable: false,
                minWidth: 80,
                maxWidth: 80,
                onRender(item) {
                    return item['cause'];
                },
            },
            {
                key: 'causeWeight',
                name: 'Responsibility',
                isResizable: false,
                minWidth: 120,
                maxWidth: 120,
                onRender(item) {
                    return item['causeWeight'];
                },
            },
            {
                key: 'causeCorr',
                name: 'Correlation',
                isResizable: false,
                minWidth: 120,
                maxWidth: 120,
                onRender(item) {
                    return item['causeCorr'];
                },
            },
            {
                key: 'effectCorr',
                name: 'Correlation',
                isResizable: false,
                minWidth: 120,
                maxWidth: 120,
                onRender(item) {
                    return item['effectCorr'];
                },
            },
            {
                key: 'effectWeight',
                name: 'Responsibility',
                isResizable: false,
                minWidth: 120,
                maxWidth: 120,
                onRender(item) {
                    return item['effectWeight'];
                },
            },
            {
                key: 'effect',
                name: 'Effect',
                iconName: 'AlignHorizontalRight',
                isResizable: false,
                minWidth: 80,
                maxWidth: 80,
                onRender(item) {
                    return item['effect'];
                },
            },
        ];
    }, []);

    return selectedField ? (
        <Stack tokens={{ childrenGap: 20 }}>
            <Section ref={metaViewContainerRef}>
                <header>{intl.get('causal.analyze.single_dim')}</header>
                <FullDistViz
                    dataSource={selectedField.distribution}
                    x="memberName"
                    y="count"
                    height={META_VIEW_HEIGHT}
                    width={width - META_VIEW_PADDING}
                    maxItemInView={1000}
                    analyticType={selectedField.analyticType}
                    semanticType={selectedField.semanticType}
                    onSelect={handleSelect as (data: unknown[]) => void}
                />
            </Section>
            <Section>
                <header>{intl.get('causal.analyze.corr_atoms')}</header>
                <DetailsList
                    items={neighbors}
                    columns={columns}
                    selectionMode={SelectionMode.none}
                />
            </Section>
        </Stack>
    ) : null;
};


export default observer(CausalBlame);
