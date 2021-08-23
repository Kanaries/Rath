import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BaseTable, ArtColumn, Classes } from "ali-react-table";
import { IRawField, IRow } from "../../../interfaces";
import { BIField, BIFieldType } from "../../../global";
import HeaderCell from "./headerCell";
import styled from "styled-components";
import intl from 'react-intl-universal';
import { FieldSummary, getFieldsSummaryService } from "../../../service";
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
    const { mutFields, rawData, cleanedData, fields } = dataSourceStore;
    const [summary, setSummary] = useState<FieldSummary[]>([]);
    useEffect(() => {
        getFieldsSummaryService(cleanedData, fields.map(f => f.name)).then(res => {
            setSummary(res);
        })
    }, [cleanedData, fields])


    const updateFieldInfo = useCallback((fieldId: string, fieldPropKey: string, value: any) => {
        dataSourceStore.updateFieldInfo(fieldId, fieldPropKey, value);
    }, [])


    const columns = mutFields.map((f) => {
        const targetSummary = summary.find((s) => s.fieldName === f.name) || null;
        return {
            name: f.name,
            code: f.name,
            width: 220,
            title: (
                <HeaderCell
                    disable={f.disable}
                    name={f.name}
                    code={f.name}
                    type={f.type}
                    summary={targetSummary}
                    onChange={updateFieldInfo}
                />
            ),
        };
    });

    const rowPropsCallback = useCallback((record: IRow) => {
        const hasEmpty = fields.some((f) => {
            return !f.disable && (record[f.name] === null || record[f.name] === undefined || record[f.name] === "");
        });
        return {
            style: {
                backgroundColor: hasEmpty ? "#ffd8bf" : "rgba(0,0,0,0)",
            },
        };
    }, [fields])

    return (
        <div>
            <CustomBaseTable
                useVirtual={true}
                getRowProps={rowPropsCallback}
                style={TableInnerStyle} dataSource={rawData} columns={columns} />
        </div>
    );
};

export default observer(DataTable);
