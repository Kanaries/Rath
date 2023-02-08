import { TextField, Stack, PrimaryButton, DefaultButton, Spinner } from '@fluentui/react';
import React, { useCallback, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { getConnectorServiceInfo, setConnectorServiceInfo } from './api';

interface CustomConfigProps {
    ping: () => void;
    loading?: boolean;
}
const CustomConfig: React.FC<CustomConfigProps> = (props) => {
    const { ping, loading } = props;
    const [show, setShow] = useState<boolean>(false);
    const [serviceInfo, setServiceInfo] = useState('');
    useEffect(() => {
        setServiceInfo(getConnectorServiceInfo());
    }, []);
    const serviceInfoHandler = useCallback(() => {
        setConnectorServiceInfo(serviceInfo);
        ping();
    }, [serviceInfo, ping]);
    return (
        <div style={{ margin: '1em 0em' }}>
            <DefaultButton
                text={intl.get('dataSource.connectorConfig')}
                onClick={() => {
                    setShow((v) => !v);
                }}
                iconProps={{ iconName: 'Settings' }}
            />
            {loading && <Spinner label="loading" />}
            {show && (
                <Stack horizontal verticalAlign="end" tokens={{ childrenGap: '6px' }}>
                    <TextField
                        style={{ width: '260px' }}
                        label={intl.get('dataSource.connectorService')}
                        value={serviceInfo}
                        onChange={(e, val) => {
                            setServiceInfo(val + '');
                        }}
                    />
                    <PrimaryButton text={intl.get('dataSource.apply')} onClick={serviceInfoHandler} />
                </Stack>
            )}
        </div>
    );
};

export default CustomConfig;
