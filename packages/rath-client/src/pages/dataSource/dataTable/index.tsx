import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { unstable_batchedUpdates } from 'react-dom';
import { useGlobalStore } from '../../../store';
import type { IFieldMeta, IRow } from '../../../interfaces';
import { attachColumnStats, extractSelection, findViolatedNegative, intersectPattern } from '../../../lib/textPattern';
import { RathIcon } from '../../../components/icons';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { RathDataTable, type RathColumn } from '../../../components/rath-ui/rath-data-table';
import HeaderCell from './headerCell';
import NestPanel from './components/nestPanel';
import TPRegexEditor, { IFieldTextPattern, IFieldTextSelection } from './components/tpRegexEditor';
import { IColStateType } from './headerCell/components/statePlaceholder';
import { DataSourceTableContainer, MiniButton, MiniPrimaryButton, DATA_TABLE_STYLE_CONFIG, Tag, TextPatternCard } from './styles';
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

/** any of Alt / Ctrl / ⌘ works as the exclusion modifier — not every keyboard has an Alt key */
function isExcludeModifier(e: React.MouseEvent): boolean {
    return e.altKey || e.ctrlKey || e.metaKey;
}

/**
 * hover-revealed toggle for excluding / restoring a cell — the pointer-only alternative
 * to modifier+click. Renders no text node (the glyph lives in CSS ::after), so it never
 * shifts the offsets of text selections made inside the cell.
 */
const ExcludeToggleButton: React.FC<{ excluded: boolean; title: string; onToggle: () => void }> = ({ excluded, title, onToggle }) => (
    <button
        type="button"
        className={`tp-exclude-btn${excluded ? ' tp-exclude-btn-restore' : ''}`}
        title={title}
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => {
            e.stopPropagation();
            onToggle();
        }}
    />
);

const DataTable: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { filteredDataMetaInfo, fieldsWithExtSug: fields, filteredDataStorage, datasetId } = dataSourceStore;
    const [filteredData, setFilteredData] = useState<IRow[]>([]);
    const [textSelectList, setTextSelectList] = useState<IFieldTextSelection[]>([]);
    // cells the user excluded (negative examples): the pattern must not match these values
    const [textNegativeList, setTextNegativeList] = useState<IFieldTextSelection[]>([]);
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
        setTextNegativeList([]);
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

    const tsList2tpList = useCallback((tsl: IFieldTextSelection[], negatives: string[] = []) => {
        try {
            if (tsl.length === 0) return [];
            const res = uniquePattern(intersectPattern(tsl, negatives));
            return res.map((r) => ({
                ...r,
                fid: tsl[0].fid,
            }));
        } catch (error) {
            return [];
        }
    }, []);

    const columnValuesOf = useCallback(
        (fid: string): string[] => {
            return filteredData.map((row) => `${row[fid] ?? ''}`);
        },
        [filteredData]
    );

    const recomputeTextPatterns = useCallback(
        (nextTSL: IFieldTextSelection[], nextNegatives: IFieldTextSelection[]) => {
            const fid = nextTSL.length > 0 ? nextTSL[0].fid : undefined;
            const negatives = fid ? nextNegatives.filter((n) => n.fid === fid).map((n) => n.str) : [];
            const nextTPL = tsList2tpList(nextTSL, negatives);
            const positiveValues = nextTSL.map((t) => t.str);
            const withStats = fid ? attachColumnStats(nextTPL, columnValuesOf(fid), undefined, positiveValues) : nextTPL;
            const gtp = groupTextPattern(withStats);
            setGroupedTextPatternList(gtp);
            const enhanceKeys: IFieldTextPattern['selectionType'][] | undefined = nextTSL.length > 1 ? undefined : ['knowledge'];
            setTpPos(findFirstExistTextPattern(gtp, enhanceKeys));
        },
        [tsList2tpList, columnValuesOf]
    );
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
            if (selectedText.length === 0) return;
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
                    recomputeTextPatterns(nextTSL, textNegativeList);
                });
            }
        },
        // [textSelectList, tsList2tpList, dataSourceStore.cleanedData]
        [textSelectList, textNegativeList, recomputeTextPatterns]
    );
    const onNegativeToggle = useCallback(
        (fid: string, cellValue: string) => {
            // negative examples only make sense while a pattern is being built on this field
            if (textSelectList.length === 0 || textSelectList[0].fid !== fid) return;
            const exists = textNegativeList.some((n) => n.fid === fid && n.str === cellValue);
            const nextNegatives = exists
                ? textNegativeList.filter((n) => !(n.fid === fid && n.str === cellValue))
                : textNegativeList.concat({ fid, str: cellValue, startIndex: 0, endIndex: 0 });
            unstable_batchedUpdates(() => {
                setTextNegativeList(nextNegatives);
                recomputeTextPatterns(textSelectList, nextNegatives);
            });
        },
        [textSelectList, textNegativeList, recomputeTextPatterns]
    );
    const clearNegatives = useCallback(() => {
        unstable_batchedUpdates(() => {
            setTextNegativeList([]);
            recomputeTextPatterns(textSelectList, []);
        });
    }, [textSelectList, recomputeTextPatterns]);
    const clearTextSelect = () => {
        unstable_batchedUpdates(() => {
            setTextSelectList([]);
            setTextNegativeList([]);
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

    const columns: RathColumn<IRow>[] = displayList.map((f, i) => {
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
        const col: RathColumn<IRow> = {
            key: f.fid,
            name: f.name || f.fid,
            fieldName: f.fid,
            minWidth: 204,
            maxWidth: 204,
            onRenderHeader: () => (
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
        col.onRender = (row) => {
            const value = row[f.fid];
            const text: string = `${value}`;
            const hasActiveSelection = textSelectList.length > 0 && textSelectList[0].fid === f.fid;
            const isExcluded = hasActiveSelection && textNegativeList.some((n) => n.fid === f.fid && n.str === text);
            if (isExcluded) {
                return (
                    <span
                        className="cell-content"
                        title={intl.get('dataSource.textPattern.excludedHint')}
                        style={{
                            backgroundColor: DATA_TABLE_STYLE_CONFIG.EXCLUDE_COLOR,
                            color: DATA_TABLE_STYLE_CONFIG.EXCLUDE_FOREGROUND,
                        }}
                        onMouseUp={(e) => {
                            if (isExcludeModifier(e)) onNegativeToggle(f.fid, text);
                        }}
                    >
                        {text}
                        <ExcludeToggleButton
                            excluded
                            title={intl.get('dataSource.textPattern.excludedHint')}
                            onToggle={() => onNegativeToggle(f.fid, text)}
                        />
                    </span>
                );
            }
            if (groupedTextPatternList[tpPos.groupKey][tpPos.index] && groupedTextPatternList[tpPos.groupKey][tpPos.index].fid === f.fid) {
                const res = extractSelection(groupedTextPatternList[tpPos.groupKey][tpPos.index], text);

                if (!res.missing) {
                    const { matchedText, matchPos } = res;
                    const textBeforeSelection = text.slice(0, matchPos[0]);
                    const textAfterSelection = text.slice(matchPos[1]);
                    const ele = (
                        <span
                            className="cell-content"
                            title={intl.get('dataSource.textPattern.excludeHint')}
                            onMouseUp={(e) => {
                                if (isExcludeModifier(e)) {
                                    onNegativeToggle(f.fid, text);
                                    return;
                                }
                                const ele = (e.currentTarget.className === 'cell-content' ? e.currentTarget : e.currentTarget.parentElement) as Node;
                                onTextSelect(f.fid, `${text}`, ele);
                            }}
                        >
                            <span>{textBeforeSelection}</span>
                            <span
                                style={{
                                    backgroundColor: DATA_TABLE_STYLE_CONFIG.SELECT_COLOR,
                                    color: DATA_TABLE_STYLE_CONFIG.SELECT_FOREGROUND,
                                }}
                            >
                                {matchedText}
                            </span>
                            <span>{textAfterSelection}</span>
                            <ExcludeToggleButton
                                excluded={false}
                                title={intl.get('dataSource.textPattern.excludeHint')}
                                onToggle={() => onNegativeToggle(f.fid, text)}
                            />
                        </span>
                    );
                    return ele;
                }
            }
            return (
                <span
                    className="cell-content"
                    onMouseUp={(e) => {
                        if (isExcludeModifier(e)) {
                            // excluding an unmatched cell pins it as a negative example so
                            // broader patterns picked later cannot silently match it either
                            onNegativeToggle(f.fid, text);
                            return;
                        }
                        onTextSelect(f.fid, `${text}`, e.target as Node);
                    }}
                >
                    {text}
                    {hasActiveSelection && (
                        <ExcludeToggleButton
                            excluded={false}
                            title={intl.get('dataSource.textPattern.excludeHint')}
                            onToggle={() => onNegativeToggle(f.fid, text)}
                        />
                    )}
                </span>
            );
        };
        return col;
    });

    const rowStyle = useCallback(
        (record: IRow) => {
            const hasEmpty = fields.some((f) => {
                return !f.disable && (record[f.fid] === null || record[f.fid] === undefined || record[f.fid] === '');
            });
            return hasEmpty
                ? { backgroundColor: 'var(--negative-subtle)', color: 'var(--negative-subtle-foreground)' }
                : { backgroundColor: 'transparent' };
        },
        [fields]
    );

    const hasPattern = (Object.keys(groupedTextPatternList) as IFieldTextPattern['selectionType'][]).some(
        (k: IFieldTextPattern['selectionType']) => groupedTextPatternList[k].length > 0
    );
    const activeNegatives = textSelectList.length > 0 ? textNegativeList.filter((n) => n.fid === textSelectList[0].fid) : [];

    return (
        <div style={{ position: 'relative' }}>
            {fieldsNotDecided.length > 0 && (
                <Alert className="my-[2px] mb-0 box-border w-auto" variant="warning">
                    <span>{intl.get('dataSource.extend.notDecided', { count: fieldsNotDecided.length })}</span>
                </Alert>
            )}
            {textSelectList.length > 0 && !hasPattern && (
                <Alert className="my-[2px] mb-0 flex box-border w-auto items-center justify-between gap-2" variant="warning">
                    <span>{intl.get('dataSource.textPattern.noPatternFound')}</span>
                    {
                        activeNegatives.length > 0 ? (
                            <div>
                                <MiniButton text={intl.get('dataSource.textPattern.clearExcluded')} onClick={clearNegatives} />
                            </div>
                        ) : null
                    }
                </Alert>
            )}
            <div style={{ display: 'flex' }}>
                {columns.length > 0 && (
                    <DataSourceTableContainer>
                        <RathDataTable
                            items={filteredData}
                            columns={columns}
                            rowStyle={rowStyle}
                            virtualized
                            horizontalVirtualized
                            maxHeight={DATA_TABLE_STYLE_CONFIG.TABLE_INNER_STYLE.height}
                            estimatedRowHeight={38}
                        />
                    </DataSourceTableContainer>
                )}
                <NestPanel show={hasPattern} onClose={() => {}}>
                    <Button type="button" variant="ghost" size="icon" className="float-right" onClick={clearTextSelect}>
                        <RathIcon name="Cancel" />
                    </Button>
                    <Label>{intl.get('common.suggestions')}</Label>
                    {activeNegatives.length > 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{intl.get('dataSource.textPattern.excludedCount', { count: activeNegatives.length })}</span>
                            <MiniButton text={intl.get('dataSource.textPattern.clearExcluded')} onClick={clearNegatives} />
                        </div>
                    ) : (
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 8px 0' }}>
                            {intl.get('dataSource.textPattern.excludeUsage')}
                        </div>
                    )}
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
                                                return <Tag color="var(--positive-subtle-foreground)" bgColor="var(--positive-subtle)" key={i}>{s}</Tag>;
                                            })
                                        }
                                    </div>
                                }
                                {tp.stats && (
                                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0' }}>
                                        {intl.get('dataSource.textPattern.matchStats', {
                                            rate: Math.round(tp.stats.matchRate * 100),
                                            matched: tp.stats.matched,
                                            total: tp.stats.total,
                                            distinct: tp.stats.distinct,
                                        })}
                                    </div>
                                )}
                                <div className="flex flex-col gap-[4px]">
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
                                </div>
                                {tpPos.index === ti && tpPos.groupKey === groupKey && editTP && (
                                    <TPRegexEditor
                                        tp={tp}
                                        validate={(patt) => {
                                            const negatives = textNegativeList.filter((n) => n.fid === patt.fid).map((n) => n.str);
                                            const violated = findViolatedNegative(patt, negatives);
                                            return violated !== null ? intl.get('dataSource.textPattern.editViolatesExclusion') : null;
                                        }}
                                        onSubmit={(patt) => {
                                            const [pattWithStats] = attachColumnStats(
                                                [patt],
                                                columnValuesOf(patt.fid),
                                                undefined,
                                                textSelectList.map((t) => t.str)
                                            );
                                            unstable_batchedUpdates(() => {
                                                setGroupedTextPatternList((l) => {
                                                    const nl = { ...l };
                                                    nl[groupKey] = [...nl[groupKey]];
                                                    nl[groupKey][ti] = pattWithStats;
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
