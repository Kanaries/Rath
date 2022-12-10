import { IconButton } from '@fluentui/react';
import { FC } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';

const Cont = styled.div`
    height: 2.4em;
    .action-segment {
        display: flex;
        justify-content: space-between;
        left: 0px;
        right: 0px;
        top: 0px;
        .title {
            font-weight: 600;
        }
        > div {
            display: flex;
            align-items: center;
        }
        padding: 0 0.8em;
    }
    .preview {
        color: #000;
        background-color: rgb(255, 244, 206);
    }
`

interface StatePlaceholderProps {
    preview: boolean;
    onAcceptExtField: () => void;
    onRejectExtField: () => void;
}
const StatePlaceholder: FC<StatePlaceholderProps> = props => {
    const { preview, onAcceptExtField, onRejectExtField } = props;
    return <Cont>
        {preview && (
            <div className="preview action-segment">
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
            </div>
        )}
    </Cont>
}

export default StatePlaceholder;
