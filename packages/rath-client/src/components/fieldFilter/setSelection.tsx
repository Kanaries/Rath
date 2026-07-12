import React from 'react';
import { RathColumn, RathDataTable } from '../rath-ui/rath-data-table';
import { IFieldMeta } from '../../interfaces';

interface SetSelectionProps {
    dist: IFieldMeta['distribution'];
    selectedKeys: string[];
    onChange: (keys: string[]) => void;
}

const SetSelection: React.FC<SetSelectionProps> = (props) => {
    const { dist, selectedKeys, onChange } = props;
    const columns: RathColumn<IFieldMeta['distribution'][number]>[] = [
        {
            key: 'memberName',
            name: 'Member Name',
            fieldName: 'memberName',
            minWidth: 60,
        },
        {
            key: 'count',
            name: 'Count',
            fieldName: 'count',
            minWidth: 40,
        },
    ];

    return (
        <div>
            <RathDataTable
                selection={{
                    mode: 'multiple',
                    selectedKeys,
                    onChange,
                    getKey: (item) => String(item.memberName),
                }}
                columns={columns}
                compact
                items={dist}
                maxHeight={200}
                virtualizationThreshold={40}
            />
        </div>
    );
};

export default SetSelection;
