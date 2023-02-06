import { IconButton } from '@fluentui/react';
import { FC, Fragment } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';

export type IColStateType = 'preview' | 'source';

function getCellColor(colType?: IColStateType): string {
    if (colType === 'preview') {
        return 'rgb(255, 244, 206)';
    }
    if (colType === 'source') {
        return '#bae0ff';
    }
    return '#fff';
}

const Cont = styled.div<{ stateType?: IColStateType }>`
    height: 2.4em;
    position: relative;
    display: flex;
    justify-content: space-between;
    padding: 0 0.8em;
    > .title {
        font-weight: 600;
    }
    > div {
        display: flex;
        align-items: center;
    }
    .action-segment {
        padding: 0 0.8em;
    }
    background-color: ${(props) => getCellColor(props.stateType)};
`;

interface StatePlaceholderProps {
    stateType?: IColStateType;
    onAcceptExtField: () => void;
    onRejectExtField: () => void;
}
const StatePlaceholder: FC<StatePlaceholderProps> = (props) => {
    const { onAcceptExtField, onRejectExtField, stateType } = props;
    return (
        <Cont stateType={stateType}>
            {stateType === 'preview' && (
                <Fragment>
                    <div className="title">{intl.get('common.preview')}</div>
                    <div>
                        <IconButton
                            onClick={onAcceptExtField}
                            iconProps={{
                                iconName: 'CompletedSolid',
                                style: {
                                    color: '#c50f1f',
                                },
                            }}
                        />
                        <IconButton
                            onClick={onRejectExtField}
                            iconProps={{
                                iconName: 'Delete',
                                style: {
                                    color: '#c50f1f',
                                },
                            }}
                        />
                    </div>
                </Fragment>
            )}
            {stateType === 'source' && <div className="title">{intl.get('common.source')}</div>}
        </Cont>
    );
};

export default StatePlaceholder;
