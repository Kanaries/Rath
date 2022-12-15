import type { FC } from "react";
import styled from 'styled-components';
import { Icon, MessageBar, MessageBarType } from '@fluentui/react';
import { getI18n } from './locales';


const Container = styled.div`
    color: #ff8c00;
    font-size: 0.8rem;
    margin: 1em 0;
    & i {
        margin: 0 0.4em;
    }
    & a {
        margin: 0 0.2em;
        color: #0078d4;
        text-decoration: underline;
        cursor: pointer;
        :hover {
            color: #5caae5;
        }
        > i {
            font-size: 80%;
            margin-inline-start: 0.4em;
        }
    }
`;

const SupportMailAddr = 'support@kanaries.org';

const NoConnection: FC = () => {
    return (
        <Container>
            <MessageBar
                messageBarType={MessageBarType.warning}
                styles={{ icon: { paddingTop: '0.26em' } }}
                style={{ lineHeight: '1.4em', padding: '0.2em 0' }}
            >
                <span>{getI18n('no_connection.before')}</span>
                <a href={`mailto:${SupportMailAddr}?subject=${encodeURIComponent(getI18n('no_connection.subject'))}`}>
                    {getI18n('no_connection.text')}
                    {`(${SupportMailAddr})`}
                    <Icon iconName="MailForward" />
                </a>
                <span>{getI18n('no_connection.after')}</span>
            </MessageBar>
        </Container>
    );
};


export default NoConnection;
