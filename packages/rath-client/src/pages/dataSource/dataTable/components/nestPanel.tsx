import { DefaultButton, Stack } from '@fluentui/react';
import { FC } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';

const Cont = styled.div`
    background-color: #fff;
    min-width: 260px;
    border: 1px solid #f0f0f0;
    flex-shrink: 0;
    flex-grow: 0;
    position: relative;
    > .children-content{
        padding: 8px;
        overflow-y: auto;
        position: absolute;
        bottom: 52px;
        top: 0px;
        left: 0px;
        right: 0px;
    }
    > .action-bar {
        height: 52px;
        position: absolute;
        bottom: 0px;
        padding: 10px;
        left: 0px;
        right: 0px;
        background-color: #fff;
    }
`

interface NestPanelProps {
    show: boolean;
    onClose: () => void;
}
const NestPanel: FC<NestPanelProps> = props => {
    const { show = true, onClose } = props;
    return <Cont style={{ display: show ? undefined : 'none' }}>
        <div className='children-content'>
        {
            props.children
        }
        </div>
        <div className="action-bar">
            <Stack tokens={{ childrenGap: 10 }}>
                <DefaultButton text={intl.get('common.cancel')} onClick={onClose} />
            </Stack>
        </div>
    </Cont>
}

export default NestPanel
