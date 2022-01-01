import React, { useCallback, useEffect } from "react";
import { BaseTable, Classes } from "ali-react-table";
import { IRow } from "../../../interfaces";
import HeaderCell from "./headerCell";
import styled from "styled-components";
import { observer } from 'mobx-react-lite'
import { useGlobalStore } from "../../../store";
const CustomBaseTable = styled(BaseTable)`
    --header-bgcolor: #fafafa;
    --bgcolor: rgba(0, 0, 0, 0);
    .${Classes.tableHeaderCell} {
        position: relative;
    }
`;

const TableInnerStyle = {
    height: 600,
    overflow: "auto",
};

const DataTable: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { mutFields, rawData, fieldMetas, fields, cleanedData } = dataSourceStore;



    const updateFieldInfo = useCallback((fieldId: string, fieldPropKey: string, value: any) => {
        dataSourceStore.updateFieldInfo(fieldId, fieldPropKey, value);
    }, [dataSourceStore])

    useEffect(() => {
        dataSourceStore.getFieldsMetas();
    }, [fields, cleanedData, dataSourceStore])
    // 这是一个非常有趣的数据流写法的bug，可以总结一下
    // const columns = useMemo(() => {
    //     return fieldMetas.map((f, i) => {
    //         const mutField = mutFields[i].fid === f.fid ? mutFields[i] : mutFields.find(mf => mf.fid === f.fid);
        //     return {
        //         name: f.fid,
        //         code: f.fid,
        //         width: 220,
        //         title: (
        //             <HeaderCell
        //                 disable={Boolean(mutField?.disable)}
        //                 name={f.fid}
        //                 code={f.fid}
        //                 // meta={f}
        //                 onChange={updateFieldInfo}
        //             />
        //         ),
        //     };
        // });
    // }, [fieldMetas, mutFields, updateFieldInfo])

    const columns = mutFields.map((f, i) => {
        const fm = (fieldMetas[i] && fieldMetas[i].fid === mutFields[i].fid) ? fieldMetas[i] : fieldMetas.find(m => m.fid === f.fid);
        return {
                name: f.fid,
                code: f.fid,
                width: 220,
                title: (
                    <HeaderCell
                        disable={Boolean(f.disable)}
                        name={f.fid}
                        code={f.fid}
                        meta={fm || null}
                        onChange={updateFieldInfo}
                    />
                ),
            };
    })

    const rowPropsCallback = useCallback((record: IRow) => {
        const hasEmpty = fields.some((f) => {
            return !f.disable && (record[f.fid] === null || record[f.fid] === undefined || record[f.fid] === "");
        });
        return {
            style: {
                backgroundColor: hasEmpty ? "#ffd8bf" : "rgba(0,0,0,0)",
            },
        };
    }, [fields])

    return (
        <div>
            {
                columns.length > 0 && <CustomBaseTable
                useVirtual={true}
                getRowProps={rowPropsCallback}
                style={TableInnerStyle} dataSource={rawData} columns={columns} />
            }
        </div>
    );
};

export default observer(DataTable);
