import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useDashboardContext } from '@store';
import { useBlockConfigs } from '@store/workspace';
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from '@fluentui/react-components';
import type { FC } from 'react';
import type { DashboardBlock } from 'src/interfaces';


const Root = styled.div`
    min-width: 350px;
    width: 20%;
    height: 100%;
    flex-grow: 0;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    box-sizing: border-box;
    border-inline: 1px solid #aaa;
`;

const Container = styled.div`
    padding-block: 1em 2em;
    padding-inline: 1em;
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const StyledAccordion = styled(Accordion)`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    overflow: hidden auto;
    > *:last-child {
        flex-grow: 1;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
`;

const StyledHeader = styled(AccordionHeader)`
    button {
        height: 32px;
    }
`;

const StyledPanel = styled(AccordionPanel)`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-block: 1em 2em;
    :last-child {
        flex-grow: 1;
        flex-shrink: 0;
    }
`;

const InspectPanel = observer(function InspectPanel () {
    const dashboard = useDashboardContext();
    const { selections } = dashboard;
    const block = useBlockConfigs();

    const target = selections.length === 1 ? selections[0] : null;
    const { onInspect } = (target ? block[target.type] : null) ?? {};
    const Element = onInspect as FC<{ data: typeof target; onChange: (next: DashboardBlock) => void }>;

    return (
        <Root onKeyDown={e => e.stopPropagation()}>
            <div>
                {'Inspect'}
            </div>
            <Container>
                {target && (
                    <StyledAccordion multiple defaultOpenItems="config">
                        <AccordionItem value="common">
                            <StyledHeader>
                                {'Common'}
                            </StyledHeader>
                            <AccordionPanel>

                            </AccordionPanel>
                        </AccordionItem>
                        {Element && target && (
                            <AccordionItem value="config">
                                <StyledHeader>
                                    {'Configuration'}
                                </StyledHeader>
                                <StyledPanel>
                                    <Element
                                        data={target}
                                        onChange={next => dashboard.updateBlock(target.id, () => next)}
                                    />
                                </StyledPanel>
                            </AccordionItem>
                        )}
                    </StyledAccordion>
                )}
            </Container>
        </Root>
    );
});

export default InspectPanel;
