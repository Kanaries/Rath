import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { FC, Fragment } from 'react';
import { useBlockConfigs } from '@store/workspace';
import type { DashboardLayoutBlock } from 'src/interfaces';
import BlockRoot from './root';


const Container = styled.div<{ direction: DashboardLayoutBlock['direction'] }>`
    display: flex;
    flex-direction: ${({ direction }) => direction === 'horizontal' ? 'row' : 'column'};
    overflow: hidden;
    > *:not(:first-child) {
        ${({ direction }) => direction === 'horizontal' ? 'margin-left' : 'margin-top'}: var(--spacing);
    }
`;

const LayoutBlock = observer<{ data: DashboardLayoutBlock }>(function LayoutBlock ({ data }) {
    const blocks = useBlockConfigs();
    const { direction, children } = data;

    return (
        <BlockRoot data={data}>
            <Container direction={direction}>
                {children.map((block, i) => {
                    const config = blocks[block.type];
                    if (!config) {
                        console.error(`Block type ${block.type} is not implemented!`);
                        return null;
                    }
                    const Element = config.onRender as FC<{ data: typeof block }>;
                    return (
                        <Fragment key={i}>
                            <Element data={block} />
                        </Fragment>
                    );
                })}
            </Container>
        </BlockRoot>
    );
});


export default LayoutBlock;
