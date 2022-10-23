import React, { useCallback} from "react";
import { BaseTable, Classes } from "ali-react-table";
import styled from "styled-components";
import { observer } from 'mobx-react-lite'
import { MessageBar, MessageBarType } from "@fluentui/react";
import intl from 'react-intl-universal';
import { useGlobalStore } from "../../../store";
import type { IRow } from "../../../interfaces";
import HeaderCell from "./headerCell";


const CustomBaseTable = styled(BaseTable)`
    --header-bgcolor: #fafafa!important;
    --bgcolor: rgba(0, 0, 0, 0);
    .${Classes.tableHeaderCell} {
        position: relative;
    }
    thead{
        vertical-align: top;
    }
`;

const TableInnerStyle = {
    height: 600,
    overflow: "auto",
};

const DataTable: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { allFields: mutFields, filteredData: rawData, fieldMetas, fieldsWithExtSug: fields } = dataSourceStore;

    const fieldsCanExpand = fields.filter(
        f => f.extSuggestions.length > 0,
    );

    const fieldsNotDecided = fields.filter(
        f => f.stage === 'preview',
    );

    const updateFieldInfo = useCallback((fieldId: string, fieldPropKey: string, value: any) => {
        dataSourceStore.updateFieldInfo(fieldId, fieldPropKey, value);
    }, [dataSourceStore])

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

    const displayList: typeof mutFields = [];

    for (const f of mutFields) {
        if (f.stage === undefined) {
            displayList.push(f);
        }
    }

    for (const f of mutFields) {
        if (f.stage !== undefined) {
            const from = f.extInfo?.extFrom.at(-1);
            const parent = displayList.findIndex(_f => _f.fid === from);

            if (parent !== -1) {
                displayList.splice(parent + 1, 0, f);
            } else {
                displayList.push(f);
            }
        }
    }

    const columns = displayList.map((f, i) => {
        const fm = (fieldMetas[i] && fieldMetas[i].fid === displayList[i].fid) ? fieldMetas[i] : fieldMetas.find(m => m.fid === f.fid);
        const suggestions = fields.find(_f => _f.fid === f.fid)?.extSuggestions ?? [];

        return {
                name: f.name || f.fid,
                code: f.fid,
                width: 220,
                title: (
                    <HeaderCell
                        disable={Boolean(f.disable)}
                        name={f.name || f.fid}
                        code={f.fid}
                        meta={fm || null}
                        onChange={updateFieldInfo}
                        extSuggestions={suggestions}
                        isExt={Boolean(f.extInfo)}
                        isPreview={f.stage === 'preview'}
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
            {fieldsCanExpand.length > 0 && (
                <MessageBar
                    messageBarType={MessageBarType.warning}
                    isMultiline={false}
                    messageBarIconProps={{
                        iconName: 'AutoEnhanceOn',
                        style: {
                            color: 'rgb(0, 120, 212)',
                            fontWeight: 800,
                        },
                    }}
                    styles={{
                        root: {
                            boxSizing: 'border-box',
                            width: 'unset',
                            color: 'rgb(0, 120, 212)',
                            backgroundColor: 'rgba(0, 120, 212, 0.02)',
                            border: '1px solid',
                            margin: '1em 0 2em',
                        },
                    }}
                >
                    <span>
                        {intl.get('dataSource.extend.autoExtend', { count: fieldsCanExpand.length })}
                    </span>
                </MessageBar>
            )}
            {fieldsNotDecided.length > 0 && (
                <MessageBar
                    messageBarType={MessageBarType.warning}
                    isMultiline={false}
                    styles={{
                        root: {
                            boxSizing: 'border-box',
                            width: 'unset',
                            margin: '1em 0 2em',
                        },
                    }}
                >
                    <span>
                        {intl.get('dataSource.extend.notDecided', { count: fieldsNotDecided.length })}
                    </span>
                </MessageBar>
            )}
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
