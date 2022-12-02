import { IconButton } from '@fluentui/react';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { IFieldMeta, IRow } from '../../../../interfaces';
import ColDist, { IBrushSignalStore } from './colDist';

const VizContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const VizCard = styled.div`
    border: 1px solid #ccc;
    margin: 5px;
    padding: 5px;
    .action-bar {
        margin-bottom: 5px;
    }
`;

interface CrossFilterProps {
    fields: readonly IFieldMeta[];
    dataSource: readonly IRow[];
    onVizEdit?: (fid: string) => void;
    onVizClue?: (fid: string) => void;
    onVizDelete?: (fid: string) => void;
}
const CrossFilter: React.FC<CrossFilterProps> = (props) => {
    const { fields, dataSource, onVizClue, onVizEdit, onVizDelete } = props;
    // const [brushes, setBrushes] = useState<(IBrush | null)[]>(fields.map((f) => null));
    const [brushSignal, setBrushSignal] = useState<IBrushSignalStore[] | null>(null);
    const [brushIndex, setBrushIndex] = useState<number>(-1)
    // const [mergedBrushes, setMergedBrushes] = useState<({ [key: string]: any[] } | null)[]>(fields.map((f) => null));
    useEffect(() => {
        setBrushSignal(null);
        setBrushIndex(-1)
    }, [fields]);

    const handleFilter = useCallback((index: number, data: IBrushSignalStore[] | null) => {
        if (data === null) {
            return;
        } else {
            setBrushIndex(index);
            setBrushSignal([...data]);
        }
    }, []);

    return (
        <VizContainer>
            {fields.map((field, index) => {
                return (
                    <VizCard key={field.fid}>
                        <div className="action-bar">
                            {onVizEdit && (
                                <IconButton
                                    text="Edit"
                                    iconProps={{ iconName: 'Edit' }}
                                    onClick={() => onVizEdit(field.fid)}
                                />
                            )}
                            {onVizClue && (
                                <IconButton
                                    text="Clues"
                                    iconProps={{ iconName: 'Lightbulb' }}
                                    onClick={() => onVizClue(field.fid)}
                                />
                            )}
                            {onVizDelete && (
                                <IconButton
                                    text="Delete"
                                    iconProps={{ iconName: 'Delete' }}
                                    onClick={() => onVizDelete(field.fid)}
                                />
                            )}
                        </div>
                        <ColDist
                            data={dataSource}
                            fid={field.fid}
                            semanticType={field.semanticType}
                            onBrushSignal={(props) => {
                                handleFilter(index, props);
                            }}
                            name={field.name}
                            brush={index === brushIndex ? null : brushSignal}
                        />
                    </VizCard>
                );
            })}
        </VizContainer>
    );
};

export default CrossFilter;
