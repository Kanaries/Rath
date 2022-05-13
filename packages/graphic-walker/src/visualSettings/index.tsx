import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Container } from '../components/container';
import { LiteForm } from '../components/liteForm';
import SizeSetting from '../components/sizeSetting';
import { CHART_LAYOUT_TYPE, GEMO_TYPES } from '../config';
import { useGlobalStore } from '../store';

interface VisualSettinsProps {

}
const VisualSettings: React.FC<VisualSettinsProps> = props => {
    const { vizStore } = useGlobalStore();
    const { visualConfig, sortCondition } = vizStore;
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
                <label>布局</label>
                <select
                    className="border border-gray-500 rounded-sm text-xs pt-0.5 pb-0.5 pl-2 pr-2"
                    value={visualConfig.size.mode}
                    onChange={(e) => {
                        // vizStore.setVisualConfig('geoms', [e.target.value]);
                        vizStore.setChartLayout({
                            mode: e.target.value as any
                        })
                    }}
                >
                    {CHART_LAYOUT_TYPE.map((g) => (
                        <option key={g.value} value={g.value}>
                            {g.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="item hover:bg-yellow-100">
                <SizeSetting
                    width={visualConfig.size.width}
                    height={visualConfig.size.height}
                    onHeightChange={(v) => {
                        vizStore.setChartLayout({
                            mode: "fixed",
                            height: v
                        })
                    }}
                    onWidthChange={(v) => {
                        vizStore.setChartLayout({
                            mode: "fixed",
                            width: v
                        })
                    }}
                />
                <label className="text-xs text-color-gray-700 ml-2">布局尺寸</label>
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
            <div className="item">
                <label className="text-xs text-color-gray-700 mr-2">排序</label>
                <SortAscendingIcon className={`w-4 inline-block mr-1 ${!sortCondition ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => {
                    vizStore.applyDefaultSort('ascending')
                }} />
                <SortDescendingIcon className={`w-4 inline-block mr-1 ${!sortCondition ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => {
                    vizStore.applyDefaultSort('descending');
                }} />
            </div>
        </LiteForm>
    </Container>
}

export default observer(VisualSettings);