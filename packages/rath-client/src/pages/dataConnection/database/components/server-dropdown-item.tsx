import styled from 'styled-components';
import type { JSX } from 'react';
import { RathIcon } from '../../../../components/icons';
import { Button } from '../../../../components/ui/button';
import { Spinner } from '../../../../components/ui/spinner';
import { defaultServers } from '../main';

const ServerItem = styled.div`
    cursor: pointer;
    outline: none;
    user-select: none;
    padding: 4px 8px;
    :hover {
        background-color: var(--border);
    }
    &[aria-selected='true'] {
        cursor: default;
        background-color: var(--muted);
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
    color: var(--muted-foreground);
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
        &[aria-disabled='true'] {
            cursor: default;
        }
    }
`;

export interface ServerDropdownItem {
    checked: boolean;
    key: string;
    text: 'unknown' | 'pending' | 'fulfilled' | 'rejected' | 'new';
    secondaryText: string;
}

export const renderServerItem = (
    onClick: (target: string) => void,
    onDelete: (target: string) => void,
    onRefresh: (target: string) => void,
    props: ServerDropdownItem | undefined
): JSX.Element => {
    if (!props) {
        return <></>;
    }
    const { checked, key: target, text: status, secondaryText } = props;
    if (status === 'new') {
        return <TipsText>{secondaryText}</TipsText>;
    }
    const lag = Number(secondaryText);

    const isDefault = defaultServers.includes(target);
    const canDelete = status !== 'pending' && !isDefault;

    return (
        <ServerItem
            role="option"
            tabIndex={0}
            aria-selected={checked}
            onClick={(e) => {
                e.stopPropagation();
                onClick(target);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick(target);
                }
            }}
        >
            <StatusIconContainer>
                {status &&
                    status !== 'unknown' &&
                    {
                        fulfilled: (
                            <RathIcon
                                name="StatusCircleCheckmark"
                                size={18}
                                style={{
                                    borderRadius: '50%',
                                    color: 'green',
                                }}
                            />
                        ),
                        rejected: <RathIcon name="StatusCircleErrorX" size={18} style={{ color: 'red' }} />,
                        pending: <Spinner size="sm" style={{ margin: '3px 0' }} />,
                    }[status]}
            </StatusIconContainer>
            <div>
                <label>{target}</label>
                <LagText>{status === 'fulfilled' ? `${lag}ms` : '-'}</LagText>
            </div>
            <ActionGroup onClick={(e) => e.stopPropagation()}>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={status === 'pending'}
                    aria-label={`Refresh ${target}`}
                    title={`Refresh ${target}`}
                    onClick={() => onRefresh(target)}
                >
                    <RathIcon name="SyncOccurence" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canDelete}
                    aria-label={`Delete ${target}`}
                    title={`Delete ${target}`}
                    onClick={() => onDelete(target)}
                >
                    <RathIcon name="Delete" style={{ color: canDelete ? 'red' : undefined }} />
                </Button>
            </ActionGroup>
        </ServerItem>
    );
};
