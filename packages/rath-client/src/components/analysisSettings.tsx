import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Dropdown, IDropdownOption, Stack } from '@fluentui/react';
import { ICubeStorageManageMode } from 'visual-insights';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../store';

import { COMPUTATION_ENGINE, EXPLORE_MODE } from '../constants';
import { ITaskTestMode } from '../interfaces';
import { makeRenderLabelHandler } from './labelTooltip';


const AnalysisSettings: React.FC = props => {
    const { ltsPipeLineStore, commonStore } = useGlobalStore();

    const options = useMemo<IDropdownOption[]>(() => {
        return [
            {
                text: 'disk',
                key: ICubeStorageManageMode.LocalDisk
            },
            {
                text: 'mix',
                key: ICubeStorageManageMode.LocalMix
            },
            {
                text: 'memory',
                key: ICubeStorageManageMode.LocalCache
            }
        ]
    }, [])
    const engineOptions: IDropdownOption[] = [
        { text: intl.get(`config.computationEngine.${COMPUTATION_ENGINE.clickhouse}`), key: COMPUTATION_ENGINE.clickhouse },
        { text: intl.get(`config.computationEngine.${COMPUTATION_ENGINE.webworker}`), key: COMPUTATION_ENGINE.webworker }
    ]
      const exploreOptions: IDropdownOption[] = [
        { text: intl.get('dataSource.exploreMode.firstTime'), key: EXPLORE_MODE.first },
        { text: intl.get('dataSource.exploreMode.comprehensive'), key: EXPLORE_MODE.comprehensive },
        { text: intl.get('dataSource.exploreMode.familiar'), key: EXPLORE_MODE.familiar, disabled: true },
        { text: intl.get('dataSource.exploreMode.manual'), key: EXPLORE_MODE.manual }
    ]
    const TASK_MODE_LIST: IDropdownOption[] = [
        { text: 'local', key: ITaskTestMode.local },
        { text: 'server', key: ITaskTestMode.server }
    ]
    return <Stack>
        <Dropdown options={options}
            style={{ minWidth: '180px', marginRight: '1em' }}
            label={intl.get('config.cubeStorageManageMode.title')}
            selectedKey={ltsPipeLineStore.cubeStorageManageMode}
            onChange={(e, op) => {
                op && ltsPipeLineStore.setCubeStorageManageMode(op.key as ICubeStorageManageMode)
            }}
            onRenderLabel={makeRenderLabelHandler(intl.get('config.cubeStorageManageMode.desc'))}
        />
        <Dropdown style={{ minWidth: '180px', marginRight: '1em' }}
            // disabled
            selectedKey={commonStore.exploreMode}
            options={exploreOptions}
            label={intl.get('dataSource.exploreMode.title')}
            onChange={(e, item) => {
            item && commonStore.setExploreMode(item.key as string);
            }}
        />
        <Dropdown style={{ minWidth: '180px', marginRight: '1em' }}
            selectedKey={commonStore.computationEngine}
            options={engineOptions}
            label={intl.get('config.computationEngine.title')}
            onChange={(e, item) => {
            item && commonStore.setComputationEngine(item.key as string);
            }}
            onRenderLabel={makeRenderLabelHandler(intl.get('config.computationEngine.desc'))}
        />
        <Dropdown
            label="task test mode"
            options={TASK_MODE_LIST}
            selectedKey={commonStore.taskMode}
            onChange={(e, option) => {
                option && commonStore.setTaskTestMode(option.key as any)
            }}
        />
    </Stack>
}

export default observer(AnalysisSettings);
