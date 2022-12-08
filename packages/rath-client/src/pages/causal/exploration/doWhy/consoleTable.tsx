import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useCallback } from 'react';
import { ActionButton, TooltipHost } from '@fluentui/react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../../store';
import { useDoWhyContext } from './context';


const Container = styled.div``;

const RowGroup = styled.div`
    display: grid;
    grid-template-columns: 1fr 5fr 2fr repeat(2, max-content);
    gap: 1em 1.8em;
    font-size: 0.8rem;
`;

const Cell = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
    &[aria-rowindex="1"] {
        font-weight: 600;
    }
    &[aria-colindex="4"], &[aria-colindex="5"] {
        text-align: center;
    }
    > code {
        display: block;
        overflow: scroll;
        white-space: pre;
        max-height: 8em;
        margin: 3px;
        padding: 0.4em;
        background-color: #8882;
        font-size: 80%;
        line-height: 1.5em;
    }
`;

const ConsoleTable: FC = () => {
    const context = useDoWhyContext();
    const { dataSourceStore: { fieldMetas } } = useGlobalStore();

    const formatFid = useCallback((fid: string) => {
        return fieldMetas.find(f => f.fid === fid)?.name || fid;
    }, [fieldMetas]);

    if (!context) {
        return null;
    }

    const { logs } = context;

    return (
        <Container>
            <header>运行记录</header>
            <ActionButton
                text="清空"
                iconProps={{ iconName: 'Delete' }}
                onClick={() => context.clearLogs()}
            />
            <RowGroup role="grid" aria-colcount={5} aria-rowcount={logs.length + 1}>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={1}>
                    ID
                </Cell>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={2}>
                    命题
                </Cell>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={3}>
                    分数
                </Cell>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={4}>
                    运行参数
                </Cell>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={5}>
                    {intl.get('common.advanced_options_switch')}
                </Cell>
                {logs.map((log, i) => {
                    return (
                        <Fragment key={i}>
                            <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={1}>
                                {i + 1}
                            </Cell>
                            <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={2}>
                                {`验证目标群体 (${
                                    log.props.predicates.map(data => `"${formatFid(data.fid)} ∈ ${
                                        data.type === 'range' ? `[${data.range.join(',')}]` : `{${data.values.map(v => JSON.stringify(v)).join(',')}}`
                                    }"`).join(' ∧ ')
                                }) 是否导致了 ${formatFid(log.props.outcome)} 在样本空间 (${
                                    log.props.populationPicker.map(data => `"${formatFid(data.fid)} ∈ ${
                                        data.type === 'range' ? `[${data.range.join(',')}]` : `{${data.values.map(v => JSON.stringify(v)).join(',')}}`
                                    }"`).join(' ∧ ') || '全集'
                                }) 的变化。`}
                            </Cell>
                            <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={3}>
                                <TooltipHost content={<>{log.data.weight}</>}>
                                    {log.data.weight}
                                </TooltipHost>
                            </Cell>
                            <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={4}>
                                <TooltipHost
                                    content={
                                        <code style={{ display: 'block', whiteSpace: 'pre', backgroundColor: '#8882', fontSize: '80%', lineHeight: '1.5em', padding: '0.8em 1em' }}>
                                            {JSON.stringify(log.props, undefined, 2)}
                                        </code>
                                    }
                                    closeDelay={400}
                                >
                                    ...
                                </TooltipHost>
                            </Cell>
                            <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={5}>
                                <TooltipHost
                                    content={
                                        <code style={{ display: 'block', whiteSpace: 'pre', backgroundColor: '#8882', fontSize: '80%', lineHeight: '1.5em', padding: '0.8em 1em' }}>
                                            {JSON.stringify(log.params, undefined, 2)}
                                        </code>
                                    }
                                    closeDelay={400}
                                >
                                    ...
                                </TooltipHost>
                            </Cell>
                        </Fragment>
                    );
                })}
            </RowGroup>
        </Container>
    );
};


export default observer(ConsoleTable);
