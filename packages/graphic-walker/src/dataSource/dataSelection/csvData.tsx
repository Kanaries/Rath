import React, { useRef, useCallback } from 'react';
import { FileReader } from '@kanaries/web-data-loader';
import { Record } from '../../interfaces';
import Table from '../table';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

const Container = styled.div`
    overflow-x: auto;
`;

interface ICSVData {
}
const CSVData: React.FC<ICSVData> = props => {
    const fileRef = useRef<HTMLInputElement>(null);
    const { commonStore } = useGlobalStore();
    const { tmpDSName, tmpDataSource } = commonStore;

    const onSubmitData = useCallback(() => {
        commonStore.commitTempDS();
    }, []);

    const { t } = useTranslation('translation', { keyPrefix: 'DataSource.dialog.file' });

    return (
        <Container>
            <input
                style={{ display: 'none' }}
                type="file"
                ref={fileRef}
                onChange={(e) => {
                    const files = e.target.files;
                    if (files !== null) {
                        const file = files[0];
                        FileReader.csvReader({
                            file,
                            config: { type: 'reservoirSampling', size: Infinity },
                            onLoading: () => {}
                        }).then((data) => {
                            commonStore.updateTempDS(data as Record[]);
                        });
                    }
                }}
            />
            <div className="mt-1 mb-1">
                <button className="inline-block min-w-96 text-xs mr-2 pt-1 pb-1 pl-6 pr-6 border border-gray-500 rounded-sm cursor-pointer hover:bg-gray-200"
                    onClick={() => { if (fileRef.current) { fileRef.current.click(); }}}
                >
                    {t('open')}
                </button>
                <button className="inline-block min-w-96 text-xs mr-2 pt-1 pb-1 pl-6 pr-6 bg-yellow-600 rounded-sm hover:bg-yellow-500 text-white font-bold disabled:bg-gray-300"
                    disabled={tmpDataSource.length === 0}
                    onClick={() => { onSubmitData(); }}
                >
                    {t('submit')}
                </button>
            </div>
            <div className="mt-1 mb-1">
                <label className="block text-xs text-gray-800">
                    {t('dataset_name')}
                </label>
                <input type="text" placeholder={t('dataset_name')}
                    value={tmpDSName}
                    onChange={e => {
                        commonStore.updateTempName(e.target.value)
                    }}
                    className="text-xs p-1 border border-gray-300 outline-none focus:outline-none focus:border-blue-500"
                />
            </div>
            <Table />
        </Container>
    );
}

export default observer(CSVData);
