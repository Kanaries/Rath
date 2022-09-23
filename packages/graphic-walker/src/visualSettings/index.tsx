import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styled from 'styled-components'
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { LiteForm } from '../components/liteForm';
import SizeSetting from '../components/sizeSetting';
import { CHART_LAYOUT_TYPE, GEMO_TYPES, STACK_MODE } from '../config';
import { useGlobalStore } from '../store';
import { IStackMode } from '../interfaces';


export const LiteContainer = styled.div`
    margin: 0.2em;
    border: 1px solid #d9d9d9;
    padding: 1em;
    background-color: #fff;
`;

const VisualSettings: React.FC = () => {
    const { vizStore } = useGlobalStore();
    const { visualConfig, sortCondition } = vizStore;
    const { t: tGlobal } = useTranslation();
    const { t } = useTranslation('translation', { keyPrefix: 'main.tabpanel.settings' });

    return <LiteContainer>
        <LiteForm style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="item">
                <input
                    className="cursor-pointer"
                    type="checkbox"
                    id="toggle:aggregation"
                    aria-describedby="toggle:aggregation:label"
                    checked={visualConfig.defaultAggregated}
                    onChange={(e) => {
                        vizStore.setVisualConfig('defaultAggregated', e.target.checked);
                    }}
                />
                <label
                    className="text-xs text-color-gray-700 ml-2 cursor-pointer"
                    id="toggle:aggregation:label"
                    htmlFor="toggle:aggregation"
                >
                    {t('toggle.aggregation')}
                </label>
            </div>
            <div className="item">
                <label
                    className="px-2"
                    id="dropdown:mark_type:label"
                    htmlFor="dropdown:mark_type"
                >
                    {tGlobal('constant.mark_type.__enum__')}
                </label>
                <select
                    className="border border-gray-500 rounded-sm text-xs pt-0.5 pb-0.5 pl-2 pr-2 cursor-pointer"
                    id="dropdown:mark_type"
                    aria-describedby="dropdown:mark_type:label"
                    value={visualConfig.geoms[0]}
                    onChange={(e) => {
                        vizStore.setVisualConfig('geoms', [e.target.value]);
                    }}
                >
                    {GEMO_TYPES.map(g => (
                        <option
                            key={g}
                            value={g}
                            aria-selected={visualConfig.geoms[0] === g}
                            className="cursor-pointer"
                        >
                            {tGlobal(`constant.mark_type.${g}`)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="item">
                <label
                    className="px-2"
                    id="dropdown:stack:label"
                    htmlFor="dropdown:stack"
                >
                    {tGlobal('constant.stack_mode.__enum__')}
                </label>
                <select
                    className="border border-gray-500 rounded-sm text-xs pt-0.5 pb-0.5 pl-2 pr-2 cursor-pointer"
                    id="dropdown:stack"
                    aria-describedby="dropdown:stack:label"
                    value={visualConfig.stack}
                    onChange={(e) => {
                        vizStore.setVisualConfig('stack', e.target.value as IStackMode);
                    }}
                >
                    {STACK_MODE.map(g => (
                        <option
                            key={g}
                            value={g}
                            aria-selected={visualConfig.stack === g}
                            className="cursor-pointer"
                        >
                            {tGlobal(`constant.stack_mode.${g}`)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="item">
                <input
                    type="checkbox"
                    className="cursor-pointer"
                    id="toggle:axes_resize"
                    aria-describedby="toggle:axes_resize:label"
                    checked={visualConfig.interactiveScale}
                    onChange={(e) => {
                        vizStore.setVisualConfig('interactiveScale', e.target.checked);
                    }}
                />
                <label
                    className="text-xs text-color-gray-700 ml-2 cursor-pointer"
                    id="toggle:axes_resize:label"
                    htmlFor="toggle:axes_resize"
                >
                    {t('toggle.axes_resize')}
                </label>
            </div>
            <div className="item">
                <label className="text-xs text-color-gray-700 mx-2">
                    {t('sort')}
                </label>
                <BarsArrowUpIcon
                    className={`w-4 inline-block mr-1 ${!sortCondition ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => {
                        vizStore.applyDefaultSort('ascending')
                    }}
                    role="button"
                    tabIndex={!sortCondition ? undefined : 0}
                    aria-disabled={!sortCondition}
                    xlinkTitle={t('button.ascending')}
                    aria-label={t('button.ascending')}
                />
                <BarsArrowDownIcon
                    className={`w-4 inline-block mr-1 ${!sortCondition ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => {
                        vizStore.applyDefaultSort('descending');
                    }}
                    role="button"
                    tabIndex={!sortCondition ? undefined : 0}
                    aria-disabled={!sortCondition}
                    xlinkTitle={t('button.descending')}
                    aria-label={t('button.descending')}
                />
            </div>
            <div className='item'>
                <label
                    className="text-xs text-color-gray-700 mr-2"
                    htmlFor="button:transpose"
                    id="button:transpose:label"
                >
                    {t('button.transpose')}
                </label>
                <ArrowPathIcon
                    className="w-4 inline-block mr-1 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    id="button:transpose"
                    aria-describedby="button:transpose:label"
                    xlinkTitle={t('button.transpose')}
                    aria-label={t('button.transpose')}
                    onClick={() => {
                        vizStore.transpose();
                    }}
                />
            </div>
            <div className="item">
                <label
                    id="dropdown:layout_type:label"
                    htmlFor="dropdown:layout_type"
                >
                    {tGlobal(`constant.layout_type.__enum__`)}
                </label>
                <select
                    className="border border-gray-500 rounded-sm text-xs pt-0.5 pb-0.5 pl-2 pr-2 cursor-pointer"
                    id="dropdown:layout_type"
                    aria-describedby="dropdown:layout_type:label"
                    value={visualConfig.size.mode}
                    onChange={(e) => {
                        // vizStore.setVisualConfig('geoms', [e.target.value]);
                        vizStore.setChartLayout({
                            mode: e.target.value as any
                        })
                    }}
                >
                    {CHART_LAYOUT_TYPE.map(g => (
                        <option
                            key={g}
                            value={g}
                            className="cursor-pointer"
                            aria-selected={visualConfig.size.mode === g}
                        >
                            {tGlobal(`constant.layout_type.${g}`)}
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
                <label
                    className="text-xs text-color-gray-700 ml-2"
                    htmlFor="button:size_setting"
                    id="button:size_setting:label"
                >
                    {t('size')}
                </label>
            </div>
            <div className="item">
                <input
                    type="checkbox"
                    checked={visualConfig.showActions}
                    id="toggle:debug"
                    aria-describedby="toggle:debug:label"
                    className="cursor-pointer"
                    onChange={(e) => {
                        vizStore.setVisualConfig('showActions', e.target.checked);
                    }}
                />
                <label
                    className="text-xs text-color-gray-700 ml-2 cursor-pointer"
                    id="toggle:debug:label"
                    htmlFor="toggle:debug"
                >
                    {t('toggle.debug')}
                </label>
            </div>
        </LiteForm>
    </LiteContainer>
}

export default observer(VisualSettings);