import { IFieldMeta, IFilter, IPattern } from '@kanaries/loa';
import React from 'react';
import styled from 'styled-components';
import FieldPlaceholder from '../../../components/fieldPill/fieldPlaceholder';
import FilterCreationPill from '../../../components/fieldPill/filterCreationPill';
import ViewField from '../../megaAutomation/vizOperation/viewField';
const Cont = styled.div`
    display: flex;
    padding: 1em 0em 0em 0em;
    flex-wrap: wrap;
`
interface DataViewLiteEditorProps {
    view: IPattern;
    globalFields: IFieldMeta[];
    onAddViewField?: (fid: string) => void;
    onRemoveViewField?: (fid: string) => void;
    onAddFilter?: (filter: IFilter) => void;
    onRemoveFilter?: (fid: string) => void;
}
const DataViewLiteEditor: React.FC<DataViewLiteEditorProps> = (props) => {
    const { view, globalFields, onAddFilter, onRemoveViewField, onAddViewField, onRemoveFilter } = props;
    return (
        <Cont>
            <div className="fields-container">
                {view &&
                    view.fields.map((f: IFieldMeta) => (
                        <ViewField
                            key={f.fid}
                            type={f.analyticType}
                            text={f.name || f.fid}
                            onRemove={() => {
                                onRemoveViewField && onRemoveViewField(f.fid);
                            }}
                        />
                    ))}
                {onAddViewField && <FieldPlaceholder fields={globalFields} onAdd={onAddViewField} />}
            </div>
            <div className="fields-container">
                {view &&
                    view.filters &&
                    view.filters.map((f) => {
                        const targetField = globalFields.find((m) => m.fid === f.fid);
                        if (!targetField) return null;
                        let filterDesc = `${targetField.name || targetField.fid} ∈ `;
                        filterDesc += f.type === 'range' ? `[${f.range.join(',')}]` : `{${f.values.join(',')}}`;
                        return (
                            <ViewField
                                key={f.fid}
                                type={targetField.analyticType}
                                text={filterDesc}
                                onRemove={() => {
                                    onRemoveFilter && onRemoveFilter(f.fid);
                                }}
                            />
                        );
                    })}
                {onAddFilter && (
                    <FilterCreationPill
                        fields={globalFields}
                        onFilterSubmit={(field, filter) => {
                            onAddFilter(filter);
                        }}
                    />
                )}
            </div>
        </Cont>
    );
};

export default DataViewLiteEditor;
