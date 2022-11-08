import { IconButton } from '@fluentui/react';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { IFieldMeta, IRow } from '../../../interfaces';
import ColDist, { IBrushSignalStore } from './colDist';

const VizContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const VizCard = styled.div`
    border: 1px solid #ccc;
    margin: 5px;
    padding: 5px;
    .action-bar{
        margin-bottom: 5px;
    }
`;

interface CrossFilterProps {
    fields: IFieldMeta[];
    dataSource: IRow[];
    onVizEdit?: (fid: string) => void;
    onVizClue?: (fid: string) => void;
}
const CrossFilter: React.FC<CrossFilterProps> = (props) => {
    const { fields, dataSource, onVizClue, onVizEdit } = props;
    // const [brushes, setBrushes] = useState<(IBrush | null)[]>(fields.map((f) => null));
    const [brushSignal, setBrushSignal] = useState<IBrushSignalStore[] | null>(null);
    // const [filters, setFilters] = useState<(IFilter | null)[]>(fields.map((f) => null))
    const [asFilter, setAsFilter] = useState<boolean[]>(fields.map((f) => false));
    // const [mergedBrushes, setMergedBrushes] = useState<({ [key: string]: any[] } | null)[]>(fields.map((f) => null));
    useEffect(() => {
        setBrushSignal(null);
        setAsFilter(fields.map((f) => false));
    }, [fields]);
    return (
        <VizContainer>
            {fields.map((field, index) => {
                return (
                    <VizCard key={field.fid}>
                        <div className="action-bar">
                            {
                                onVizEdit && <IconButton
                                    text='Edit'
                                    iconProps={{ iconName: 'Edit' }}
                                    onClick={() => onVizEdit(field.fid)}
                                />
                            }
                            {
                                onVizClue && <IconButton
                                text="Clues"
                                iconProps={{ iconName: 'Lightbulb' }}
                                onClick={() => onVizClue(field.fid)}
                            />
                            }
                        </div>
                        <ColDist
                            data={dataSource}
                            fid={field.fid}
                            semanticType={field.semanticType}
                            onBrushSignal={(props) => {
                                if (props === null) {
                                    setAsFilter((arr) => {
                                        const nextArr = [...arr];
                                        nextArr[index] = false;
                                        return nextArr;
                                    });
                                    setBrushSignal(null);
                                } else {
                                    setAsFilter((arr) => {
                                        const nextArr = [...arr];
                                        nextArr[index] = true;
                                        return nextArr;
                                    });
                                    setBrushSignal([...props]);
                                }
                            }}
                            name={field.name}
                            brush={asFilter[index] ? null : brushSignal}
                        />
                    </VizCard>
                );
            })}
        </VizContainer>
    );
};

export default CrossFilter;
