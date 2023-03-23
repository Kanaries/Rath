import { Spinner } from '@fluentui/react';
import React, { useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { getEnhanceService } from '../../services/enhance';
import { useGlobalStore } from '../../store';
import { useInsightExpl } from '../../pages/semiAutomation/narrative';

const DescCardContainer = styled.div`
    display: flex;
`;
const DescCard = styled.div<{ type: 'data' | 'viz' }>`
    padding: 1em;
    margin: 0px 8px;
    flex-basis: 200px;
    flex-shrink: 1;
    border-top: 3px solid ${(props) => (props.type === 'data' ? '#10b981' : '#3b82f6')};
    box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.1);
    > h2 {
        font-size: 1.2em;
        font-weight: 600;
        margin-bottom: 0.5em;
    }
`;
interface VizDescProps {
    spec?: any;
}
const VizDesc: React.FC<VizDescProps> = (props) => {
    const { commonStore, semiAutoStore } = useGlobalStore();
    const { llmType } = commonStore;
    const { spec } = props;
    const [desc, setDesc] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const requestIdRef = useRef(0);
    const lang = intl.getInitOptions().currentLocale ?? 'en';
    const { explainLoading, dataDesc } = useInsightExpl(semiAutoStore, lang);

    useEffect(() => {
        if (spec) {
            const liteSpec: { [key: string]: any } = {};
            Object.keys(spec).forEach((key) => {
                if (key !== 'data') {
                    liteSpec[key] = spec[key];
                }
            });
            setLoading(true);
            requestIdRef.current++;
            let rid = requestIdRef.current;
            fetch(getEnhanceService('/api/vldesc'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    spec: liteSpec,
                    lang: intl.getInitOptions().currentLocale,
                    model: llmType,
                }),
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.success && rid === requestIdRef.current) {
                        setDesc(res.data);
                    }
                })
                .catch((err) => {
                    setDesc('');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [spec, llmType]);

    return (
        <div style={{ paddingTop: '8px' }}>
            <DescCardContainer>
                {!loading &&
                    desc.length > 0 &&
                    desc
                        .split(/\n+/)
                        .filter((p) => p.length > 0)
                        .map((p, pi) => (
                            <DescCard type="viz" key={pi}>
                                {p}
                            </DescCard>
                        ))}
                {!explainLoading &&
                    dataDesc.length > 0 &&
                    dataDesc.map((p, pi) => (
                        <DescCard type="data" key={pi}>
                            <h2>{p.type}</h2>
                            <p>{p.explain}</p>
                        </DescCard>
                    ))}
            </DescCardContainer>
            {(loading || explainLoading) && <Spinner style={{ marginTop: '1em' }} label={intl.get('common.generate.desc')} />}
        </div>
    );
};

export default observer(VizDesc);
