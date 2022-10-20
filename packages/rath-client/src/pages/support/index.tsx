import { Spinner, SpinnerSize } from '@fluentui/react';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';

const StatusIframe = styled.iframe`
   width: 100%;
   height: 800px;
`

const SupportPage: React.FC = props => {
    const [loading, setLoading] = useState<boolean>(true);
    return (
        <div className="content-container">
            <div className="card">
                {
                    loading && <Spinner label='loading' size={SpinnerSize.large} />
                }
                <StatusIframe
                    title="help"
                    placeholder='loading'
                    onLoad={() => {
                        setLoading(false);
                    }}
                    src={intl.get('support.link')}
                    frameBorder="0"
                />
            </div>
        </div>
    );
}

export default SupportPage;
