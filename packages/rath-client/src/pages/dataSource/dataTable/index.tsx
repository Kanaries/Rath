import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArtColumn, BaseTable, Classes } from 'ali-react-table';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { MessageBar, MessageBarType } from '@fluentui/react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import type { IRow } from '../../../interfaces';
import { extractSelection, intersectPattern, ITextPattern, ITextSelection } from '../../../lib/textPattern/init';
import HeaderCell from './headerCell';

const CustomBaseTable = styled(BaseTable)`
    --header-bgcolor: #ffffff !important;
    --bgcolor: rgba(0, 0, 0, 0);
    --border-color: #f2f2f2;
    .${Classes.tableHeaderCell} {
        position: relative;
    }
    thead {
        vertical-align: top;
        th {
            padding: 0px 0px 8px 0px;
        }
    }
`;

const TableInnerStyle = {
    height: 600,
    overflow: 'auto',
};

interface IFieldTextSelection extends ITextSelection {
    fid: string;
}
interface IFieldTextPattern extends ITextPattern {
    fid: string;
}

const DataTable: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { filteredDataMetaInfo, fieldsWithExtSug: fields, filteredDataStorage } = dataSourceStore;
    const [filteredData, setFilteredData] = useState<IRow[]>([]);
    const [textSelectList, setTextSelectList] = useState<IFieldTextSelection[]>([]);
    const textPattern = useMemo<IFieldTextPattern | undefined>(() => {
        if (textSelectList.length === 0) return;
        const res = intersectPattern(textSelectList);
        if (res) {
            return {
                fid: textSelectList[0].fid,
                ...res,
            };
        }
    }, [textSelectList]);
    useEffect(() => {
        if (filteredDataMetaInfo.versionCode === -1) {
            setFilteredData([]);
        } else {
            filteredDataStorage.getAll().then((data) => {
                setFilteredData(data.slice(0, 1000));
            });
        }
    }, [filteredDataMetaInfo.versionCode, filteredDataStorage]);

    const fieldsNotDecided = fields.filter((f) => f.stage === 'preview');

    const updateFieldInfo = useCallback(
        (fieldId: string, fieldPropKey: string, value: any) => {
            dataSourceStore.updateFieldInfo(fieldId, fieldPropKey, value);
        },
        [dataSourceStore]
    );

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
            const parent = displayList.findIndex((_f) => _f.fid === from);

            if (parent !== -1) {
                displayList.splice(parent + 1, 0, f);
            } else {
                displayList.push(f);
            }
        }
    }
    const onTextSelect = useCallback((fid: string, fullText: string, td: Node) => {
        const sl = document.getSelection();
        const range = sl?.getRangeAt(0);
        if (!range) return;
        const selectedText = range.toString();
        // Create a range representing the selected text
        const selectedRange = range.cloneRange();
        // Create a range representing the full text of the element
        const fullRange = document.createRange();
        fullRange.selectNodeContents(td);
        let startNode = td.firstChild;
        let startPos = 0;
        while (startNode) {
            if (startNode === selectedRange.startContainer) break;
            if (startNode.nodeType === Node.TEXT_NODE) {
                startPos += startNode.textContent?.length || 0;
            }
            if (startNode.nextSibling) {
                startNode = startNode.nextSibling;
            } else {
                break;
            }
        }
        // Compare the selected range to the full range
        startPos += selectedRange.startOffset;
        let endPos = startPos + selectedText.length;
        if (fullText && selectedText) {
            const startIndex = startPos;
            const endIndex = endPos;
            setTextSelectList((l) =>
                l.concat({
                    fid,
                    str: fullText,
                    startIndex: startIndex,
                    endIndex: endIndex,
                })
            );
        }
    }, []);
    const clearTextSelect = () => {
        setTextSelectList([]);
    };
    useEffect(() => {
        if (textPattern?.fid) {
            dataSourceStore.expandFromSelectionPattern(textPattern?.fid, textPattern);
        } else {
            dataSourceStore.clearTextPatternIfExist();
        }
    }, [dataSourceStore, textPattern]);

    useEffect(() => {
        // clear text pattern when ESC is pressed
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                clearTextSelect();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const columns: ArtColumn[] = displayList.map((f, i) => {
        const fm = fields[i] && fields[i].fid === displayList[i].fid ? fields[i] : fields.find((m) => m.fid === f.fid);
        const suggestions = fields.find((_f) => _f.fid === f.fid)?.extSuggestions ?? [];

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
        col.render = (value: any) => {
            const text: string = `${value}`;
            if (textPattern && textPattern.fid === f.fid) {
                const res = extractSelection(textPattern, text);

                if (!res.missing) {
                    const { matchedText, matchPos } = res;
                    const textBeforeSelection = text.slice(0, matchPos[0]);
                    const textAfterSelection = text.slice(matchPos[1]);
                    const ele = (
                        <span
                            className="cell-content"
                            onMouseUp={(e) => {
                                const ele = (e.currentTarget.className === 'cell-content' ? e.currentTarget : e.currentTarget.parentElement) as Node;
                                onTextSelect(f.fid, `${text}`, ele);
                            }}
                        >
                            {textBeforeSelection}
                            <span style={{ backgroundColor: '#b7eb8f' }}>{matchedText}</span>
                            {textAfterSelection}
                        </span>
                    );
                    return ele;
                }
            }
            return (
                <span
                    className="cell-content"
                    onMouseUp={(e) => {
                        onTextSelect(f.fid, `${text}`, e.target as Node);
                    }}
                >
                    {text}
                </span>
            );
        };
        return col;
    });

    const rowPropsCallback = useCallback(
        (record: IRow) => {
            const hasEmpty = fields.some((f) => {
                return !f.disable && (record[f.fid] === null || record[f.fid] === undefined || record[f.fid] === '');
            });
            return {
                style: {
                    backgroundColor: hasEmpty ? '#fff2e8' : 'rgba(0,0,0,0)',
                },
            };
        },
        [fields]
    );

    return (
        <div>
            {fieldsNotDecided.length > 0 && (
                <MessageBar
                    messageBarType={MessageBarType.warning}
                    isMultiline={false}
                    styles={{
                        root: {
                            boxSizing: 'border-box',
                            width: 'unset',
                            margin: '2px 0 0 0',
                        },
                    }}
                >
                    <span>{intl.get('dataSource.extend.notDecided', { count: fieldsNotDecided.length })}</span>
                </MessageBar>
            )}
            {columns.length > 0 && (
                <CustomBaseTable
                    useVirtual={true}
                    getRowProps={rowPropsCallback}
                    style={TableInnerStyle}
                    dataSource={filteredData}
                    columns={columns}
                />
            )}
        </div>
    );
};

export default observer(DataTable);
