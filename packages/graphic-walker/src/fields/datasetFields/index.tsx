import React from 'react';
import { NestContainer } from '../../components/container'
import { observer } from 'mobx-react-lite';
import {
    Droppable,
    Draggable,
} from "react-beautiful-dnd";
import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '../../store';
import DataTypeIcon from '../../components/dataTypeIcon';
import { IViewField, DraggableFieldState } from '../../interfaces';
import DimFields from './dimFields';
import MeaFields from './meaFields';

const FIELDS_KEY: keyof DraggableFieldState = 'fields';

const DatasetFields: React.FC = props => {
    const { t } = useTranslation('translation', { keyPrefix: 'main.tabpanel.DatasetFields' });

    const { vizStore } = useGlobalStore();
    const { draggableFieldState } = vizStore;
    const { fields } = draggableFieldState;

    const dimensions: IViewField[] = [];
    const measures: IViewField[] = [];
    const dimOriginIndices: number[] = [];
    const meaOriginIndices: number[] = [];

    for (let i = 0; i < fields.length; i++) {
        if (fields[i].analyticType === 'dimension') {
            dimensions.push(fields[i]);
            dimOriginIndices.push(i)
        } else {
            measures.push(fields[i])
            meaOriginIndices.push(i);
        }
    }

    return <NestContainer className="flex flex-col" style={{ height: '680px', paddingBlock: 0 }}>
        <h4 className="text-xs mb-2 flex-grow-0 cursor-default select-none mt-2">
            {t('field_list')}
        </h4>
        <div className="pd-1 overflow-y-auto" style={{ maxHeight: '380px'}}>
            <Droppable droppableId="dimensions" direction="vertical">
                {
                    (provided, snapshot) => <DimFields provided={provided} />
                }
            </Droppable>
        </div>
        <div className="border-t flex-grow pd-1 overflow-y-auto">
            <Droppable droppableId="measures" direction="vertical">
                {
                    (provided, snapshot) => <MeaFields provided={provided} />
                }
            </Droppable>
        </div>
        {/* <Droppable droppableId={FIELDS_KEY} direction="vertical" isDropDisabled={true}>
            {(provided, snapshot) => (
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                >
                    {dimensions.map((f, index) => (
                        <Draggable key={f.dragId} draggableId={f.dragId} index={dimOriginIndices[index]}>
                            {(provided, snapshot) => {
                                return (
                                    <>
                                        <div
                                            className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full"
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <DataTypeIcon dataType="string" /> {f.name}&nbsp;
                                        </div>
                                        {
                                            <div className={`pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full border-blue-400 border ${snapshot.isDragging ? '' : 'hidden'}`}>
                                                <DataTypeIcon dataType="string" /> {f.name}&nbsp;
                                            </div>
                                        }
                                    </>
                                );
                            }}
                        </Draggable>
                    ))}
                    {measures.map((f, index) => (
                        <Draggable key={f.dragId} draggableId={f.dragId} index={meaOriginIndices[index]}>
                            {(provided, snapshot) => {
                                return (
                                    <>
                                        <div
                                            className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full"
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <DataTypeIcon dataType="number" /> {f.name}&nbsp;
                                        </div>
                                        {
                                            snapshot.isDragging && <div className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full border-blue-400 border">
                                                <DataTypeIcon dataType="number" /> {f.name}&nbsp;
                                            </div>
                                        }
                                    </>
                                );
                            }}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable> */}
    </NestContainer>
}

export default observer(DatasetFields);