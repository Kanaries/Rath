import intl from 'react-intl-universal';
import { Icon, IconButton, TooltipHost } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import dayjs from 'dayjs';
import type { FC } from "react";
import styled from "styled-components";
import { IDBMeta, updateDataStorageUserTagGroup, UserTagGroup, userTagGroupColors } from "../../../../utils/storage";
import { RathDemoVirtualExt } from '../demo';
import { IDataSourceType } from '../../../../global';
import getFileIcon from './get-file-icon';


const allUserTagGroups = Object.keys(userTagGroupColors) as unknown as UserTagGroup[];

const UserTagGroupSize = 12;
const UserTagGroupPadding = 2;

const ListItem = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: ${(UserTagGroupSize + UserTagGroupPadding * 2) * ((allUserTagGroups.length - 1) * 0.8 + 1) + 10}px;
    height: 100%;
    padding: 1.2em 1em 1em 1.4em;
    border-radius: 2px;
    position: relative;
    box-shadow: inset 0 0 2px #8881;
    > .head {
        display: flex;
        align-items: center;
        > i {
            flex-grow: 0;
            flex-shrink: 0;
            width: 2em;
            height: 2em;
            margin-right: 0.8em;
            user-select: none;
        }
        > div {
            flex-grow: 1;
            flex-shrink: 1;
            overflow: hidden;
            > header {
                font-size: 0.8rem;
                line-height: 1.5em;
                font-weight: 550;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
                color: #111;
            }
            > span {
                font-size: 0.6rem;
                line-height: 1.2em;
                color: #555;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }
        }
    }
    .time {
        font-size: 0.5rem;
        color: #888;
    }
    > button {
        position: absolute;
        top: 0;
        right: 0;
        margin: 0;
        padding: 0;
        font-size: 12px;
        background-color: #d13438 !important;
        border-radius: 50%;
        color: #fff !important;
        width: 1.2em;
        height: 1.2em;
        i {
            font-weight: 1000;
            line-height: 1em;
            width: 1em;
            height: 1em;
            transform: scale(0.4);
        }
        opacity: 0.5;
        :hover {
            opacity: 1;
        }
    }
    & .hover-only:not([aria-selected=true]) {
        visibility: hidden;
    }
    :hover {
        background-color: #8881;
        & .hover-only {
            visibility: visible;
        }
    }
    cursor: pointer;
`;

const UserTagGroupContainer = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: row;
    background-image: linear-gradient(to bottom, #8881, transparent 5px);
    padding: 0 5px;
    > svg {
        margin: 0 ${UserTagGroupPadding}px;
        cursor: pointer;
        transition: transform 200ms;
        transform: translateY(-67%);
        opacity: 0.2;
        :hover {
            opacity: 0.95;
            transform: translateY(-4px);
        }
        &[aria-selected=true] {
            opacity: 1;
            transform: translateY(-3px);
            animation: pull 400ms linear forwards;
        }
        &[aria-selected=false] {
            transition: transform 100ms;
            filter: saturate(0.75);
        }
        > * {
            pointer-events: none;
            filter: drop-shadow(0.8px 1px 0.6px #888);
        }
        :not(:first-child) {
            margin-left: ${-0.2 * UserTagGroupSize - UserTagGroupPadding}px;
        }
    }
    @keyframes pull {
        from {
            transform: translateY(-4px);
        }
        30% {
            transform: translateY(-1.5px);
        }
        to {
            transform: translateY(-3px);
        }
    }
`;

export function formatSize(kb: number) {
    if (kb < 1024) {
        return `${kb}KB`;
    }
    if (kb < 1024 * 1024) {
        return `${(kb / 1024).toFixed(2)}MB`;
    }
    return `${(kb / 1024 / 1024).toFixed(2)}GB`;
}

export interface IHistoryListItemProps {
    file: IDBMeta;
    rowIndex: number;
    colIndex: number;
    handleClick?: (item: IDBMeta) => void;
    handleClearClick?: (itemId: string) => void;
    handleRefresh?: () => void;
}

const HistoryListItem: FC<IHistoryListItemProps> = ({
    file, rowIndex, colIndex, handleClick, handleClearClick, handleRefresh,
}) => {
    const ext = file.name.endsWith(RathDemoVirtualExt) ? RathDemoVirtualExt : /\.([^./]+)$/.exec(file.name)?.[1];
    const isRathDemo = ext === RathDemoVirtualExt;
    const name = isRathDemo ? file.name.replace(new RegExp(`\\.${RathDemoVirtualExt.replaceAll(/\./g, '\\.')}$`), '') : file.name;

    return (
        <ListItem
            role="gridcell"
            aria-rowindex={rowIndex}
            aria-colindex={colIndex}
            onClick={() => handleClick?.(file)}
        >
            <div className="head" role="button" tabIndex={0}>
                <Icon iconName={getFileIcon(isRathDemo ? '' : file.name)} />
                <div>
                    <header>
                        <TooltipHost content={name}>
                            <span>{name}</span>
                        </TooltipHost>
                    </header>
                    <span>
                        {`${ext ? `${isRathDemo ? `Rath ${intl.get(`dataSource.importData.type.${IDataSourceType.DEMO}`)
                                }` : ext
                            } - ` : ''}${formatSize(file.size)}`}
                    </span>
                </div>
            </div>
            <div className="time">
                <p>{`${intl.get('dataSource.upload.lastOpen')}: ${dayjs(file.editTime).toDate().toLocaleString()}`}</p>
            </div>
            <UserTagGroupContainer onClick={e => e.stopPropagation()}>
                {allUserTagGroups.map(key => {
                    const selected = file.userTagGroup === key;
                    return (
                        <svg
                            key={key} aria-selected={selected} className="hover-only"
                            width={UserTagGroupSize} height={24} viewBox={`-1 -1 ${UserTagGroupSize + 2} 26`}
                            fill={userTagGroupColors[key]} stroke="none"
                            onClick={() => {
                                updateDataStorageUserTagGroup(file.id, selected ? undefined : key);
                                handleRefresh?.();
                            }}
                        >
                            <path d={`M0,0 h${UserTagGroupSize} v16 l-${UserTagGroupSize / 2},4 l-${UserTagGroupSize / 2},-4 Z`} />
                        </svg>
                    );
                })}
            </UserTagGroupContainer>
            <IconButton
                className="hover-only"
                title="Delete"
                iconProps={{ iconName: 'Remove' }}
                onClick={e => {
                    e.stopPropagation();
                    handleClearClick?.(file.id);
                }}
            />
        </ListItem>
    );
};

export default observer(HistoryListItem);
