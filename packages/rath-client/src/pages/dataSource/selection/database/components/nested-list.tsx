import { FC, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { Shimmer } from '@fluentui/react';
import NestedListPart, { NestedListPartProps } from './nested-list-item';


const Root = styled.div`
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    > *:last-child {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: auto;
        padding-bottom: 50%;
    }
`;

const StyledShimmer = styled(Shimmer).attrs(() => ({ width: '10em' }))`
    --height: 0.75em;
    height: var(--height);
    .ms-Shimmer-shimmerWrapper {
        height: var(--height);
    }
`;

const Container = styled.ul<{ open: boolean }>`
    height: max-content;
    max-height: ${({ open }) => open ? 'max-content' : 0};
    transition: max-height 200ms;
    overflow: hidden;
`;

const Item = styled.li<{ virtual?: boolean }>`
    pointer-events: ${({ virtual }) => virtual ? 'none' : 'unset'};
`;

const ItemHeader = styled.div<{ isRoot?: boolean }>`
    width: 100%;
    padding-block: 2px;
    padding-inline: 1em;
    user-select: none;
    display: flex;
    align-items: center;
    font-size: 0.7rem;
    line-height: 1.5em;
    height: 1.5em;
    box-sizing: content-box;
    > *:first-child {
        box-sizing: content-box;
        padding-left: calc((var(--level) - 1) * 1em);
    }
    cursor: ${({ isRoot }) => isRoot ? 'default' : 'pointer'};
    :hover {
        background-color: ${({ isRoot }) => isRoot ? 'none' : '#f3f3f3'};
    }
`;

const ItemChevron = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: 1.4em;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export type INestedListProps = {
    title: string;
    loading: boolean;
} & Pick<NestedListPartProps, 'items' | 'isFailed' | 'isUnloaded'> & Partial<Pick<NestedListPartProps, 'onItemClick'>>;

const ShimmerItems = (
    <>
        {new Array(8).fill(0).map((_, i) => (
            <Item virtual key={i}>
                <ItemHeader>
                    <ItemChevron />
                    <StyledShimmer />
                </ItemHeader>
            </Item>
        ))}
    </>
);

const NestedList: FC<INestedListProps> = ({ loading, title, items, isFailed, isUnloaded, onItemClick }) => {
    const emptyPath = useMemo(() => [], []);

    return (
        <Root>
            {loading && (
                // @ts-expect-error css variable
                <Container open style={{ '--level': 0 }}>
                    {ShimmerItems}
                </Container>
            )}
            {!loading && (
                <ItemHeader isRoot>
                    <span>{title}</span>
                </ItemHeader>
            )}
            <NestedListPart
                path={emptyPath}
                level={1}
                items={items}
                isUnloaded={isUnloaded}
                isFailed={isFailed}
                open
                onItemClick={onItemClick}
            />
        </Root>
    );
};


export default observer(NestedList);
