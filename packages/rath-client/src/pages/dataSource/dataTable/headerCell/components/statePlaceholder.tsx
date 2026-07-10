import { FC, Fragment } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { RathIcon } from '../../../../../components/icons';
import { Button } from '../../../../../components/ui/button';

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
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-[#c50f1f]"
                            onClick={onAcceptExtField}
                        >
                            <RathIcon name="CompletedSolid" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-[#c50f1f]"
                            onClick={onRejectExtField}
                        >
                            <RathIcon name="Delete" />
                        </Button>
                    </div>
                </Fragment>
            )}
            {stateType === 'source' && <div className="title">{intl.get('common.source')}</div>}
        </Cont>
    );
};

export default StatePlaceholder;
