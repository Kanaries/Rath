import { observer } from 'mobx-react-lite';
import React from 'react';
import { Container } from '../components/container';
import { LiteForm } from '../components/liteForm';
import { GEMO_TYPES } from '../config';
import { useGlobalStore } from '../store';

interface VisualSettinsProps {

}
const VisualSettings: React.FC<VisualSettinsProps> = props => {
    const { commonStore } = useGlobalStore();
    const { visualConfig } = commonStore;
    return <Container>
        <LiteForm style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="item">
                <input type="checkbox" checked={visualConfig.defaultAggregated} onChange={(e) => {
                    commonStore.setVisualConfig('defaultAggregated', e.target.checked);
                }} />
                <label className="text-xs text-color-gray-700 ml-2">聚合度量</label>
            </div>
            <div className="item">
                <label>标记类型</label>
                <select
                    className="border border-gray-500 rounded-sm text-xs pt-0.5 pb-0.5 pl-2 pr-2"
                    value={visualConfig.geoms[0]}
                    onChange={(e) => {
                        commonStore.setVisualConfig('geoms', [e.target.value]);
                    }}
                >
                    {GEMO_TYPES.map((g) => (
                        <option key={g.value} value={g.value}>
                            {g.label}
                        </option>
                    ))}
                </select>
            </div>
        </LiteForm>
    </Container>
}

export default observer(VisualSettings);