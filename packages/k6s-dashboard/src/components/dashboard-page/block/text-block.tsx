import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import type { DashboardTextBlock, DashboardTextPart } from 'src/interfaces';
import BlockRoot from './root';


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
    > header {
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
    > span {
        color: var(--text-normal);
        font-size: var(--font-normal);
    }
`;

const TextPart = observer<{ data: DashboardTextPart }>(function TextPart ({ data }) {
    if (typeof data === 'string') {
        return <span>{data}</span>;
    }
    const { text, style, link } = data;
    if (typeof link === 'string') {
        return (
            <a
                href={link}
                target="_blank"
                rel="noreferrer"
                style={style}
            >
                {text}
            </a>
        );
    }
    return (
        <span style={style}>
            {text}
        </span>
    );
});

const TextBlock = observer<{ data: DashboardTextBlock }>(function TextBlock ({ data }) {
    const { contents } = data;

    return (
        <BlockRoot data={data}>
            <Container>
                {contents.map((content, i) => {
                    const { role = i === 0 ? 'header' : 'none', value } = content;
                    const text = <>{value.map((val, j) => <TextPart key={j} data={val} />)}</>;
                    switch (role) {
                        case 'header': {
                            return <header>{text}</header>;
                        }
                        case 'explanation': {
                            return <p>{text}</p>;
                        }
                        case 'none': {
                            return <span>{text}</span>;
                        }
                        default: {
                            return null;
                        }
                    }
                })}
            </Container>
        </BlockRoot>
    );
});


export default TextBlock;
