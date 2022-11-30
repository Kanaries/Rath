import React, { useCallback, useEffect, useState} from "react";
import { ArtColumn, BaseTable, Classes } from "ali-react-table";
import styled from "styled-components";
import { observer } from 'mobx-react-lite'
import { MessageBar, MessageBarType } from "@fluentui/react";
import intl from 'react-intl-universal';
import { useGlobalStore } from "../../../store";
import type { IRow } from "../../../interfaces";
import { initPatterns } from "../../../lib/textPattern/init";
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
    const { filteredDataMetaInfo, fieldsWithExtSug: fields, filteredDataStorage } = dataSourceStore;
    const [filteredData, setFilteredData] = useState<IRow[]>([]);
    const [textPattern, setTextPattern] = useState<{
        fid: string;
        ph: RegExp;
        pe: RegExp;
        selection: RegExp;
        pattern: RegExp;
    } | undefined>();
    useEffect(() => {
        if (filteredDataMetaInfo.versionCode === -1) {
            setFilteredData([]);
        } else {
            filteredDataStorage.getAll().then((data) => {
                setFilteredData(data.slice(0, 1000));
            })
        }
    }, [filteredDataMetaInfo.versionCode, filteredDataStorage])

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

    const displayList: typeof fields = [];

    for (const f of fields) {
        if (f.stage === undefined) {
            displayList.push(f);
        }
    }

    for (const f of fields) {
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
    const onTextSelect = (fid: string, fullText: string) => {
        const sl = document.getSelection();
        // const fullText = sl?.focusNode?.nodeValue;
        const selectedText = sl?.toString();
        if (fullText && selectedText) {
            // console.log({
            //     fullText,
            //     selectedText,
            //     sl
            // })
            const startIndex = fullText.indexOf(selectedText);
            const endIndex = startIndex + selectedText.length;
            const res = initPatterns([{
                str: fullText,
                startIndex: startIndex,
                endIndex: endIndex,
            }])
            if (res) {
                setTextPattern({
                    fid,
                    ...res
                });
            }
        }
    }

    const columns: ArtColumn[] = displayList.map((f, i) => {
        const fm = (fields[i] && fields[i].fid === displayList[i].fid) ? fields[i] : fields.find(m => m.fid === f.fid);
        const suggestions = fields.find(_f => _f.fid === f.fid)?.extSuggestions ?? [];

        const col: ArtColumn = {
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
            if (textPattern && textPattern.fid === f.fid) {
                col.render = (value: any) => {
                    const { ph, pe, selection, pattern } = textPattern;
                    const text: string = value?.toString() ?? '';
                    const match = pattern.exec(value)
                    // console.log({ match, text, value, pattern, ph, pe, selection })
                    if (match) {
                        // @ts-ignore
                        const matched = match.groups['selection'];
                        if (!matched) return;
                        const start = text.indexOf(matched);
                        const end = start + matched.length;
                        const before = text.slice(0, start);
                        const after = text.slice(end);
                        
                        return (
                            <span onMouseUp={() => {
                                onTextSelect(f.fid, `${value}`)
                            }}>
                                {before}
                                <span style={{ backgroundColor: '#FFC107' }}>
                                    {matched}
                                </span>
                                {after}
                            </span>
                        );
                    }
                    return text;
                }
            } else {
                col.render = (value: any) => {
                    return <span onMouseUp={() => {
                        onTextSelect(f.fid, `${value}`)
                    }}>
                        {value}
                    </span>
                }
            }
            return col;
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
                            backgroundColor: 'rgba(0, 120, 212, 0.12)',
                            // border: '1px solid rgba(0, 120, 212, 0.5)',
                            margin: '2px 0 1em 0',
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
                            margin: '2px 0 1em 0',
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
                style={TableInnerStyle} dataSource={filteredData} columns={columns} />
            }
        </div>
    );
};

export default observer(DataTable);
