import { observer } from 'mobx-react-lite';
import React from 'react';
import { Container } from '../components/container';
import { LiteForm } from '../components/liteForm';
import { GEMO_TYPES } from '../config';
import { useGlobalStore } from '../store';

interface VisualSettinsProps {

}
const VisualSettings: React.FC<VisualSettinsProps> = props => {
    const { vizStore } = useGlobalStore();
    const { visualConfig } = vizStore;
    return <Container>
        <LiteForm style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="item">
                <input type="checkbox" checked={visualConfig.defaultAggregated} onChange={(e) => {
                    vizStore.setVisualConfig('defaultAggregated', e.target.checked);
                }} />
                <label className="text-xs text-color-gray-700 ml-2">聚合度量</label>
            </div>
            <div className="item">
                <input type="checkbox" checked={visualConfig.defaultStack} onChange={(e) => {
                    vizStore.setVisualConfig('defaultStack', e.target.checked);
                }} />
                <label className="text-xs text-color-gray-700 ml-2">开启堆叠</label>
            </div>
            <div className="item">
                <label>标记类型</label>
                <select
                    className="border border-gray-500 rounded-sm text-xs pt-0.5 pb-0.5 pl-2 pr-2"
                    value={visualConfig.geoms[0]}
                    onChange={(e) => {
                        vizStore.setVisualConfig('geoms', [e.target.value]);
                    }}
                >
                    {GEMO_TYPES.map((g) => (
                        <option key={g.value} value={g.value}>
                            {g.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="item">
                <input type="checkbox" checked={visualConfig.interactiveScale} onChange={(e) => {
                    vizStore.setVisualConfig('interactiveScale', e.target.checked);
                }} />
                <label className="text-xs text-color-gray-700 ml-2">坐标系缩放</label>
            </div>
            <div className="item">
                <input type="checkbox" checked={visualConfig.showActions} onChange={(e) => {
                    vizStore.setVisualConfig('showActions', e.target.checked);
                }} />
                <label className="text-xs text-color-gray-700 ml-2">图表调试</label>
            </div>
        </LiteForm>
    </Container>
}

export default observer(VisualSettings);