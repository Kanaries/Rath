import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BaseTable, ArtColumn, Classes } from "ali-react-table";
import { IRow } from "../../../interfaces";
import { BIField, BIFieldType } from "../../../global";
import HeaderCell from "./headerCell";
import styled from "styled-components";
import intl from 'react-intl-universal';
import { FieldSummary, getFieldsSummaryService } from "../../../service";

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

interface DataTableProps {
    dataSource: IRow[];
    fields: BIField[];
    onChangeBIType?: (type: BIFieldType, fieldKey: string) => void;
}

const DataTable: React.FC<DataTableProps> = (props) => {
    const { dataSource, fields, onChangeBIType } = props;
    const [summary, setSummary] = useState<FieldSummary[]>([]);
    useEffect(() => {
        getFieldsSummaryService(dataSource, fields.map(f => f.name)).then(res => {
            setSummary(res);
        })
    }, [dataSource, fields])

    // FIXME: 这里是一种临时hack写法，为了让语言环境切换时,column里的headerCell里的内容也能识别到。
    const dimensionLabel = intl.get("meta.dimension");

    const columns = useMemo<ArtColumn[]>(() => {
        return fields.map((f) => {
            const targetSummary = summary.find((s) => s.fieldName === f.name) || null;
            return {
                name: f.name,
                code: f.name,
                width: 220,
                title: (
                    <HeaderCell
                        name={f.name}
                        code={f.name}
                        type={f.type}
                        summary={targetSummary}
                        onChangeBIType={onChangeBIType}
                    />
                ),
            };
        });
    // 见上面的FIXME
    }, [fields, summary, onChangeBIType, dimensionLabel]);

    const rowPropsCallback = useCallback((record: IRow) => {
        const hasEmpty = fields.some((f) => {
            return record[f.name] === null || record[f.name] === undefined || record[f.name] === "";
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
                style={TableInnerStyle} dataSource={dataSource} columns={columns} />
        </div>
    );
};

export default DataTable;
