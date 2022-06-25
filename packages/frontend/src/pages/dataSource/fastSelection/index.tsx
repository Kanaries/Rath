import { observer } from 'mobx-react-lite';
import { DefaultButton, Modal, PrimaryButton, Slider, Stack, Toggle } from 'office-ui-fabric-react';
import React, { useCallback, useEffect, useState } from 'react';
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
            <h1>Fast Selection Config</h1>
            <p>Filter based on quantiles to get the main part of your data.</p>
            <Toggle label="sync mode" checked={syncMode}
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
                <PrimaryButton text="Submit" onClick={() => {
                    dataSourceStore.createBatchFilterByQts(
                        meaFields.map(m => m.fid),
                        ranges
                    )
                    dataSourceStore.setShowFastSelection(false);
                }} />
                <DefaultButton style={{ marginLeft: '1em' }} text="Cancel" onClick={() => {
                    dataSourceStore.setShowFastSelection(false);
                }} />
            </Stack>
            </div>
        </Modal>
    </div>
}

export default observer(FastSelection);
