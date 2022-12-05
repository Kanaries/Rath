import intl from 'react-intl-universal';
import { ChoiceGroup, Dropdown, SpinButton } from "@fluentui/react";
import type { FC } from "react";
import styled from "styled-components";
import { SampleKey, useSampleOptions } from '../../utils';


export const charsetOptions = [
    {
        text: 'UTF-8',
        key: 'utf-8'
    },
    {
        text: 'GB2312',
        key: 'gb2312'
    },
    {
        text: 'US-ASCII',
        key: 'us-ascii'
    },
    {
        text: 'Big5',
        key: 'big5'
    },
    {
        text: 'Big5-HKSCS',
        key: 'Big5-HKSCS'
    },
    {
        text: 'GB18030',
        key: 'GB18030'
    },
] as const;

export type Charset = typeof charsetOptions[number]['key'];

const Container = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    & label {
        font-weight: 400;
        margin-right: 1em;
    }
    & [role=radiogroup] {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 1em 0;
        > div {
            display: flex;
            flex-direction: row;
            > * {
                margin: 0;
            }
        }
    }
`;

export interface IFileHelperProps {
    charset: Charset;
    setCharset: (charset: Charset) => void;
    sampleMethod: SampleKey;
    setSampleMethod: (sampleMethod: SampleKey) => void;
    sampleSize: number;
    setSampleSize: (sampleSize: number | ((prev: number) => number)) => void;
    preview: File | null;
    sheetNames: string[] | false;
    selectedSheetIdx: number;
    setSelectedSheetIdx: (selectedSheetIdx: number) => void;
}

const FileHelper: FC<IFileHelperProps> = ({
    charset, setCharset, sampleMethod, setSampleMethod, sampleSize, setSampleSize, preview, sheetNames,
    selectedSheetIdx, setSelectedSheetIdx,
}) => {
    const sampleOptions = useSampleOptions();

    return (
        <Container>
            <Dropdown
                label={intl.get('dataSource.charset')}
                style={{ maxWidth: '120px' }}
                options={charsetOptions.slice()}
                selectedKey={charset}
                onChange={(_, item) => {
                    item && setCharset(item.key as Charset)
                }}
                styles={{ root: { display: 'flex', flexDirection: 'row', marginRight: '2em' }, label: { marginRight: '1em', fontWeight: 400 }, dropdown: { width: '8em' } }}
            />
            {!preview || preview.name.endsWith('.csv') ? (
                <>
                    <ChoiceGroup
                        label={intl.get("dataSource.upload.sampling")}
                        options={sampleOptions}
                        selectedKey={sampleMethod}
                        onChange={(_, option) => {
                            if (option) {
                                setSampleMethod(option.key as SampleKey);
                            }
                        }}
                    />
                    {sampleMethod === SampleKey.reservoir && (
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
                    )}
                </>
            ) : null}
            {sheetNames && (
                <Dropdown
                    label={intl.get("dataSource.upload.sheet")}
                    options={sheetNames.map((name, i) => ({ key: `${i}`, text: name }))}
                    selectedKey={`${selectedSheetIdx}`}
                    onChange={(_, option) => option?.key && setSelectedSheetIdx(Number(option.key))}
                    styles={{ root: { padding: '1em 0', display: 'flex', flexDirection: 'row', marginRight: '2em' }, label: { marginRight: '1em', fontWeight: 400 }, dropdown: { width: '10em' } }}
                />
            )}
        </Container>
    );
};


export default FileHelper;
