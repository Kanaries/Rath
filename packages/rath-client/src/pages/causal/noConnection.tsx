import intl from 'react-intl-universal';
import type { FC } from "react";
import styled from 'styled-components';
import { Icon, MessageBar, MessageBarType } from '@fluentui/react';


const Container = styled.p`
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
                isMultiline={false}
                messageBarType={MessageBarType.warning}
                styles={{ icon: { paddingTop: '0.16em' } }}
            >
                <span>{intl.get('causal.no_connection.before')}</span>
                <a href={`mailto:${SupportMailAddr}?subject=${encodeURIComponent(intl.get('causal.no_connection.subject'))}`}>
                    {intl.get('causal.no_connection.text')}
                    {`(${SupportMailAddr})`}
                    <Icon iconName="MailForward" />
                </a>
                <span>{intl.get('causal.no_connection.after')}</span>
            </MessageBar>
        </Container>
    );
};


export default NoConnection;
