import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import type { DashboardLayoutBlock } from 'src/interfaces';
import BlockRoot from './root';
import BlankBlock from './blank-block';
import TextBlock from './text-block';


const Container = styled.div<{ direction: DashboardLayoutBlock['direction'] }>`
    display: flex;
    flex-direction: ${({ direction }) => direction === 'horizontal' ? 'row' : 'column'};
    align-items: stretch;
    justify-content: stretch;
    > *:not(:first-child) {
        ${({ direction }) => direction === 'horizontal' ? 'margin-left' : 'margin-top'}: var(--spacing);
    }
`;

const LayoutBlock = observer<{ data: DashboardLayoutBlock }>(function LayoutBlock ({ data }) {
    const { direction, children } = data;

    return (
        <BlockRoot data={data}>
            <Container direction={direction}>
                {children.map((block, i) => {
                    switch (block.type) {
                        case 'layout': {
                            return <LayoutBlock key={i} data={block} />;
                        }
                        case 'blank': {
                            return <BlankBlock key={i} data={block} />;
                        }
                        case 'text': {
                            return <TextBlock key={i} data={block} />;
                        }
                        default: {
                            console.error(`Block type ${block.type} is not implemented!`);
                            return null;
                        }
                    }
                })}
            </Container>
        </BlockRoot>
    );
});


export default LayoutBlock;
