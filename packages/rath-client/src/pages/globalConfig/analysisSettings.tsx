import { useMemo, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Dropdown, IDropdownOption, Panel, PrimaryButton, DefaultButton } from '@fluentui/react';
import { ICubeStorageManageMode } from 'visual-insights';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../store';
import { COMPUTATION_ENGINE, EXPLORE_MODE } from '../../constants';
import { makeRenderLabelHandler } from '../../components/labelTooltip';
import { ITaskTestMode } from '../../interfaces';
import styled from 'styled-components';
import { notify } from '../../components/error';

const AnalysisDiv = styled.div`
    padding: 1rem 0.5rem;
    .save-btn {
        margin-top: 2rem;
        display: flex;
        justify-content: flex-end;
    }
`;

const AnalysisSettings = (props: { onSave: (check: boolean) => void }) => {
    const { ltsPipeLineStore, commonStore } = useGlobalStore();
    const { onSave } = props;
    useEffect(() => {
        commonStore.getConfigurePersistence();
    }, []);

    const options = useMemo<IDropdownOption[]>(() => {
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
    const engineOptions: IDropdownOption[] = [
        {
            text: intl.get(`config.computationEngine.${COMPUTATION_ENGINE.clickhouse}`),
            key: COMPUTATION_ENGINE.clickhouse,
        },
        {
            text: intl.get(`config.computationEngine.${COMPUTATION_ENGINE.webworker}`),
            key: COMPUTATION_ENGINE.webworker,
        },
    ];
    const exploreOptions: IDropdownOption[] = [
        { text: intl.get('dataSource.exploreMode.firstTime'), key: EXPLORE_MODE.first },
        { text: intl.get('dataSource.exploreMode.comprehensive'), key: EXPLORE_MODE.comprehensive },
        { text: intl.get('dataSource.exploreMode.familiar'), key: EXPLORE_MODE.familiar, disabled: true },
        { text: intl.get('dataSource.exploreMode.manual'), key: EXPLORE_MODE.manual },
    ];
    const TASK_MODE_LIST: IDropdownOption[] = [
        { text: 'local', key: ITaskTestMode.local },
        { text: 'server', key: ITaskTestMode.server },
    ];
    return (
        <AnalysisDiv>
            <Dropdown
                options={options}
                style={{ minWidth: '180px', marginBottom: 6 }}
                label={intl.get('config.cubeStorageManageMode.title')}
                selectedKey={ltsPipeLineStore.cubeStorageManageMode}
                onChange={(e, op) => {
                    op && ltsPipeLineStore.setCubeStorageManageMode(op.key as ICubeStorageManageMode);
                }}
                onRenderLabel={makeRenderLabelHandler(intl.get('config.cubeStorageManageMode.desc'))}
            />
            <Dropdown
                style={{ minWidth: '180px', marginBottom: 6 }}
                // disabled
                selectedKey={commonStore.exploreMode}
                options={exploreOptions}
                label={intl.get('dataSource.exploreMode.title')}
                onChange={(e, item) => {
                    item && commonStore.setExploreMode(item.key as string);
                }}
            />
            <Dropdown
                style={{ minWidth: '180px', marginBottom: 6 }}
                selectedKey={commonStore.computationEngine}
                options={engineOptions}
                label={intl.get('config.computationEngine.title')}
                onChange={(e, item) => {
                    item && commonStore.setComputationEngine(item.key as string);
                }}
                onRenderLabel={makeRenderLabelHandler(intl.get('config.computationEngine.desc'))}
            />
            <Dropdown
                style={{ minWidth: '180px', marginBottom: 6 }}
                label="task test mode"
                options={TASK_MODE_LIST}
                selectedKey={commonStore.taskMode}
                onChange={(e, option) => {
                    option && commonStore.setTaskTestMode(option.key as any);
                }}
            />
            <div className="save-btn">
                <PrimaryButton
                    onClick={() => {
                        onSave(true);
                        commonStore.configurePersistence().then(() => {
                            notify({
                                title: 'Save Success',
                                type: 'success',
                                content: 'Configuration Item Saved Successfully',
                            });
                            onSave(false);
                        });
                    }}
                >
                    {intl.get('function.confirm')}
                </PrimaryButton>
            </div>
        </AnalysisDiv>
    );
};

export default observer(AnalysisSettings);
