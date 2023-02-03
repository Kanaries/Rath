import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import BlockRoot from '../root';
import type { DashboardTextBlock } from 'src/interfaces';
import markdownComponentsMap from './components';


const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    overflow: hidden;
    > * {
        flex-grow: 0.1;
        flex-shrink: 1;
        flex-basis: fit-content;
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    color: var(--text-normal);
    font-size: var(--font-normal);
    > header, h1, h2, h3, h4, h5, h6 {
        color: var(--text-primary);
        font-size: var(--font-large);
    }
    > p {
        color: var(--text-secondary);
        font-size: var(--font-small);
    }
    a {
        color: var(--text-normal);
    }
`;

const TextBlock = observer<{ data: DashboardTextBlock }>(function TextBlock ({ data }) {
    const { content } = data;

    return (
        <BlockRoot data={data}>
            <Container>
                <ReactMarkdown components={markdownComponentsMap}>
                    {content}
                </ReactMarkdown>
            </Container>
        </BlockRoot>
    );
});


export default TextBlock;
