import React from 'react';
import { Icon } from '@fluentui/react';
import styled from 'styled-components';
import { callTerminator, cancelTerminator, IErrorInfo } from './store';
interface MessageProps extends IErrorInfo {
    onClose: () => void;
}

const Cont = styled.div`
    box-shadow: 0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d;
    min-width: 360px;
    background-color: #ffffff;
    /* z-50 mt-4 bg-white p-4 border-solid border-1 border-grey-50 grid grid-cols-6 relative */
    z-index: 50;
    padding: 1em 1em 1.2em;
    border: 1px solid #88888844;
    display: grid;
    grid-template-columns: repeat(6, calc(100% / 6));
    position: relative;
    @keyframes cont-show{
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }
    animation: cont-show 0.36s;
    .cancel-icon{
        position: absolute;
        right: 1em;
        top: 1em;
        cursor: pointer;
    }
    .text-red-500{
        color: #EF4444;
    }
    .text-yellow-500{
        color: #F59E0B;
    }
    .text-green-500{
        color: #10B981;
    }
    .text-blue-500{
        color: #3B82F6;
    }
    .text-2xl{
        font-size: 1.5em;
    }
    .allow-break-line{
        white-space: pre-line;
        font-size: 12px;
    }
    .col-span-5 {
        grid-column: 2 / 6;
    }
    h1 {
        font-size: 1rem;
        margin-block: 0 0.8em;
    }
`

const MessageCard: React.FC<MessageProps> = props => {
    const { title, content, type, onClose } = props;

    return <Cont
        onMouseLeave={() => {
            callTerminator();
        }}
        onMouseEnter={() => {
            cancelTerminator()
        }}>
            <Icon iconName="Cancel" className="cancel-icon" onClick={onClose} />
            <div>
                {type === 'error' && <Icon iconName="ErrorBadge" className="text-red-500 text-2xl" />}
                {type === 'warning' && <Icon iconName="Blocked2" className="text-yellow-500 text-2xl" />}
                {type === 'success' && <Icon iconName="Completed" className="text-green-500 text-2xl" />}
                {type === 'info' && <Icon iconName="Info" className="text-blue-500 text-2xl" />}
            </div>
        <div className="col-span-5">
            <h1 className="text-base">{title}</h1>
            <div className="text-sm mt-1 text-gray-600 allow-break-line">{content}</div>
        </div>
    </Cont>
}

export default MessageCard;