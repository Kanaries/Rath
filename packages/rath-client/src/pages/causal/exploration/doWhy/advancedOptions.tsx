import intl from 'react-intl-universal';
import { Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { LabelWithDesc } from '../../../../components/labelTooltip';
import { RenderFormItem, shouldFormItemDisplay } from '../../dynamicForm';
import { useDoWhyContext } from './context';


const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 1em;
    border-block: 1px solid #8884;
    padding: 0.6em 0;
`;

const RowGroup = styled.table`
    margin-bottom: 1em;
`;

const Row = styled.tr`
    > td {
        padding: 0.4em 1em;
        :first-child {
            width: 40%;
        }
    }
`;

const AdvancedOptions: FC = () => {
    const context = useDoWhyContext();
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
                <RowGroup>
                    <tbody>
                        {context.form.items.map((item) => {
                            return shouldFormItemDisplay(item, context.params) && (
                                <Row key={item.key}>
                                    <td>
                                        <LabelWithDesc label={item.title} description={item.description} />
                                    </td>
                                    <td>
                                        <RenderFormItem
                                            item={item}
                                            onChange={(val) => context.updateParam(item.key, val)}
                                            value={context.params[item.key]}
                                        />
                                    </td>
                                </Row>
                            );
                        })}
                    </tbody>
                </RowGroup>
            )}
        </Container>
    ) : null;
};


export default observer(AdvancedOptions);
