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
    padding: 1rem;
    z-index: 100;
    margin-top: 1rem;
    border: 1px solid #f6f6f6;
    position: relative;
    display: grid;
    grid-template-columns: repeat(6,minmax(0,1fr));
    box-sizing: border-box;
    h1 {
        font-size: 16px;
        font-weight: 400;
    }
    h1, p {
        margin: 0;
        line-height: 1.5em;
    }
    >.span-5-content{
        grid-column: span 5 / span 5;
        >p{
            font-size: 12px;
        }
    }
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
    .text-gray-600{
        color: #4b5563;
    }
    .text-2xl{
        font-size: 1.5rem;
        line-height: 1.5rem;
        height: 1.5rem;
    }
    .allow-break-line{
        white-space: pre-line;
        font-size: 12px;
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
        <div className="span-5-content">
            <h1>{title}</h1>
            <p className="allow-break-line text-gray-600">{content}</p>
        </div>
    </Cont>
}

export default MessageCard;