import React, { useCallback, useEffect, useState } from 'react';
import { ArtColumn, BaseTable, Classes } from 'ali-react-table';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { DefaultButton, IconButton, Label, MessageBar, MessageBarType, PrimaryButton, Stack } from '@fluentui/react';
import intl from 'react-intl-universal';
import { unstable_batchedUpdates } from 'react-dom';
import { useGlobalStore } from '../../../store';
import type { IRow } from '../../../interfaces';
import { extractSelection, intersectPattern, ITextPattern } from '../../../lib/textPattern/init';
import HeaderCell from './headerCell';
import NestPanel from './nestPanel';
import TPRegexEditor, { IFieldTextPattern, IFieldTextSelection } from './tpRegexEditor';

const SELECT_COLOR = '#b7eb8f';

const CustomBaseTable = styled(BaseTable)`
    --header-bgcolor: #ffffff !important;
    --bgcolor: rgba(0, 0, 0, 0);
    --border-color: #f2f2f2;
    --row-height: 38px;
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

const TextPatternCard = styled.div`
    padding: 8px;
    border: 1px solid #f3f3f3;
    border-radius: 2px;
    max-width: 200px;
    overflow: hidden;
    margin: 8px 0px;
    > .tp-content {
        margin: 1em 0em;
    }
    .sl-text {
        background-color: ${SELECT_COLOR};
    }
`;
const MiniButton = styled(DefaultButton)`
    height: 26px;
    font-size: 12px;
`;

const MiniPrimaryButton = styled(PrimaryButton)`
    height: 26px;
    font-size: 12px;
`;

const TableInnerStyle = {
    height: 600,
    overflow: 'auto',
};

function uniquePattern(textPatternList: ITextPattern[]): ITextPattern[] {
    const keySet: Set<string> = new Set();
    const ans: ITextPattern[] = [];
    for (let tp of textPatternList) {
        if (!keySet.has(tp.pattern.source)) {
            ans.push(tp);
            keySet.add(tp.pattern.source);
        }
    }
    return ans;
}

const DataTable: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { filteredDataMetaInfo, fieldsWithExtSug: fields, filteredDataStorage } = dataSourceStore;
    const [filteredData, setFilteredData] = useState<IRow[]>([]);
    const [textSelectList, setTextSelectList] = useState<IFieldTextSelection[]>([]);
    const [editTP, setEditTP] = useState<boolean>(false);
    const [textPatternList, setTextPatternList] = useState<IFieldTextPattern[]>([]);

    const tsList2tpList = useCallback((tsl: IFieldTextSelection[]) => {
        try {
            if (tsl.length === 0) return [];
            const res = uniquePattern(intersectPattern(tsl));
            return res.map((r) => ({
                ...r,
                fid: tsl[0].fid,
            }));
        } catch (error) {
            return [];
        }
    }, []);
    const [tpIndex, setTpIndex] = useState<number>(0);
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
    const onTextSelect = useCallback(
        (fid: string, fullText: string, td: Node) => {
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
                unstable_batchedUpdates(() => {
                    setTpIndex(0);
                    const nextTSL = textSelectList.concat({
                        fid,
                        str: fullText,
                        startIndex: startIndex,
                        endIndex: endIndex,
                    });
                    const nextTPL = tsList2tpList(nextTSL);
                    setTextSelectList(nextTSL);
                    setTextPatternList(nextTPL);
                });
            }
        },
        [textSelectList, tsList2tpList]
    );
    const clearTextSelect = () => {
        unstable_batchedUpdates(() => {
            setTextSelectList([]);
            setTextPatternList([]);
            setTpIndex(0);
        });
    };
    useEffect(() => {
        if (textPatternList[tpIndex]) {
            dataSourceStore.expandFromSelectionPattern(textPatternList[tpIndex].fid, textPatternList[tpIndex]);
        } else {
            dataSourceStore.clearTextPatternIfExist();
            setTpIndex(0);
        }
    }, [dataSourceStore, textPatternList, tpIndex]);

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
            if (textPatternList[tpIndex] && textPatternList[tpIndex].fid === f.fid) {
                const res = extractSelection(textPatternList[tpIndex], text);

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
                            <span style={{ backgroundColor: SELECT_COLOR }}>{matchedText}</span>
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
        <div style={{ position: 'relative' }}>
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
            <NestPanel show={textPatternList.length > 0} onClose={() => {}}>
            <IconButton style={{ float: 'right' }} iconProps={{ iconName: 'Cancel' }} onClick={clearTextSelect} />
                <Label>{intl.get('common.suggestions')}</Label>
                {textPatternList.map((tp, ti) => (
                    <TextPatternCard key={tp.pattern.source + ti}>
                        <div className="tp-content">
                            <span className="ph-text">{tp.ph.source}</span>
                            <span className="sl-text">{tp.selection.source}</span>
                            <span className="pe-text">{tp.pe.source}</span>
                        </div>
                        <Stack tokens={{ childrenGap: 4 }}>
                            <MiniButton
                                text={intl.get(`common.${tpIndex === ti ? 'applied' : 'apply'}`)}
                                disabled={ti === tpIndex}
                                onClick={() => {
                                    setTpIndex(ti);
                                }}
                            />
                            {ti === tpIndex && (
                                <MiniPrimaryButton
                                    text={intl.get('common.edit')}
                                    onClick={() => {
                                        setEditTP(true);
                                    }}
                                />
                            )}
                        </Stack>
                        {ti === tpIndex && editTP && (
                            <TPRegexEditor
                                tp={tp}
                                onSubmit={(patt) => {
                                    unstable_batchedUpdates(() => {
                                        setTextPatternList((l) => {
                                            const nl = [...l];
                                            nl[tpIndex] = patt;
                                            return nl;
                                        });
                                        setEditTP(false);
                                    });
                                }}
                                onCancel={() => {
                                    setEditTP(false);
                                }}
                            />
                        )}
                    </TextPatternCard>
                ))}
            </NestPanel>
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
