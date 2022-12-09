import intl from 'react-intl-universal';
import { Icon, TooltipHost } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import type { FC } from "react";
import styled from "styled-components";
import { IDBMeta, UserTagGroup, userTagGroupColors } from "../../../../utils/storage";
import { RathDemoVirtualExt } from '../demo';
import { IDataSourceType } from '../../../../global';
import getFileIcon from './get-file-icon';


const allUserTagGroups = Object.keys(userTagGroupColors) as unknown as UserTagGroup[];

const UserTagGroupSize = 10;
const UserTagGroupPadding = 1.5;

const ITEM_WIDTH = ((UserTagGroupSize + UserTagGroupPadding * 2) * ((allUserTagGroups.length - 1) * 0.8 + 1) + 10) * 1.8;

const QueueItem = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: ${ITEM_WIDTH}px;
    height: 100%;
    margin-right: 0.4em;
    padding: 0.8em 0.6em 0.6em 1em;
    border-radius: 6px;
    position: relative;
    box-shadow: inset 0 0 1.2px #8884;
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
    & [aria-selected=false] {
        visibility: hidden;
    }
    :hover {
        background-color: #88888816;
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
        transition: transform 200ms;
        transform: translateY(-67%);
        opacity: 0.2;
        &[aria-selected=true] {
            opacity: 1;
            transform: translateY(-3px);
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

export interface IHistoryQueueItemProps {
    file: IDBMeta;
    handleClick?: (item: IDBMeta) => void;
}

const HistoryQueueItem: FC<IHistoryQueueItemProps> = ({ file, handleClick }) => {
    const ext = file.name.endsWith(RathDemoVirtualExt) ? RathDemoVirtualExt : /(?<=\.)[^.]+$/.exec(file.name)?.[0];
    const isRathDemo = ext === RathDemoVirtualExt;
    const name = isRathDemo ? file.name.replace(new RegExp(`\\.${RathDemoVirtualExt.replaceAll(/\./g, '\\.')}$`), '') : file.name;

    return (
        <QueueItem onClick={() => handleClick?.(file)}>
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
            <UserTagGroupContainer onClick={e => e.stopPropagation()}>
                {allUserTagGroups.map(key => {
                    const selected = file.userTagGroup === key;
                    return (
                        <svg
                            key={key} aria-selected={selected} className="hover-only"
                            width={UserTagGroupSize} height={24} viewBox={`-1 -1 ${UserTagGroupSize + 2} 26`}
                            fill={userTagGroupColors[key]} stroke="none"
                        >
                            <path d={`M0,0 h${UserTagGroupSize} v16 l-${UserTagGroupSize / 2},4 l-${UserTagGroupSize / 2},-4 Z`} />
                        </svg>
                    );
                })}
            </UserTagGroupContainer>
        </QueueItem>
    );
};

export default observer(HistoryQueueItem);
