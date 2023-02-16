import intl from 'react-intl-universal';
import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import produce, { enableMapSet } from 'immer';
import { Icon, Shimmer } from '@fluentui/react';


enableMapSet();

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
`;

const ItemText = styled.span`
    margin-left: 0.5em;
    white-space: nowrap;
    > small {
        font-size: 90%;
        margin-left: 0.5em;
        opacity: 0.6;
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
    isUnloaded: boolean;
    isFailed?: boolean;
    children?: INestedListItem[];
    icon?: JSX.Element;
}

export interface NestedListPartProps {
    path: INestedListItem[];
    level: number;
    isUnloaded: boolean;
    isFailed?: boolean;
    items: INestedListItem[];
    open: boolean;
    setOpen?: (open: boolean) => void;
    onItemClick?: (item: INestedListItem, path: INestedListItem[]) => void;
}

const NestedListPart = observer<NestedListPartProps>(function NestedListPart ({ path, level, items, isFailed = false, isUnloaded, open, onItemClick }) {
    const [openKeys, setOpenKeys] = useState(new Set<string>());

    useEffect(() => {
        if (isUnloaded || isFailed) {
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
    }, [items, isUnloaded, isFailed]);

    if (isUnloaded) {
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
    } else if (isFailed) {
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
                                    onClick={() => onItemClick?.(parent, path.slice(0, -1))}
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
                const mayHasChildren = item.children || item.isUnloaded || item.isFailed;
                const isOpen = openKeys.has(item.key);

                return (
                    <Item key={item.key}>
                        <ItemHeader
                            onClick={() => {
                                onItemClick?.(item, path);
                                if (mayHasChildren) {
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
                                {mayHasChildren && (
                                    <ChevronIcon open={isOpen} />
                                )}
                            </ItemChevron>
                            <ItemIcon>
                                {item.icon ?? (
                                    <Icon iconName={mayHasChildren ? 'ProductList' : 'Document'} />
                                )}
                            </ItemIcon>
                            <ItemText
                                onClick={e => {
                                    e.stopPropagation();
                                    onItemClick?.(item, path);
                                    if (mayHasChildren && !isOpen) {
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
                            </ItemText>
                        </ItemHeader>
                        {mayHasChildren && (
                            <NestedListPart
                                path={[...path, item]}
                                level={level + 1}
                                isUnloaded={item.isUnloaded}
                                isFailed={item.isFailed}
                                items={item.children ?? []}
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

export default NestedListPart;
