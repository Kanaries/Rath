import React, { useCallback, useEffect, useState } from 'react';
import { ArtColumn } from 'ali-react-table';
import { observer } from 'mobx-react-lite';
import { IconButton, Label, MessageBar, MessageBarType, Stack } from '@fluentui/react';
import intl from 'react-intl-universal';
import { unstable_batchedUpdates } from 'react-dom';
import { useGlobalStore } from '../../../store';
import type { IFieldMeta, IRow } from '../../../interfaces';
import { extractSelection, intersectPattern } from '../../../lib/textPattern';
import HeaderCell from './headerCell';
import NestPanel from './components/nestPanel';
import TPRegexEditor, { IFieldTextPattern, IFieldTextSelection } from './components/tpRegexEditor';
import { IColStateType } from './headerCell/components/statePlaceholder';
import { CustomBaseTable, MiniButton, MiniPrimaryButton, DATA_TABLE_STYLE_CONFIG, Tag, TextPatternCard } from './styles';
import { findFirstExistTextPattern, groupTextPattern, initGroupedTextPatternList, pickFieldMetaFromFieldMetaWithSuggestions, uniquePattern } from './utils';
// import regexgen from 'regexgen';

function provideSelectionRange (selectedRange: Range, currentNode: Node): { len: number, found: boolean } {
    if (selectedRange.startContainer === currentNode) {
        return {
            len: selectedRange.startOffset,
            found: true
        }
    }
    if (currentNode.nodeType === Node.TEXT_NODE) {
        return {
            len: Number(currentNode.textContent?.length),
            found: false
        }
    }
    let len = 0;
    let found = false;
    for (let child of currentNode.childNodes) {
        const r = provideSelectionRange(selectedRange, child);
        len += r.len
        if (r.found) {
            found = true;
            break;
        }
    }
    return {
        len,
        found
    }
}

const ADD_BATCH_SIZE = 5;

const DataTable: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { filteredDataMetaInfo, fieldsWithExtSug: fields, filteredDataStorage, datasetId } = dataSourceStore;
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
        nlp: 1,
    });
    useEffect(() => {
        // clean state
        setFilteredData([]);
        setTextSelectList([]);
        setEditTP(false);
        setGroupedTextPatternList(initGroupedTextPatternList());
        setTpPos({
            groupKey: 'knowledge',
            index: 0,
        });
        setGroupShownSize({
            knowledge: 1,
            generalize: 1,
            specific: 1,
            nlp: 1,
        });
    }, [datasetId]);

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
            const selectedRange = range.cloneRange();
            const search = provideSelectionRange(selectedRange, td);
            if (search.found) {
                const startIndex = search.len;
                const endIndex = startIndex + selectedText.length;
                const nextTSL = textSelectList.concat({
                    fid,
                    str: fullText,
                    startIndex: startIndex,
                    endIndex: endIndex,
                });
                const nextTPL = tsList2tpList(nextTSL);
                // fetch('http://127.0.0.1:5533/api/text_pattern_extraction', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({
                //         values: dataSourceStore.cleanedData.map((d) => `${d[fid]}`),
                //         selections: [...textSelectList.map((t) => t.str.slice(t.startIndex, t.endIndex)), fullText.slice(startIndex, endIndex)].map(
                //             (d) => `${d}`
                //         ),
                //     }),
                // })
                //     .then((res) => res.json())
                //     .then((res) => {
                //         const extractions: { score: number; best_match: string }[] = res.data.extractions;
                //         const wordSets: Set<string> = new Set(extractions.filter((e) => e.score > 0.72).map((e) => e.best_match));
                //         const wordsInRegExp = new RegExp(
                //             Array.from(wordSets)
                //                 .map((w) => `${w}`)
                //                 .join('|')
                //         );
                //         const textPatternsInNL: IFieldTextPattern[] = [
                //             {
                //                 fid,
                //                 ph: /.*/,
                //                 pe: /.*/,
                //                 selection: wordsInRegExp,
                //                 selectionType: 'nlp',
                //                 score: 0.001,
                //                 pattern: new RegExp(`^.*(?<selection>${wordsInRegExp.source}).*$`),
                //             },
                //         ];
                //         unstable_batchedUpdates(() => {
                //             const gtp = groupTextPattern(nextTPL.concat(textPatternsInNL));
                //             setGroupedTextPatternList(gtp);
                //             const enhanceKeys: IFieldTextPattern['selectionType'][] | undefined = nextTSL.length > 1 ? undefined : ['knowledge'];
                //             setTpPos(findFirstExistTextPattern(gtp, enhanceKeys));
                //         });
                //     });
                unstable_batchedUpdates(() => {
                    setTextSelectList(nextTSL);
                    // setTextPatternList(nextTPL);
                    const gtp = groupTextPattern(nextTPL);
                    setGroupedTextPatternList(gtp);
                    const enhanceKeys: IFieldTextPattern['selectionType'][] | undefined = nextTSL.length > 1 ? undefined : ['knowledge'];
                    setTpPos(findFirstExistTextPattern(gtp, enhanceKeys));
                });
            }
        },
        // [textSelectList, tsList2tpList, dataSourceStore.cleanedData]
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
        const fm: IFieldMeta | undefined = pickFieldMetaFromFieldMetaWithSuggestions(fields[i] && fields[i].fid === displayList[i].fid ? fields[i] : fields.find((m) => m.fid === f.fid));
        const suggestions = fields.find((_f) => _f.fid === f.fid)?.extSuggestions ?? [];
        let colType: IColStateType | undefined = undefined;
        const previrewField = fields.find((f) => f.stage === 'preview');
        if (f.stage === 'preview') {
            colType = 'preview';
        } else if (previrewField) {
            if (previrewField.extInfo?.extFrom.includes(f.fid)) {
                colType = 'source';
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
                    comment={f.comment ?? ''}
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
                            <span>{textBeforeSelection}</span>
                            <span style={{ backgroundColor: DATA_TABLE_STYLE_CONFIG.SELECT_COLOR }}>{matchedText}</span>
                            <span>{textAfterSelection}</span>
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

    const hasPattern = (Object.keys(groupedTextPatternList) as IFieldTextPattern['selectionType'][]).some(
        (k: IFieldTextPattern['selectionType']) => groupedTextPatternList[k].length > 0
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
            <div style={{ display: 'flex' }}>
                {columns.length > 0 && (
                    <CustomBaseTable
                        useVirtual={true}
                        getRowProps={rowPropsCallback}
                        style={DATA_TABLE_STYLE_CONFIG.TABLE_INNER_STYLE}
                        dataSource={filteredData}
                        columns={columns}
                    />
                )}
                <NestPanel show={hasPattern} onClose={() => {}}>
                    <IconButton style={{ float: 'right' }} iconProps={{ iconName: 'Cancel' }} onClick={clearTextSelect} />
                    <Label>{intl.get('common.suggestions')}</Label>
                    {(['knowledge', 'generalize', 'specific', 'nlp'] as IFieldTextPattern['selectionType'][]).map((groupKey) =>
                        groupedTextPatternList[groupKey].slice(0, groupShownSize[groupKey]).map((tp, ti) => (
                            <TextPatternCard key={tp.pattern.source + ti}>
                                <Tag>{intl.get(`dataSource.textPattern.${groupKey}`)}</Tag>
                                {tpPos.index === ti && tpPos.groupKey === groupKey && (
                                    <Tag color="#fff" bgColor="#14b8a6">
                                        {intl.get('dataSource.textPattern.currentPattern')}
                                    </Tag>
                                )}
                                {tp.selectionType !== 'nlp' && (
                                    <div className="tp-content">
                                        <span className="ph-text">{tp.ph.source}</span>
                                        <span className="sl-text">{tp.selection.source}</span>
                                        <span className="pe-text">{tp.pe.source}</span>
                                    </div>
                                )}
                                {
                                    tp.selectionType === 'nlp' && <div style={{ margin: '12px 0px'}}>
                                        {
                                            tp.selection.source.split('|').map((s, i) => {
                                                return <Tag color='#14532d' bgColor='#dcfce7' key={i}>{s}</Tag>;
                                            })
                                        }
                                    </div>
                                }
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
