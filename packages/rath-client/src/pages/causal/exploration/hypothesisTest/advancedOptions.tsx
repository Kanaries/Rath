import intl from 'react-intl-universal';
import { Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useState } from 'react';
import styled from 'styled-components';
import { LabelWithDesc } from '../../../../components/labelTooltip';
import { RenderFormItem, shouldFormItemDisplay } from '../../dynamicForm';
import { useHypothesisTestContext } from './context';


const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 1em;
    border-block: 1px solid #8884;
    padding: 0.6em 0;
`;

const RowGroup = styled.div`
    margin: 0.6em 0 1em;
    display: grid;
    grid-template-columns: max-content auto;
    gap: 0.6em 2em;
`;

const Cell = styled.div`
    padding: 0 1em;
`;

const AdvancedOptions: FC = () => {
    const context = useHypothesisTestContext();
    const [display, setDisplay] = useState(false);

    return context?.form ? (
        <Container>
            <Toggle
                label={intl.get('common.advanced_options_switch')}
                inlineLabel
                checked={display}
                onChange={(_, checked) => setDisplay(Boolean(checked))}
            />
            {display && (
                <RowGroup role="grid" aria-colcount={2}>
                    {context.form.items.map((item, i) => {
                        return shouldFormItemDisplay(item, context.params) && (
                            <Fragment key={item.key}>
                                <Cell role="gridcell" aria-rowindex={i + 1} aria-colindex={1}>
                                    <LabelWithDesc label={item.title} description={item.description} />
                                </Cell>
                                <Cell role="gridcell" aria-rowindex={i + 1} aria-colindex={2}>
                                    <RenderFormItem
                                        item={item}
                                        onChange={(val) => context.updateParam(item.key, val)}
                                        value={context.params[item.key]}
                                    />
                                </Cell>
                            </Fragment>
                        );
                    })}
                </RowGroup>
            )}
        </Container>
    ) : null;
};


export default observer(AdvancedOptions);
