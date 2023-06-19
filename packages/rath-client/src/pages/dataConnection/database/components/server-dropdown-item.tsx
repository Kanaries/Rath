import styled from "styled-components";
import { Icon, IconButton, Spinner, IContextualMenuItem, SpinnerSize } from "@fluentui/react";
import { defaultServers } from '../main';


const ServerItem = styled.div`
    cursor: pointer;
    outline: none;
    user-select: none;
    padding: 4px 8px;
    :hover {
        background-color: #eee;
    }
    &[aria-checked="true"] {
        cursor: default;
        background-color: #f3f3f3;
    }
    & * {
        cursor: inherit;
    }
    display: flex;
    flex-direction: row;
    > * {
        padding: 4px;
        flex-grow: 1;
        flex-shrink: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
`;

const StatusIconContainer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    align-items: center;
    width: 2.4em;
    font-size: 1.1rem;
`;

const LagText = styled.span`
    display: inline-block;
    font-size: 0.7rem;
    min-width: 2em;
    width: max-content;
    text-align: center;
    color: #666;
`;

const TipsText = styled.div`
    user-select: none;
    font-style: italic;
    padding: 1em;
`;

const ActionGroup = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    flex-direction: row;
    cursor: unset;
    button {
        cursor: pointer;
        &[aria-disabled="true"] {
            cursor: default;
        }
    }
`;

export const renderServerItem = (
    onClick: (target: string) => void,
    onDelete: (target: string) => void,
    onRefresh: (target: string) => void,
    props: IContextualMenuItem | undefined,
): JSX.Element => {
    if (!props) {
        return <></>;
    }
    const { checked, key: target, text: status, secondaryText } = props as {
        checked: boolean;
        key: string;
        text: 'unknown' | 'pending' | 'fulfilled' | 'rejected' | 'new';
        secondaryText: string;
    };
    if (status === 'new') {
        return (
            <TipsText>
                {secondaryText}
            </TipsText>
        );
    }
    const lag = Number(secondaryText);

    const isDefault = defaultServers.includes(target);
    const canDelete = status !== 'pending' && !isDefault;

    return (
        <ServerItem
            role="option"
            tabIndex={0}
            aria-checked={checked}
            onClick={e => {
                e.stopPropagation();
                onClick(target);
            }}
        >
            <StatusIconContainer>
                {status && status !== 'unknown' && {
                    fulfilled: (
                        <Icon
                            iconName="StatusCircleCheckmark"
                            style={{
                                borderRadius: '50%',
                                color: 'green',
                            }}
                        />
                    ),
                    rejected: <Icon iconName="StatusCircleErrorX" style={{ color: 'red' }} />,
                    pending: <Spinner size={SpinnerSize.small} style={{ margin: '3px 0' }} />,
                }[status]}
            </StatusIconContainer>
            <div>
                <label>{target}</label>
                <LagText>{status === 'fulfilled' ? `${lag}ms` : '-'}</LagText>
            </div>
            <ActionGroup onClick={e => e.stopPropagation()}>
                <IconButton
                    disabled={status === 'pending'}
                    iconProps={{ iconName: 'SyncOccurence' }}
                    onClick={() => onRefresh(target)}
                />
                <IconButton
                    disabled={!canDelete}
                    iconProps={{ iconName: 'Delete', style: { color: canDelete ? 'red' : undefined } }}
                    onClick={() => onDelete(target)}
                />
            </ActionGroup>
        </ServerItem>
    );
};
