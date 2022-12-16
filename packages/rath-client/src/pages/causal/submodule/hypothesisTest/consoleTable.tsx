import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useCallback } from 'react';
import { ActionButton, TooltipHost } from '@fluentui/react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../../store';
import { getI18n } from '../../locales';
import { useHypothesisTestContext } from './context';


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
    const context = useHypothesisTestContext();
    const { causalStore: { dataset: { allFields } } } = useGlobalStore();

    const formatFid = useCallback((fid: string) => {
        return allFields.find(f => f.fid === fid)?.name || fid;
    }, [allFields]);

    if (!context) {
        return null;
    }

    const { logs } = context;

    return (
        <Container>
            <header>{getI18n('submodule.HypothesisTest.history.title')}</header>
            <ActionButton
                text={getI18n('submodule.HypothesisTest.history.clear')}
                iconProps={{ iconName: 'Delete' }}
                onClick={() => context.clearLogs()}
            />
            <RowGroup role="grid" aria-colcount={5} aria-rowcount={logs.length + 1}>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={1}>
                    ID
                </Cell>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={2}>
                    {getI18n('submodule.HypothesisTest.history.hypothesis')}
                </Cell>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={3}>
                    {getI18n('submodule.HypothesisTest.history.score')}
                </Cell>
                <Cell role="gridcell" aria-rowindex={1} aria-colindex={4}>
                    {getI18n('submodule.HypothesisTest.history.params')}
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
                                {getI18n('submodule.HypothesisTest.history.template', {
                                    Pdc: log.props.predicates.map(data => `"${formatFid(data.fid)} ∈ ${
                                        data.type === 'range' ? `[${data.range.join(',')}]` : `{${data.values.map(v => JSON.stringify(v)).join(',')}}`
                                    }"`).join(' ∧ '),
                                    O: formatFid(log.props.outcome),
                                    Pop: log.props.populationPicker.map(data => `"${formatFid(data.fid)} ∈ ${
                                        data.type === 'range' ? `[${data.range.join(',')}]` : `{${data.values.map(v => JSON.stringify(v)).join(',')}}`
                                    }"`).join(' ∧ ') || getI18n('submodule.HypothesisTest.history.full_set'),
                                })}
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
