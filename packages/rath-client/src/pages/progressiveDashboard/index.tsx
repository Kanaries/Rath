import { autoSet } from '@kanaries/loa';
import styled from 'styled-components';
import produce from 'immer';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { ActionButton, DefaultButton, Dropdown, IconButton, IDropdownOption, Stack } from '@fluentui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactVega from '../../components/react-vega';

import { IFieldMeta } from '../../interfaces';
import { distVis } from '../../queries/distVis';
import { useGlobalStore } from '../../store';


const Segment = styled.div`
    display: flex;
    flex-wrap: wrap;
`;
const Cont = styled.div`
    .vis-container {
        max-height: 360px;
        overflow-y: auto;
    }
    .operation-container {
        border-top: 1px solid #eee;
        padding-top: 1em;
        max-height: 350px;
        overflow-y: auto;
        /* :hover {
            height: auto;
        } */
    }
    padding: 0.5em;
    margin: 0.25em;
    background-color: #fff;
    flex-grow: 1;
`;

// const init_list: { locked: boolean; fields: (IFieldMeta | '*')[] }[] = [
//     {
//         locked: true,
//         fields: [toJS(fieldMetas.filter((f) => f.analyticType === 'measure')[0])],
//     },
//     // {
//     //     locked: ,
//     //     fields: []
//     //     // fields: [fieldMetas.filter(f => f.semanticType === 'temporal')[0], fieldMetas.filter(f => f.analyticType === 'measure')[1]]
//     // },
//     {
//         locked: false,
//         fields: ['*', '*'],
//     },
//     {
//         locked: false,
//         fields: ['*', '*'],
//     },
//     {
//         locked: false,
//         fields: ['*', '*'],
//     },
//     {
//         locked: false,
//         fields: ['*', '*'],
//     },
//     {
//         locked: false,
//         fields: ['*', '*'],
//     },
//     {
//         locked: false,
//         fields: ['*', '*'],
//     },
//     {
//         locked: false,
//         fields: ['*', '*'],
//     },
// ]

const ProgressiveDashboard: React.FC = (props) => {
    // const ;
    const { dataSourceStore, commonStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const [originSpecList, setOriginSpecList] = useState<{ locked: boolean; fields: (IFieldMeta | '*')[] }[]>([
        {
            locked: true,
            fields: [toJS(fieldMetas.filter((f) => f.analyticType === 'measure')[0])],
        },
        // {
        //     locked: ,
        //     fields: []
        //     // fields: [fieldMetas.filter(f => f.semanticType === 'temporal')[0], fieldMetas.filter(f => f.analyticType === 'measure')[1]]
        // },
        {
            locked: false,
            fields: ['*', '*'],
        },
        {
            locked: false,
            fields: ['*', '*'],
        },
        {
            locked: false,
            fields: ['*', '*'],
        },
        {
            locked: false,
            fields: ['*', '*'],
        },
        {
            locked: false,
            fields: ['*', '*'],
        },
        {
            locked: false,
            fields: ['*', '*'],
        },
        {
            locked: false,
            fields: ['*', '*'],
        },
    ]);

    const [visSettingList, setVisSettingList] = useState<boolean[]>([]);

    const updateFieldsInView = useCallback(
        (viewIndex: number, fieldIndex: number, fieldKey: string) => {
            const val: IFieldMeta | '*' = (fieldKey === '*' ? '*' : fieldMetas.find((f) => f.fid === fieldKey))!;
            setOriginSpecList((sl) => {
                const nextSl = produce(sl, (draft) => {
                    draft[viewIndex].fields[fieldIndex] = val;
                });
                return nextSl;
            });
        },
        [fieldMetas]
    );

    const addFields2View = useCallback(
        (viewIndex: number, fieldKey: string) => {
            const targetView = originSpecList[viewIndex];
            const val: IFieldMeta | '*' = (fieldKey === '*' ? '*' : fieldMetas.find((f) => f.fid === fieldKey))!;
            if (val !== '*' && targetView.fields.find((f) => (f as IFieldMeta).fid === (val as IFieldMeta).fid)) {
                return;
            }
            setOriginSpecList((sl) => {
                const nextSl = produce(sl, (draft) => {
                    draft[viewIndex].fields.push(val);
                });
                return nextSl;
            });
        },
        [originSpecList, fieldMetas]
    );

    const removeFieldsFromView = useCallback(
        (viewIndex: number, fieldKey: string) => {
            const targetView = originSpecList[viewIndex];
            const val: IFieldMeta | '*' = (fieldKey === '*' ? '*' : fieldMetas.find((f) => f.fid === fieldKey))!;
            const targetFieldIndex = targetView.fields.findIndex(
                (f) => f === val || (f as IFieldMeta).fid === (val as IFieldMeta).fid
            );
            if (targetFieldIndex > -1) {
                setOriginSpecList((sl) => {
                    const nextSl = produce(sl, (draft) => {
                        draft[viewIndex].fields.splice(targetFieldIndex, 1);
                    });
                    return nextSl;
                });
            }
        },
        [originSpecList, fieldMetas]
    );
    const recommendVisList = useMemo(() => {
        if (cleanedData.length > 0 && fieldMetas.length > 0) {
            return autoSet(cleanedData, toJS(fieldMetas), originSpecList);
        }
        return [];
    }, [cleanedData, fieldMetas, originSpecList]);

    const addView = useCallback(() => {
        setOriginSpecList((sl) => [
            ...sl,
            {
                locked: false,
                fields: ['*', '*'],
            },
        ]);
    }, []);

    const deleteView = useCallback((viewIndex: number) => {
        setOriginSpecList((sl) => {
            const nextSl = [...sl]
            nextSl.splice(viewIndex, 1);
            return nextSl
        });
    }, []);

    const selectableFields = useMemo<IDropdownOption[]>(() => {
        return [
            {
                key: '*',
                text: '*',
            },
        ].concat(
            fieldMetas.map((fm) => {
                return {
                    key: fm.fid,
                    text: fm.name || fm.fid,
                };
            })
        );
    }, [fieldMetas]);

    const toggleViewLocked = useCallback((viewIndex) => {
        setOriginSpecList((sl) => {
            const nextSl = produce(sl, (draft) => {
                draft[viewIndex].locked = !draft[viewIndex].locked;
                draft[viewIndex].fields = recommendVisList[viewIndex].fields
                const unLockIndex = draft.findIndex(v => v.locked === false)
                if (unLockIndex > -1) {
                    const t = draft[unLockIndex];
                    draft[unLockIndex] = draft[viewIndex]
                    draft[viewIndex] = t;
                }
            });
            return nextSl;
        });
    }, [recommendVisList]);

    const toggleVisSetting = useCallback((viewIndex) => {
        setVisSettingList((l) => {
            const nl = [...l];
            nl[viewIndex] = !nl[viewIndex];
            return nl;
        });
    }, []);

    useEffect(() => {
        setVisSettingList(originSpecList.map(() => false));
    }, [originSpecList]);

    return (
        <Segment className="flex flex-wrap">
            {recommendVisList.map((vis, visIndex) => (
                <Cont key={visIndex}>
                    {/* {
                    <ReactJson src={vis} />
                } */}
                    <Stack horizontal>
                        <IconButton
                            iconProps={{ iconName: originSpecList[visIndex].locked ? 'PinSolid12' : 'Pin' }}
                            onClick={() => {
                                toggleViewLocked(visIndex);
                            }}
                        />
                        <IconButton
                            iconProps={{ iconName: 'Settings' }}
                            onClick={() => {
                                toggleVisSetting(visIndex);
                            }}
                        />
                        <IconButton
                            iconProps={{ iconName: 'Delete' }}
                            onClick={() => {
                                deleteView(visIndex);
                            }}
                        />
                    </Stack>
                    <div className="vis-container">
                        <ReactVega
                            dataSource={cleanedData}
                            spec={distVis({
                                pattern: {
                                    fields: vis.fields.filter((f) => f !== '*') as IFieldMeta[],
                                    imp: 0,
                                },
                            })}
                            config={commonStore.themeConfig}
                        />
                    </div>
                    {visSettingList[visIndex] && (
                        <div className="operation-container">
                            <Stack tokens={{ childrenGap: 10 }}>
                                {originSpecList[visIndex].fields.map((f, fIndex) => {
                                    const selectedKey =
                                        originSpecList[visIndex].fields[fIndex] === '*'
                                            ? '*'
                                            : (originSpecList[visIndex].fields[fIndex] as IFieldMeta).fid;
                                    const fieldSizeMatch = originSpecList[visIndex].fields.length === recommendVisList[visIndex].fields.length;
                                    let selectedName: string | null = null;
                                    if (fieldSizeMatch) {
                                        selectedName = ((recommendVisList[visIndex].fields[fIndex] as IFieldMeta).name || (recommendVisList[visIndex].fields[fIndex] as IFieldMeta).fid)
                                    }
                                    return (
                                        <Stack.Item key={fIndex}>
                                            <Stack horizontal>
                                                <IconButton
                                                    iconProps={{ iconName: 'Delete' }}
                                                    onClick={() => {
                                                        removeFieldsFromView(visIndex, selectedKey);
                                                    }}
                                                />
                                                <Dropdown
                                                    style={{ minWidth: '200px' }}
                                                    options={selectableFields}
                                                    selectedKey={selectedKey}
                                                    onChange={(e, newItem) => {
                                                        newItem &&
                                                            updateFieldsInView(visIndex, fIndex, newItem.key + '');
                                                    }}
                                                />
                                                <ActionButton disabled={selectedName === null} text={selectedName || 'NULL'} iconProps={{ iconName: 'ExportMirrored'}} onClick={() => {
                                                    updateFieldsInView(visIndex, fIndex, (recommendVisList[visIndex].fields[fIndex] as IFieldMeta).fid)
                                                }} />
                                            </Stack>
                                        </Stack.Item>
                                    );
                                })}
                                <Stack.Item>
                                    <DefaultButton
                                        iconProps={{ iconName: 'Add' }}
                                        text="Add Field"
                                        onClick={() => {
                                            addFields2View(visIndex, '*');
                                        }}
                                    />
                                </Stack.Item>
                            </Stack>
                        </div>
                    )}
                </Cont>
            ))}
            <Cont>
                <DefaultButton text="Add View" iconProps={{ iconName: 'ReportAdd' }} onClick={addView} />
            </Cont>
        </Segment>
    );
};

export default observer(ProgressiveDashboard);
