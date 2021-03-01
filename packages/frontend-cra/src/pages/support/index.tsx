import React from 'react';
import intl from 'react-intl-universal';

const SupportPage: React.FC = props => {
    return (
        <div className="content-container">
            <div className="card">
                <iframe
                    title="help"
                    src={intl.get('support.link')}
                    style={{ width: '100%', height: '800px' }}
                    frameBorder="0"
                />
            </div>
        </div>
    );
}

export default SupportPage;
