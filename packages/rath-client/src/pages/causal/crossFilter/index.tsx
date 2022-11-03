import React, { useEffect, useState } from 'react';
import { IFieldMeta, IRow } from '../../../interfaces';
import ColDist, { IBrushSignalStore } from './colDist';

interface Props {
    fields: IFieldMeta[];
    dataSource: IRow[];
}
const CrossFilter: React.FC<Props> = (props) => {
    const { fields, dataSource } = props;
    // const [brushes, setBrushes] = useState<(IBrush | null)[]>(fields.map((f) => null));
    const [brushSignal, setBrushSignal] = useState<IBrushSignalStore[] | null>(null);
    // const [filters, setFilters] = useState<(IFilter | null)[]>(fields.map((f) => null))
    const [asFilter, setAsFilter] = useState<boolean[]>(fields.map((f) => false));
    // const [mergedBrushes, setMergedBrushes] = useState<({ [key: string]: any[] } | null)[]>(fields.map((f) => null));
    useEffect(() => {
        // setBrushes(fields.map((f) => null));
        setBrushSignal(null)
        setAsFilter(fields.map((f) => false));
        // setFilters(fields.map((f) => null));
        // set
    }, [fields]);
    // const filteredData = useMemo(() => {
    //     if (filters.every(f => f === null)) return dataSource;
    //     return applyFilters(dataSource, filters.filter((f) => f !== null) as IFilter[]);
    // }, [dataSource, filters]);
    // const mergedBrushes = useMemo(() => {
    //     return brushes.map((bs, index) => {
    //         if (asFilter[index]) return brushes[index];
    //         return mergeBrush(brushes.filter((f, i) => i !== index));
    //     });
    // }, [brushes, asFilter]);
    // console.log(mergedBrushes)
    // const
    return (
        <div>
            {fields.map((field, index) => {
                return (
                    <ColDist
                        key={field.fid}
                        data={dataSource}
                        // data={asFilter[index] ? dataSource : filteredData}
                        fid={field.fid}
                        semanticType={field.semanticType}
                        // onFilter={(filter) => {
                        //     setAsFilter((arr) => {
                        //             const nextArr = [...arr];
                        //             nextArr[index] = !!filter;
                        //             return nextArr;
                        //         });
                        //     setFilters(filters => produce(filters, (draft) => {
                        //         draft[index] = filter;
                        //     }));
                        // }}
                        onBrushSignal={(props) => {
                            // console.log(props)
                            // setBrushes((bs) => {
                            //     const next = produce(bs, (draft) => {
                            //         draft[index] = props;
                            //     });
                            //     return next;
                            // });
                            if (props === null) {
                                setAsFilter((arr) => {
                                    const nextArr = [...arr];
                                    nextArr[index] = false;
                                    return nextArr;
                                });
                                setBrushSignal(null)
                            } else {
                                setAsFilter((arr) => {
                                    const nextArr = [...arr];
                                    nextArr[index] = true;
                                    return nextArr;
                                });setBrushSignal([ ...props ])
                            }
                            
                        }}
                        name={field.name}
                        brush={asFilter[index] ? null : brushSignal}
                    />
                );
            })}
        </div>
    );
};

export default CrossFilter;
