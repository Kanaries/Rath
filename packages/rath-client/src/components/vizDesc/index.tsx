import { Spinner } from '@fluentui/react';
import React, { useEffect } from 'react';
import intl from 'react-intl-universal';
import { getEnhanceService } from '../../services/enhance';

interface VizDescProps {
    spec?: any;
}
const VizDesc: React.FC<VizDescProps> = (props) => {
    const { spec } = props;
    const [desc, setDesc] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    useEffect(() => {
        if (spec) {
            const liteSpec: { [key: string]: any } = {};
            Object.keys(spec).forEach((key) => {
                if (key !== 'data') {
                    liteSpec[key] = spec[key];
                }
            });
            setLoading(true);
            fetch(getEnhanceService('/api/vldesc'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    spec: liteSpec,
                    lang: intl.getInitOptions().currentLocale,
                }),
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.success) {
                        setDesc(res.data);
                    }
                }).finally(() => {
                    setLoading(false);
                })
        }
    }, [spec]);

    return (
        <div>
            {!loading && desc.split(/\n+/).map((p, pi) => (
                <p key={pi}>{p}</p>
            ))}
            {loading && <Spinner label='describing vis...' />}
        </div>
    );
};

export default VizDesc;
