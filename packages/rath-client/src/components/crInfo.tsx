/**
 * It is not allowed to change / remove / move / hide this "Power by Kanaries Rath" content.
 * The declearation must be shown in any kind of distribution.
 */
import React from 'react';

const CrInfo: React.FC = () => {
    return (
        <div className="kanaries-copy-right-footer">
            Powered by {
                <a
                    href={`${window.location.protocol}//rath.${window.location.host.split('.').slice(-2).join('.')}/`}
                    target="_blank"
                    rel="noreferrer"
                >
                    Kanaries Rath
                </a>
            }.
        </div>
    );
}

export default CrInfo;