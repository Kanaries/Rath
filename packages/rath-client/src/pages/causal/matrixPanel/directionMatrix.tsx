import intl from 'react-intl-universal';
import { Icon, ITooltipProps, TooltipDelay, TooltipHost } from '@fluentui/react';
import type { DeepReadonly } from '@kanaries/graphic-walker/dist/interfaces';
import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import embed from 'vega-embed';
import type { IFieldMeta, IRow } from '../../../interfaces';
import { CausalLinkDirection, describeDirection, stringifyDirection } from '../../../utils/resolve-causal';

interface Props {
    mark: 'circle' | 'square';
    data: DeepReadonly<number[][]>;
    fields: DeepReadonly<IFieldMeta[]>;
    onSelect?: (xFieldId: string, yFieldId: string) => void;
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    > * {
        flex: 0;
        width: max-content;
    }
    & span {
        user-select: none;
        cursor: pointer;
        font-size: 0.8rem;
        line-height: 1.6em;
        color: #cb9b00;
        display: inline-flex;
        align-items: center;
        flex: 0;
        & i {
            display: inline-flex;
            width: 2em;
            height: 2em;
            font-weight: 800;
            transform: scale(0.5);
            align-items: center;
            justify-content: center;
            border: 1.5px solid;
            border-radius: 50%;
            margin: -1em 0;
        }
    }
`;

const tooltipProps: ITooltipProps = {
    onRenderContent: () => (
        <ul style={{ margin: 10, padding: 0 }}>
            {[
                CausalLinkDirection.none,
                CausalLinkDirection.directed,
                CausalLinkDirection.reversed,
                CausalLinkDirection.undirected,
                CausalLinkDirection.bidirected,
                CausalLinkDirection.weakDirected,
                CausalLinkDirection.weakReversed,
            ].map(direction => (
                <li key={direction}>
                    {`${stringifyDirection(direction)}: ${describeDirection(direction)}`}
                </li>
            ))}
        </ul>
    ),
};

const DirectionMatrix: React.FC<Props> = (props) => {
    const { data, fields, onSelect, mark } = props;
    const selectHandlerRef = useRef(onSelect);
    selectHandlerRef.current = onSelect;
    const container = useRef<HTMLDivElement>(null);
    const linkTypeName = intl.get('causal_direction._');
    const values = useMemo<IRow[]>(() => {
        const ans: IRow[] = [];
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                const value = i === j ? CausalLinkDirection.none : data[i][j];

                ans.push({
                    A: fields[i].name || fields[i].fid,
                    B: fields[j].name || fields[j].fid,
                    X_FID: fields[i].fid,
                    Y_FID: fields[j].fid,
                    value,
                    [linkTypeName]: stringifyDirection(value),
                    directed: {
                        [CausalLinkDirection.none]: 0,
                        [CausalLinkDirection.directed]: 1,
                        [CausalLinkDirection.reversed]: -1,
                        [CausalLinkDirection.weakDirected]: 0.5,
                        [CausalLinkDirection.weakReversed]: -0.5,
                        [CausalLinkDirection.undirected]: 0,
                        [CausalLinkDirection.weakUndirected]: 0,
                        [CausalLinkDirection.bidirected]: 1,
                    }[value],
                });
            }
        }
        return ans;
    }, [data, fields, linkTypeName]);
    useEffect(() => {
        if (container.current) {
            embed(container.current, {
                data: { values },
                mark: { type: mark, tooltip: { content: 'encoding' } },
                transform: [{ calculate: 'abs(datum.directed)', as: 'weight' }],
                encoding: {
                    y: { field: 'A', type: 'nominal' },
                    x: { field: 'B', type: 'nominal' },
                    color: { field: linkTypeName, type: 'nominal' },
                    size: { field: 'weight', type: 'quantitative', scale: { domain: [-1, 1] }, title: null, legend: null },
                    opacity: { condition: { test: 'datum.value == 0', value: 0 } },
                },
                config: {
                    axis: { grid: true, tickBand: 'extent' }
                },
            }, { actions: process.env.NODE_ENV !== 'production' }).then(res => {
                res.view.addEventListener('click', (event, item) => {
                    if (item && item.datum) {
                        selectHandlerRef.current?.(item.datum.X_FID, item.datum.Y_FID);
                    }
                })
            });
        }
    }, [values, mark, linkTypeName]);

    return (
        <Container>
            <TooltipHost
                tooltipProps={tooltipProps}
                delay={TooltipDelay.zero}
            >
                <span>
                    <Icon iconName="Help" />
                    {linkTypeName}
                </span>
            </TooltipHost>
            <div ref={container} />
        </Container>
    );
};

export default DirectionMatrix;
