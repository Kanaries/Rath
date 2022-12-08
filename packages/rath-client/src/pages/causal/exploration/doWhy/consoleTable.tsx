import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useCallback } from 'react';
import { ActionButton } from '@fluentui/react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../../store';
import { useDoWhyContext } from './context';


const Container = styled.div``;

const RowGroup = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr) repeat(2, 2fr);
    gap: 1em 0.5em;
    font-size: 0.8rem;
`;

const Cell = styled.div`
    overflow: hidden;
    > code {
        display: block;
        overflow: scroll;
        white-space: pre;
        max-height: 10em;
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
                    运行 ID
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
                                {`验证目标群体是否影响了 ${formatFid(log.props.outcome)}`}
                            </Cell>
                            <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={3}>
                                {log.data.weight}
                            </Cell>
                            <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={4}>
                                <code>{JSON.stringify(log.props, undefined, 2)}</code>
                            </Cell>
                            <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={5}>
                                <code>{JSON.stringify(log.params, undefined, 2)}</code>
                            </Cell>
                        </Fragment>
                    );
                })}
            </RowGroup>
        </Container>
    );
};


export default observer(ConsoleTable);
