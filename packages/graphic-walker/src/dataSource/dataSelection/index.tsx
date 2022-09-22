import React from 'react';
import { useState } from 'react';
import CSVData from './csvData';
import PublicData from './publicData';
import { useTranslation } from 'react-i18next';

interface IDataSelectionProps {

}

const DataSelection: React.FC = props =>{
    const [sourceType, setSourceType] = useState<'file' | 'public'>('file');
    const { t } = useTranslation('translation', { keyPrefix: 'DataSource' });

    return <div className="grid grid-cols-6 text-sm">
        <div className="col-span-1 bg-gray-100 pl-2 pr-2 pb-2 pt-1 text-xs">
            <h1 className="cursor-default">
                {t('dialog.data_types')}
            </h1>
            <hr className="mt-1 mb-1" />
            <div
                className={
                    `pb-1 cursor-pointer ${
                        sourceType === 'file' ? 'underline' : ''
                    } hover:bg-gray-200 hover:text-purple-600`
                }
                onClick={() => { setSourceType('file'); }}
            >
                {t('dialog.text_file_data')}
            </div>
            <div
                className={
                    `pb-1 cursor-pointer ${
                        sourceType === 'public' ? 'underline' : ''
                    } hover:bg-gray-200 hover:text-purple-600`
                }
                onClick={() => { setSourceType('public'); }}
            >
                {t('dialog.public_data')}
            </div>
        </div>
        <div className="col-span-5 pl-2 pr-2">
            <h1 className="text-base font-semibold">
                {t('dialog.data_source_type', { sourceType })}
            </h1>
            <hr className="mt-1 mb-1" />
            {
                sourceType === 'file' && <CSVData />
            }
            {
                sourceType === 'public' && <PublicData />
            }
        </div>
    </div>
}

export default DataSelection;
