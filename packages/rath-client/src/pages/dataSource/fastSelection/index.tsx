import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { DefaultButton, Label, Modal, PrimaryButton, Slider, Stack, Toggle } from '@fluentui/react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';

const FastSelection: React.FC = () => {
    const { dataSourceStore } = useGlobalStore();
    const { meaFields } = dataSourceStore;
    const [syncMode, setSyncMode] = useState<boolean>(true);
    const [ranges, setRanges] = useState<[number, number][]>(meaFields.map(mea => [0.05, 0.95]));

    useEffect(() => {
        setRanges(meaFields.map(() => [0.05, 0.95]))
    }, [meaFields])

    const handleRangeChange = useCallback((meaIndex: number, range: [number, number]) => {
        if (syncMode) {
            setRanges(rs => rs.map(r => [...range]))
        } else {
            setRanges(rs => {
                const nextRs = [...rs]
                nextRs[meaIndex] = [...range];
                return nextRs
            })
        }
    }, [syncMode])

    return <div>
        <Modal isOpen={dataSourceStore.showFastSelectionModal} onDismiss={() => {
            dataSourceStore.setShowFastSelection(false);
        }}>
            <div style={{ padding: '2em' }}>
            <Label>{intl.get('dataSource.selection.title')}</Label>
            <p>{intl.get('dataSource.selection.desc')}</p>
            <Toggle label={intl.get('dataSource.selection.syncMode')} checked={syncMode}
                onChange={(_, checked) => {
                    setSyncMode(Boolean(checked))
                }}
            />
            {
                meaFields.length === ranges.length && meaFields.map((mea, meaIndex) => <Slider
                    key={mea.fid}
                    min={0}
                    value={ranges[meaIndex][1]}
                    lowerValue={ranges[meaIndex][0]}
                    step={0.01}
                    max={1}
                    ranged
                    label={mea.name}
                    onChange={(v, r) => {
                            r && handleRangeChange(meaIndex, r)
                    }}
                />)
            }
            <Stack style={{ marginTop: '1em' }} horizontal>
                <PrimaryButton text={intl.get('function.confirm')} onClick={() => {
                    dataSourceStore.createBatchFilterByQts(
                        meaFields.map(m => m.fid),
                        ranges
                    )
                    dataSourceStore.setShowFastSelection(false);
                }} />
                <DefaultButton style={{ marginLeft: '1em' }} text={intl.get('function.cancel')} onClick={() => {
                    dataSourceStore.setShowFastSelection(false);
                }} />
            </Stack>
            </div>
        </Modal>
    </div>
}

export default observer(FastSelection);
