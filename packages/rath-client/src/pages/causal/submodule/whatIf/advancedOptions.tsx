import intl from 'react-intl-universal';
import { Dropdown, Label, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useState } from 'react';
import styled from 'styled-components';
import { LabelWithDesc } from '../../../../components/labelTooltip';
import { RenderFormItem, shouldFormItemDisplay } from '../../dynamicForm';
import { getI18n } from '../../locales';
import { useWhatIfContext } from './context';


const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 1em;
`;

const RowGroup = styled.div`
    margin: 0.6em 0 1em;
    display: grid;
    grid-template-columns: max-content auto;
    gap: 0.6em 2em;
    border-bottom: 1px solid #8884;
    padding-bottom: 1.2em;
`;

const Cell = styled.div`
    padding: 0 1em;
`;

const AdvancedOptions: FC = () => {
    const context = useWhatIfContext();
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
                    <Cell role="gridcell" aria-rowindex={1} aria-colindex={1}>
                        <Label>{getI18n('submodule.WhatIf.algorithm')}</Label>
                    </Cell>
                    <Cell role="gridcell" aria-rowindex={1} aria-colindex={2}>
                        <Dropdown
                            options={Object.keys(context.form).map(name => ({
                                key: name,
                                text: name,
                            }))}
                            selectedKey={context.algoName}
                            onChange={(e, o) => {
                                o && context.switchAlgorithm(o.key as string);
                            }}
                        />
                    </Cell>
                    {context.form[context.algoName]?.items.map((item, i) => {
                        return shouldFormItemDisplay(item, context.allParams[context.algoName]) && (
                            <Fragment key={item.key}>
                                <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={1}>
                                    <LabelWithDesc label={item.title} description={item.description} />
                                </Cell>
                                <Cell role="gridcell" aria-rowindex={i + 2} aria-colindex={2}>
                                    <RenderFormItem
                                        item={item}
                                        onChange={(val) => context.updateParam(item.key, val)}
                                        value={context.allParams[context.algoName][item.key]}
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
