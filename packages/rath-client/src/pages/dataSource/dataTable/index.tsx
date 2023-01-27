import React, { useCallback, useEffect, useState } from 'react';
import { ArtColumn, BaseTable, Classes } from 'ali-react-table';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { DefaultButton, IconButton, Label, MessageBar, MessageBarType, PrimaryButton, Stack } from '@fluentui/react';
import intl from 'react-intl-universal';
import { unstable_batchedUpdates } from 'react-dom';
import { useGlobalStore } from '../../../store';
import type { IRow } from '../../../interfaces';
import { extractSelection, intersectPattern, ITextPattern } from '../../../lib/textPattern';
import HeaderCell from './headerCell';
import NestPanel from './nestPanel';
import TPRegexEditor, { IFieldTextPattern, IFieldTextSelection } from './tpRegexEditor';
import { IColStateType } from './headerCell/statePlaceholder';

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
    td {
        cursor: text;
    }
`;



const Tag = styled.div<{color?: string; bgColor?: string}>`
    display: inline-block;
    padding: 0px 8px;
    border-radius: 2px;
    background-color: ${props => props.bgColor || '#f3f3f3'};
    color: ${props => props.color || '#000000'};
    font-size: 12px;
    margin-right: 4px;
    border-radius: 12px;
`;

const TextPatternCard = styled.div`
    padding: 8px;
    border: 1px solid #f3f3f3;
    border-radius: 2px;
    overflow: hidden;
    margin: 8px 0px;
    > .tp-content {
        margin: 1em 0em;
        > span {
            border: 1px solid #f3f3f3;
            display: inline-block;
            overflow-wrap: break-all;
            word-break: break-all;
            white-space: pre-wrap;
        }
    }
    .sl-text {
        background-color: ${SELECT_COLOR};
    }
    .ph-text, .pe-text {
        background-color: #fed7aa;
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

function groupTextPattern(textPatternList: IFieldTextPattern[]): {
    [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
} {
    const res: {
        [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
    } = {
        knowledge: [],
        generalize: [],
        specific: [],
    };
    for (let tp of textPatternList) {
        res[tp.selectionType].push(tp);
    }
    return res;
}

function initGroupedTextPatternList(): {
    [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
} {
    const res: {
        [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
    } = {
        knowledge: [],
        generalize: [],
        specific: [],
    };
    return res;
}

type ITPPos = {
    groupKey: IFieldTextPattern['selectionType'];
    index: number
}
/**
 * find the first exist text pattern (sorted by score)
 */
function findFirstExistTextPattern(
    groupedTextPatternList: {
        [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
    },
    enhanceKeys: IFieldTextPattern['selectionType'][] | undefined = []
): ITPPos {
    const groupKeys = (['knowledge', 'generalize', 'specific'] as IFieldTextPattern['selectionType'][]).filter(k => !enhanceKeys.includes(k));
    const createPatternsOfKeys = (keys: IFieldTextPattern['selectionType'][]) => {
        const _patterns: { pattern: IFieldTextPattern; pos: ITPPos }[] = [];
        for (let groupKey of keys) {
            for (let i = 0; i < groupedTextPatternList[groupKey].length; i++) {
                _patterns.push({
                    pattern: groupedTextPatternList[groupKey][i],
                    pos: {
                        groupKey,
                        index: i,
                    },
                });
            }
        }
        return _patterns;
    }
    const patterns = createPatternsOfKeys(groupKeys);
    const enhancedPatterns = createPatternsOfKeys(enhanceKeys);
    patterns.sort((a, b) => b.pattern.score - a.pattern.score);
    enhancedPatterns.sort((a, b) => b.pattern.score - a.pattern.score);

    if (enhancedPatterns.length > 0) {
        return enhancedPatterns[0].pos;
    }
    if (patterns.length > 0) {
        return patterns[0].pos;
    }
    return {
        groupKey: 'knowledge',
        index: 0,
    };
}

const ADD_BATCH_SIZE = 5;

const DataTable: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { filteredDataMetaInfo, fieldsWithExtSug: fields, filteredDataStorage } = dataSourceStore;
    const [filteredData, setFilteredData] = useState<IRow[]>([]);
    const [textSelectList, setTextSelectList] = useState<IFieldTextSelection[]>([]);
    const [editTP, setEditTP] = useState<boolean>(false);
    // const [textPatternList, setTextPatternList] = useState<IFieldTextPattern[]>([]);
    const [groupedTextPatternList, setGroupedTextPatternList] = useState<{
        [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
    }>(initGroupedTextPatternList());
    const [tpPos, setTpPos] = useState<{ groupKey: IFieldTextPattern['selectionType']; index: number }>({
        groupKey: 'knowledge',
        index: 0,
    });
    const [groupShownSize, setGroupShownSize] = useState<{
        [key in IFieldTextPattern['selectionType']]: number;
    }>({
        knowledge: 1,
        generalize: 1,
        specific: 1,
    });

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
    // const [tpIndex, setTpIndex] = useState<number>(0);
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
                    const nextTSL = textSelectList.concat({
                        fid,
                        str: fullText,
                        startIndex: startIndex,
                        endIndex: endIndex,
                    });
                    const nextTPL = tsList2tpList(nextTSL);
                    setTextSelectList(nextTSL);
                    // setTextPatternList(nextTPL);
                    const gtp = groupTextPattern(nextTPL);
                    setGroupedTextPatternList(gtp);
                    const enhanceKeys: IFieldTextPattern['selectionType'][] | undefined = nextTSL.length > 1 ? undefined : ['knowledge'];
                    setTpPos(findFirstExistTextPattern(gtp, enhanceKeys));
                });
            }
        },
        [textSelectList, tsList2tpList]
    );
    const clearTextSelect = () => {
        unstable_batchedUpdates(() => {
            setTextSelectList([]);
            // setTextPatternList([]);
            setGroupedTextPatternList(initGroupedTextPatternList());
            setTpPos({
                groupKey: 'knowledge',
                index: 0,
            });
        });
    };
    useEffect(() => {
        if (groupedTextPatternList[tpPos.groupKey][tpPos.index]) {
            dataSourceStore.expandFromSelectionPattern(
                groupedTextPatternList[tpPos.groupKey][tpPos.index].fid,
                groupedTextPatternList[tpPos.groupKey][tpPos.index]
            );
        } else {
            dataSourceStore.clearTextPatternIfExist();
            setTpPos({ groupKey: 'knowledge', index: 0 });
        }
    }, [dataSourceStore, groupedTextPatternList, tpPos.groupKey, tpPos.index]);

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
        let colType: IColStateType | undefined = undefined;
        const previrewField = fields.find(f => f.stage === 'preview');
        if (f.stage === 'preview') {
            colType = 'preview';
        } else if (previrewField) {
            if (previrewField.extInfo?.extFrom.includes(f.fid)) {
                colType = 'source'
            }
        }
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
                    colType={colType}
                />
            ),
        };
        col.render = (value: any) => {
            const text: string = `${value}`;
            if (groupedTextPatternList[tpPos.groupKey][tpPos.index] && groupedTextPatternList[tpPos.groupKey][tpPos.index].fid === f.fid) {
                const res = extractSelection(groupedTextPatternList[tpPos.groupKey][tpPos.index], text);

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

    const hasPattern = (Object.keys(groupedTextPatternList) as IFieldTextPattern['selectionType'][]).some((k: IFieldTextPattern['selectionType']) => groupedTextPatternList[k].length > 0);

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
            <div style={{ display: 'flex' }}>
                {columns.length > 0 && (
                    <CustomBaseTable
                        useVirtual={true}
                        getRowProps={rowPropsCallback}
                        style={TableInnerStyle}
                        dataSource={filteredData}
                        columns={columns}
                    />
                )}
                <NestPanel show={hasPattern} onClose={() => {}}>
                    <IconButton style={{ float: 'right' }} iconProps={{ iconName: 'Cancel' }} onClick={clearTextSelect} />
                    <Label>{intl.get('common.suggestions')}</Label>
                    {(['knowledge', 'generalize', 'specific'] as IFieldTextPattern['selectionType'][]).map((groupKey) =>
                        groupedTextPatternList[groupKey].slice(0, groupShownSize[groupKey]).map((tp, ti) => (
                            <TextPatternCard key={tp.pattern.source + ti}>
                                <Tag>{intl.get(`dataSource.textPattern.${groupKey}`)}</Tag>
                                {tpPos.index === ti && tpPos.groupKey === groupKey && <Tag color="#fff" bgColor="#14b8a6">{intl.get('dataSource.textPattern.currentPattern')}</Tag>}
                                <div className="tp-content">
                                    <span className="ph-text">{tp.ph.source}</span>
                                    <span className="sl-text">{tp.selection.source}</span>
                                    <span className="pe-text">{tp.pe.source}</span>
                                </div>
                                <Stack tokens={{ childrenGap: 4 }}>
                                    <MiniButton
                                        text={intl.get(`common.${tpPos.index === ti && tpPos.groupKey === groupKey ? 'applied' : 'apply'}`)}
                                        disabled={tpPos.index === ti && tpPos.groupKey === groupKey}
                                        onClick={() => {
                                            setTpPos({
                                                groupKey,
                                                index: ti,
                                            });
                                        }}
                                    />
                                    {tpPos.index === ti && tpPos.groupKey === groupKey && (
                                        <MiniPrimaryButton
                                            text={intl.get('common.edit')}
                                            onClick={() => {
                                                setEditTP(true);
                                            }}
                                        />
                                    )}
                                    {ti === groupShownSize[groupKey] - 1 && groupedTextPatternList[groupKey].length > groupShownSize[groupKey] && (
                                        <MiniButton
                                            text={intl.get('common.showMore')}
                                            onClick={() => {
                                                setGroupShownSize((s) => {
                                                    const ns = { ...s };
                                                    ns[groupKey] += ADD_BATCH_SIZE;
                                                    return ns;
                                                });
                                            }}
                                        />
                                    )}
                                </Stack>
                                {tpPos.index === ti && tpPos.groupKey === groupKey && editTP && (
                                    <TPRegexEditor
                                        tp={tp}
                                        onSubmit={(patt) => {
                                            unstable_batchedUpdates(() => {
                                                setGroupedTextPatternList((l) => {
                                                    const nl = { ...l };
                                                    nl[groupKey] = [...nl[groupKey]];
                                                    nl[groupKey][ti] = patt;
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
                        ))
                    )}
                </NestPanel>
            </div>
        </div>
    );
};

export default observer(DataTable);
