import { Checkbox, CommandButton, MessageBar, MessageBarType } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import LaTiaoConsole from '../LaTiaoConsole';

const Cont = styled.div`
    /* margin: 1em; */
    /* border: 1px solid red; */
    /* padding: 6px; */
    display: flex;
    align-items: center;
`;

const StyledMessageBar = styled(MessageBar)`
`;

const DataOperations: React.FC = () => {
    const { dataSourceStore } = useGlobalStore();
    const { mutFields } = dataSourceStore;
    const allDisable = mutFields.map((f) => f.disable).every((d) => d);
    const allAble = mutFields.map((f) => f.disable).every((d) => !d);
    const exportData = useCallback(() => {
        const ds = dataSourceStore.exportDataAsDSService();
        const content = JSON.stringify(ds);
        const ele = document.createElement('a');
        ele.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        ele.setAttribute('download', 'dataset-service.json');
        ele.style.display = 'none';
        document.body.appendChild(ele);
        ele.click();

        document.body.removeChild(ele);
    }, [dataSourceStore]);
    return (
        <StyledMessageBar
            messageBarIconProps={{
                iconName: 'DeveloperTools',
                style: {
                    color: 'rgb(0, 120, 212)',
                    fontWeight: 800,
                },
            }}
            messageBarType={MessageBarType.info}
            isMultiline={false}
            styles={{
                root: {
                    boxSizing: 'border-box',
                    width: 'unset',
                    color: 'rgb(0, 120, 212)',
                    backgroundColor: 'rgba(0, 120, 212, 0.02)',
                    border: '1px solid rgba(0, 120, 212, 0.5)',
                    margin: '2px 0 2px 0',
                },
            }}
            actions={
                <Cont>
                    <CommandButton
                        text={intl.get('dataSource.downloadData.title')}
                        disabled={mutFields.length === 0}
                        onClick={exportData}
                        iconProps={{ iconName: 'download' }}
                        styles={{
                            root: {
                                height: '32px',
                                marginLeft: '1.5em !important',
                            },
                        }}
                    />
                    <CommandButton
                        disabled={mutFields.length === 0}
                        text={intl.get('dataSource.fastSelection.title')}
                        iconProps={{ iconName: 'filter' }}
                        onClick={() => {
                            dataSourceStore.setShowFastSelection(true);
                        }}
                    />
                    <LaTiaoConsole />
                    <Checkbox
                        checked={!allDisable}
                        indeterminate={!allDisable && !allAble}
                        label={intl.get('dataSource.operations.selectAll')}
                        onChange={(e, checked) => {
                            dataSourceStore.setAllMutFieldsDisable(!checked);
                        }}
                    />
                </Cont>
            }
        >
            <Cont>{intl.get('dataSource.operations.title')}</Cont>
        </StyledMessageBar>
    );
};

export default observer(DataOperations);
