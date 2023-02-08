import intl from 'react-intl-universal';
import { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import produce, { enableMapSet } from 'immer';
import { Icon, Shimmer } from '@fluentui/react';


enableMapSet();

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

const ItemIcon = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: 1.4em;
    display: flex;
    align-items: center;
    justify-content: center;
    i {
        font-size: 1em;
        &[role="button"] {
            pointer-events: all;
            cursor: pointer;
            :hover {
                background-color: #f3f3f3;
            }
        }
    }
    + span {
        margin-left: 0.5em;
        white-space: nowrap;
        > small {
            font-size: 90%;
            margin-left: 0.5em;
            opacity: 0.6;
        }
    }
`;

const ChevronIcon = styled(Icon).attrs(() => ({ iconName: 'ChevronRight' }))<{ open: boolean }>`
    font-size: 1em;
    transform: rotate(${({ open }) => open ? 90 : 0}deg) scale(0.6);
    transition: transform 200ms;
`;

export interface INestedListItem {
    group?: string;
    key: string;
    text: string;
    subtext?: string;
    children?: INestedListItem[] | 'lazy' | 'failed';
    icon?: JSX.Element;
}

interface NestedListPartProps {
    path: INestedListItem[];
    level: number;
    items: INestedListItem[] | 'lazy' | 'failed';
    open: boolean;
    setOpen: (open: boolean) => void;
    onItemClick: (item: INestedListItem, path: INestedListItem[]) => void;
}

const NestedListPart = observer<NestedListPartProps>(function NestedListPart ({ path, level, items, open, onItemClick }) {
    const [openKeys, setOpenKeys] = useState(new Set<string>());

    useEffect(() => {
        if (items === 'lazy' || items === 'failed') {
            return;
        }
        setOpenKeys(prev => {
            const next = new Set<string>();
            for (const item of items) {
                const isOpen = prev.has(item.key);
                if (isOpen) {
                    next.add(item.key);
                }
            }
            return next;
        });
    }, [items]);

    if (items === 'lazy') {
        return (
            // @ts-expect-error css variable
            <Container open={open} style={{ '--level': level }}>
                {[0, 0, 0].map((_, i) => (
                    <Item virtual key={i}>
                        <ItemHeader>
                            <ItemChevron />
                            <Shimmer width="5em" styles={{ root: { height: '0.75em' }, shimmerWrapper: { height: '0.75em' } }} />
                        </ItemHeader>
                    </Item>
                ))}
            </Container>
        );
    } else if (items === 'failed') {
        const parent = path.at(-1);
        return (
            // @ts-expect-error css variable
            <Container open={open} style={{ '--level': level }}>
                <Item virtual>
                    <ItemHeader>
                        <ItemChevron />
                        {parent && (
                            <ItemIcon>
                                <Icon
                                    iconName="Refresh"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onItemClick(parent, path.slice(0, -1))}
                                />
                            </ItemIcon>
                        )}
                        <i style={{ color: '#f66' }}>{`<${intl.get('dataSource.req_err')}>`}</i>
                    </ItemHeader>
                </Item>
            </Container>
        );
    }

    return (
        // @ts-expect-error css variable
        <Container open={open} style={{ '--level': level }}>
            {items.map(item => {
                const isOpen = openKeys.has(item.key);

                return (
                    <Item key={item.key}>
                        <ItemHeader
                            onClick={() => {
                                onItemClick(item, path);
                                if (item.children) {
                                    setOpenKeys(keys => produce(keys, draft => {
                                        if (isOpen) {
                                            draft.delete(item.key);
                                        } else {
                                            draft.add(item.key);
                                        }
                                    }));
                                }
                            }}
                        >
                            <ItemChevron>
                                {item.children && (
                                    <ChevronIcon open={isOpen} />
                                )}
                            </ItemChevron>
                            <ItemIcon>
                                {item.icon ?? (
                                    <Icon iconName={item.children ? 'ProductList' : 'Document'} />
                                )}
                            </ItemIcon>
                            <span
                                onClick={e => {
                                    e.stopPropagation();
                                    onItemClick(item, path);
                                    if (item.children && !isOpen) {
                                        setOpenKeys(keys => produce(keys, draft => {
                                            if (isOpen) {
                                                draft.delete(item.key);
                                            } else {
                                                draft.add(item.key);
                                            }
                                        }));
                                    }
                                }}
                            >
                                {item.text}
                                {item.subtext && (
                                    <small>
                                        {item.subtext}
                                    </small>
                                )}
                            </span>
                        </ItemHeader>
                        {item.children && (
                            <NestedListPart
                                path={[...path, item]}
                                level={level + 1}
                                items={item.children}
                                open={isOpen}
                                setOpen={isOpen => {
                                    setOpenKeys(keys => produce(keys, draft => {
                                        if (isOpen) {
                                            draft.add(item.key);
                                        } else {
                                            draft.delete(item.key);
                                        }
                                    }));
                                }}
                                onItemClick={onItemClick}
                            />
                        )}
                    </Item>
                );
            })}
        </Container>
    );
});

export type INestedListProps = {
    title: string;
    loading: boolean;
} & Pick<NestedListPartProps, 'items'> & Partial<Pick<NestedListPartProps, 'onItemClick'>>;

const NestedList: FC<INestedListProps> = ({ loading, title, items, onItemClick }) => {
    return (
        <Root>
            {loading ? (
                // @ts-expect-error css variable
                <Container open style={{ '--level': 0 }}>
                    {[0, 0, 0, 0, 0, 0, 0, 0].map((_, i) => (
                        <Item virtual key={i}>
                            <ItemHeader>
                                <ItemChevron />
                                <Shimmer width="10em" styles={{ root: { height: '0.75em' }, shimmerWrapper: { height: '0.75em' } }} />
                            </ItemHeader>
                        </Item>
                    ))}
                </Container>
            ) : (
                <ItemHeader isRoot>
                    <span>{title}</span>
                </ItemHeader>
            )}
            <NestedListPart
                path={[]}
                level={1}
                items={items}
                open
                setOpen={() => {}}
                onItemClick={onItemClick ?? (() => {})}
            />
        </Root>
    );
};


export default observer(NestedList);
