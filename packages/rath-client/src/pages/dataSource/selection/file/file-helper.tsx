import intl from 'react-intl-universal';
import { ChoiceGroup, Dropdown, IChoiceGroupOption, Label, SpinButton, TextField } from '@fluentui/react';
import { FC, useMemo, useState } from 'react';
import styled from 'styled-components';
import produce from 'immer';
import { SampleKey, useSampleOptions } from '../../utils';


export const charsetOptions = [
    {
        text: 'UTF-8',
        key: 'utf-8',
    },
    {
        text: 'GB2312',
        key: 'gb2312',
    },
    {
        text: 'US-ASCII',
        key: 'us-ascii',
    },
    {
        text: 'Big5',
        key: 'big5',
    },
    {
        text: 'Big5-HKSCS',
        key: 'Big5-HKSCS',
    },
    {
        text: 'GB18030',
        key: 'GB18030',
    },
] as const;

export type Charset = typeof charsetOptions[number]['key'];

const Container = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 1em;
    row-gap: 1em;
    padding-top: 1em;
    & label {
        font-weight: 400;
        margin-right: 1em;
        text-transform: capitalize;
    }
    & [role='radiogroup'] {
        display: flex;
        flex-direction: row;
        align-items: center;
        > div {
            display: flex;
            flex-direction: row;
            > * {
                margin: 0;
            }
        }
    }
    > * {
        margin-bottom: 0.8em;
    }
    & .spin-group {
        display: flex;
        flex-direction: row;
        align-items: center;
        /* & * {
            min-width: unset;
            width: max-content;
            height: max-content;
            min-height: unset;
        } */
        > * {
            flex-grow: 0;
            flex-shrink: 0;
            width: max-content;
            white-space: nowrap;
            margin-left: 0.5em;
            :first-child {
                margin-left: 0;
            }
        }
        /* & input {
            width: 3em;
        } */
    }
`;

export interface IFileHelperProps {
    showMoreConfig: boolean;
    charset: Charset;
    setCharset: (charset: Charset) => void;
    sampleMethod: SampleKey;
    setSampleMethod: (sampleMethod: SampleKey) => void;
    sampleSize: number;
    setSampleSize: (sampleSize: number | ((prev: number) => number)) => void;
    preview: File | null;
    isExcel: boolean;
    excelRef: [[number, number], [number, number]];
    excelRange: [[number, number], [number, number]];
    setExcelRange: (range: [[number, number], [number, number]]) => void;
    sheetNames: string[] | false;
    selectedSheetIdx: number;
    setSelectedSheetIdx: (selectedSheetIdx: number) => void;
    separator: string;
    setSeparator: (separator: string) => void;
}

const FileHelper: FC<IFileHelperProps> = ({
    showMoreConfig,
    charset,
    setCharset,
    sampleMethod,
    setSampleMethod,
    sampleSize,
    setSampleSize,
    preview,
    sheetNames,
    selectedSheetIdx,
    setSelectedSheetIdx,
    separator,
    setSeparator,
    isExcel,
    excelRef,
    excelRange,
    setExcelRange,
}) => {
    const sampleOptions = useSampleOptions();
    const [customizeSeparator, setCustomizeSeparator] = useState('');

    const separatorOptions = useMemo<IChoiceGroupOption[]>(() => {
        return [
            { key: ',', text: intl.get('dataSource.upload.separator.comma') },
            { key: '\t', text: intl.get('dataSource.upload.separator.tab') },
            { key: ';', text: intl.get('dataSource.upload.separator.semicolon') },
            {
                key: '',
                text: intl.get('dataSource.upload.separator.other'),
                onRenderField(props, defaultRenderer) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            {defaultRenderer?.(props)}
                            <TextField
                                value={customizeSeparator}
                                name="rath_upload_file_col_separator"
                                onChange={(_, value) => {
                                    setCustomizeSeparator(value ?? '');
                                    if (value) {
                                        setSeparator(value);
                                    }
                                }}
                            />
                        </div>
                    );
                },
            },
        ];
    }, [customizeSeparator, setSeparator]);

    const selectedSeparatorKey = separatorOptions.find((opt) => opt.key === separator)?.key ?? '';

    return (
        <Container>
            {showMoreConfig && (
                <>
                    <Label>{intl.get('dataSource.charset')}</Label>
                    <Dropdown
                        style={{ maxWidth: '120px' }}
                        options={charsetOptions.slice()}
                        selectedKey={charset}
                        onChange={(_, item) => {
                            item && setCharset(item.key as Charset);
                        }}
                    />
                </>
            )}
            {(!preview || preview.type.match(/^text\/.*/)) && (
                <>
                    {showMoreConfig && (
                        <>
                            <Label>{intl.get('dataSource.separator')}</Label>
                            <ChoiceGroup
                                options={separatorOptions}
                                selectedKey={selectedSeparatorKey}
                                onChange={(_, option) => {
                                    if (option) {
                                        setSeparator(option.key);
                                    }
                                }}
                            />
                        </>
                    )}
                    {(!preview || preview.type === 'text/csv') && separator === ',' && (
                        <>
                            <Label>{intl.get('dataSource.upload.sampling')}</Label>
                            <ChoiceGroup
                                options={sampleOptions}
                                selectedKey={sampleMethod}
                                onChange={(_, option) => {
                                    if (option) {
                                        setSampleMethod(option.key as SampleKey);
                                    }
                                }}
                            />
                            {sampleMethod === SampleKey.reservoir && (
                                <>
                                    <Label>{intl.get('dataSource.upload.percentSize')}</Label>
                                    <SpinButton
                                        label={intl.get("dataSource.upload.percentSize")}
                                        min={0}
                                        step={1}
                                        value={sampleSize.toString()}
                                        onValidate={(value) => {
                                            setSampleSize(Number(value));
                                        }}
                                        onIncrement={() => {
                                            setSampleSize((v) => v + 1);
                                        }}
                                        onDecrement={() => {
                                            setSampleSize((v) => Math.max(v - 1, 0));
                                        }}
                                    />
                                </>
                            )}
                        </>
                    )}
                </>
            )}
            {sheetNames && (
                <>
                    <Label>{intl.get('dataSource.upload.sheet')}</Label>
                    <Dropdown
                        style={{ maxWidth: '20em' }}
                        options={sheetNames.map((name, i) => ({ key: `${i}`, text: name }))}
                        selectedKey={`${selectedSheetIdx}`}
                        onChange={(_, option) => option?.key && setSelectedSheetIdx(Number(option.key))}
                    />
                </>
            )}
            {isExcel && (
                <>
                    <Label>{intl.get('dataSource.upload.excel_range')}</Label>
                    <div className="spin-group">
                        <SpinButton
                            value={String(excelRange[0][0])}
                            min={excelRef[0][0]}
                            max={Math.min(excelRef[1][0], excelRange[1][0])}
                            step={1}
                            style={{ maxWidth: '4em' }}
                            onChange={(_, str) =>
                                str &&
                                setExcelRange(
                                    produce(excelRange, (draft) => {
                                        draft[0][0] = Number(str);
                                    })
                                )
                            }
                        />
                        <span>,</span>
                        <SpinButton
                            value={String(excelRange[0][1])}
                            min={excelRef[0][1]}
                            max={Math.min(excelRef[1][1], excelRange[1][1])}
                            step={1}
                            style={{ maxWidth: '4em' }}
                            onChange={(_, str) =>
                                str &&
                                setExcelRange(
                                    produce(excelRange, (draft) => {
                                        draft[0][1] = Number(str);
                                    })
                                )
                            }
                        />
                        <span>{'-'}</span>
                        <SpinButton
                            value={String(excelRange[1][0])}
                            min={Math.max(excelRef[0][0], excelRange[0][0])}
                            max={excelRef[1][0]}
                            step={1}
                            style={{ maxWidth: '4em' }}
                            onChange={(_, str) =>
                                str &&
                                setExcelRange(
                                    produce(excelRange, (draft) => {
                                        draft[1][0] = Number(str);
                                    })
                                )
                            }
                        />
                        <span>,</span>
                        <SpinButton
                            value={String(excelRange[1][1])}
                            min={Math.max(excelRef[0][1], excelRange[0][1])}
                            max={excelRef[1][1]}
                            step={1}
                            style={{ maxWidth: '4em' }}
                            onChange={(_, str) =>
                                str &&
                                setExcelRange(
                                    produce(excelRange, (draft) => {
                                        draft[1][1] = Number(str);
                                    })
                                )
                            }
                        />
                    </div>
                </>
            )}
        </Container>
    );
};

export default FileHelper;
