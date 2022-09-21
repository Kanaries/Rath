import React from 'react';
import { observer } from 'mobx-react-lite';
import { MessageBar, MessageBarType } from '@fluentui/react';
import { useGlobalStore } from '../store';

const MessageSegment: React.FC = props => {
    const { commonStore } = useGlobalStore();
    const { messages } = commonStore;
    return <div>
        {
            messages.map((m, index) => <MessageBar key={index}
                    messageBarType={MessageBarType.error}
                    dismissButtonAriaLabel="Close"
                    onDismiss={() => { commonStore.removeError(index) }}
                >
                { m.content }
            </MessageBar>)
        }
    </div>
}

export default observer(MessageSegment);
