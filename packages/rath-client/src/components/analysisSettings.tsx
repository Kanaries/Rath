import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { ICubeStorageManageMode } from 'visual-insights';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../store';

import { COMPUTATION_ENGINE, EXPLORE_MODE } from '../constants';
import { ITaskTestMode } from '../interfaces';
import { LabelWithDesc } from './labelTooltip';
import { RathSelect, RathSelectOption } from './rath-ui/rath-select';

const AnalysisSettings: React.FC = () => {
    const { ltsPipeLineStore, commonStore } = useGlobalStore();

    const options = useMemo<RathSelectOption[]>(() => {
        return [
            {
                text: 'disk',
                key: ICubeStorageManageMode.LocalDisk,
            },
            {
                text: 'mix',
                key: ICubeStorageManageMode.LocalMix,
            },
            {
                text: 'memory',
                key: ICubeStorageManageMode.LocalCache,
            },
        ];
    }, []);
    const engineOptions: RathSelectOption[] = [
        { text: intl.get(`config.computationEngine.${COMPUTATION_ENGINE.clickhouse}`), key: COMPUTATION_ENGINE.clickhouse },
        { text: intl.get(`config.computationEngine.${COMPUTATION_ENGINE.webworker}`), key: COMPUTATION_ENGINE.webworker },
    ];
    const exploreOptions: RathSelectOption[] = [
        { text: intl.get('dataSource.exploreMode.firstTime'), key: EXPLORE_MODE.first },
        { text: intl.get('dataSource.exploreMode.comprehensive'), key: EXPLORE_MODE.comprehensive },
        { text: intl.get('dataSource.exploreMode.familiar'), key: EXPLORE_MODE.familiar, disabled: true },
        { text: intl.get('dataSource.exploreMode.manual'), key: EXPLORE_MODE.manual },
    ];
    const TASK_MODE_LIST: RathSelectOption[] = [
        { text: 'local', key: ITaskTestMode.local },
        { text: 'server', key: ITaskTestMode.server },
    ];
    return (
        <div className="flex flex-col gap-3">
            <RathSelect
                options={options}
                className="mr-4 min-w-[180px]"
                label={
                    <LabelWithDesc
                        label={intl.get('config.cubeStorageManageMode.title')}
                        description={intl.get('config.cubeStorageManageMode.desc')}
                    />
                }
                selectedKey={ltsPipeLineStore.cubeStorageManageMode}
                onChange={(key) => {
                    ltsPipeLineStore.setCubeStorageManageMode(key as ICubeStorageManageMode);
                }}
            />
            <RathSelect
                className="mr-4 min-w-[180px]"
                selectedKey={commonStore.exploreMode}
                options={exploreOptions}
                label={intl.get('dataSource.exploreMode.title')}
                onChange={(key) => {
                    commonStore.setExploreMode(key as string);
                }}
            />
            <RathSelect
                className="mr-4 min-w-[180px]"
                selectedKey={commonStore.computationEngine}
                options={engineOptions}
                label={<LabelWithDesc label={intl.get('config.computationEngine.title')} description={intl.get('config.computationEngine.desc')} />}
                onChange={(key) => {
                    commonStore.setComputationEngine(key as string);
                }}
            />
            <RathSelect
                label="task test mode"
                options={TASK_MODE_LIST}
                selectedKey={commonStore.taskMode}
                onChange={(key) => {
                    commonStore.setTaskTestMode(key as any);
                }}
            />
        </div>
    );
};

export default observer(AnalysisSettings);
