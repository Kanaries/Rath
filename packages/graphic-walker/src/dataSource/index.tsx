import { ProgressIndicator } from '@fluentui/react';
import { Button, DropdownSelect } from '@tableau/tableau-ui';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Container } from '../components/container';
import Modal from '../components/modal';
import DataSourcePanel from './pannel';
import { useGlobalStore } from '../store';

interface DSSegmentProps {
    preWorkDone: boolean;
}

const DataSourceSegment: React.FC<DSSegmentProps> = props => {
    const { preWorkDone } = props;
    const store = useGlobalStore();

    const { currentDataset, datasets, showDSPanel } = store;

    return <Container>
        {!preWorkDone && <ProgressIndicator description="analyzing" />}
        <label style={{ fontSize: '12px', marginRight: '4px' }}>当前数据集</label>
        <DropdownSelect
            value={currentDataset.id}
            onChange={(e) => { store.useDS(e.target.value); }}
        >
            {datasets.map((ds) => (
                <option value={ds.id} key={ds.id}>
                    {ds.name}
                </option>
            ))}
        </DropdownSelect>
        <Button
            style={{ marginLeft: '8px' }}
            onClick={() => { store.startDSBuildingTask() }}
        >
            创建数据集
        </Button>
        {showDSPanel && (
            <Modal
                title="创建数据源"
                onClose={() => { store.setShowDSPanel(false) }}
            >
                <DataSourcePanel />
            </Modal>
        )}
        {preWorkDone && <span style={{ margin: '1em' }}>iready</span>}
    </Container>
}

export default observer(DataSourceSegment);