import { DetailsList, SelectionMode, Selection } from '@fluentui/react';
import React from 'react';
import { IFieldMeta } from '../../interfaces';

interface SetSelectionProps {
    dist: IFieldMeta['distribution'];
    selection: Selection;
}

const SetSelection: React.FC<SetSelectionProps> = props => {
    const { dist, selection } = props;

    return <div style={{ maxHeight: '200px', overflow: 'auto' }}>
        <DetailsList
            selection={selection}
            selectionMode={SelectionMode.multiple}
            columns={[
                {
                    key: 'memberName',
                    name: 'Member Name',
                    fieldName: 'memberName',
                    minWidth: 60
                },
                {
                    key: 'count',
                    name: 'Count',
                    fieldName: 'count',
                    minWidth: 40
                }
            ]}
            compact
            items={dist}
        />
    </div>
}

export default SetSelection;