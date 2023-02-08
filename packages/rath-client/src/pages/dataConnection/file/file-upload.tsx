// Copyright (C) 2023 observedobserver
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { ActionButton, Icon, Pivot, PivotItem, TooltipHost } from '@fluentui/react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styled from 'styled-components';
import type { loadDataFile } from '../../dataSource/utils';
import { notify } from '../../../components/error';
import getFileIcon from '../history/get-file-icon';

const Container = styled.div`
    display: flex;
    margin: 1em 0;
    height: 12em;
    overflow: hidden;
`;

const Input = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: 12em;
    height: 100%;
    > input {
        display: none;
    }
`;

const ActionGroup = styled.div`
    border: 1px solid #8884;
    border-left: none;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > p {
        font-size: 0.9rem;
        margin: 0.6em 1.2em;
        color: #666;
        user-select: none;
    }
    > div {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        & [role='tab'] {
            margin: 0;
            &,
            & * {
                height: max-content;
                min-height: unset;
                line-height: 2em;
            }
        }
        > [role='tabpanel'] {
            flex-grow: 1;
            flex-shrink: 1;
            overflow: hidden;
            > div {
                width: 100%;
                height: 100%;
                overflow: auto;
            }
            & p {
                font-size: 0.8rem;
                margin: 0.6em 1.2em;
                color: #555;
                user-select: none;
            }
        }
    }
`;

const InputButton = styled.div`
    border: 1px solid #115ea320;
    width: 100%;
    height: 100%;
    cursor: pointer;
    color: #115ea3a0;
    display: flex;
    align-items: center;
    justify-content: center;
    :hover {
        background-color: #115ea308;
    }
    > * {
        pointer-events: none;
        user-select: none;
    }
`;

const FileOutput = styled.div`
    border: 1px solid #8884;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    padding: 0 1em;
    > .head {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1em;
        overflow: hidden;
        > i {
            flex-grow: 0;
            flex-shrink: 0;
            width: 4em;
            height: 4em;
            margin: 0 0 0.4em;
        }
        > div {
            flex-grow: 1;
            flex-shrink: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            > header {
                font-size: 0.9rem;
                line-height: 1.2em;
                font-weight: 550;
                white-space: nowrap;
                color: #111;
            }
            > span {
                font-size: 0.6rem;
                line-height: 1.2em;
                margin: 0.6em 0;
                color: #555;
            }
        }
    }
    > .action {
        display: flex;
        align-items: center;
        justify-content: center;
        > button,
        > button i {
            font-size: 0.8rem;
        }
    }
`;

const RawArea = styled.pre`
    font-size: 0.8rem;
    padding: 0.6em 1.2em 2em;
`;

const PreviewArea = styled.table`
    font-size: 0.8rem;
    padding: 0 0 1em;
    & * {
        white-space: nowrap;
    }
    & th {
        font-weight: 550;
    }
    & th,
    & td {
        padding: 0.1em 1em 0.1em 0.4em;
        :nth-child(even) {
            background-color: #8881;
        }
    }
    & tr:nth-child(odd) {
        background-color: #8882;
    }
`;

const MAX_UPLOAD_SIZE = 1024 * 1024 * 128;

function formatSize(size: number) {
    if (size < 1024) {
        return `${size}B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)}KB`;
    }
    if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)}MB`;
    }
    return `${(size / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

export interface IFileUploadProps {
    preview: File | null;
    previewOfRaw: string | null;
    previewOfFull: Awaited<ReturnType<typeof loadDataFile>> | null;
    previewOfFile: Awaited<ReturnType<typeof loadDataFile>> | null;
    onFileUpload: (file: File | null) => void;
}

const FileUpload = forwardRef<{ reset: () => void }, IFileUploadProps>(function FileUpload(
    { preview, previewOfFile, previewOfFull, previewOfRaw, onFileUpload },
    ref
) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReset = useCallback(() => {
        onFileUpload(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.files = null;
            fileInputRef.current.click();
        }
    }, [onFileUpload]);

    useImperativeHandle(ref, () => ({
        reset: () => handleReset(),
    }));

    const handleButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleUpload = useCallback(() => {
        const [file] = fileInputRef.current?.files ?? [];
        if (!file.name.endsWith('.csv') && file.size > MAX_UPLOAD_SIZE) {
            notify({
                type: 'error',
                title: 'Failed to upload',
                content: intl.get('dataSource.advice.upload_file_too_large'),
            });
            return onFileUpload(null);
        }
        onFileUpload(file ?? null);
    }, [onFileUpload]);

    const [previewTab, setPreviewTab] = useState<'parsed' | 'full' | 'raw'>('parsed');

    useEffect(() => {
        if (previewTab === 'full' && !previewOfFull) {
            setPreviewTab('parsed');
        }
    }, [previewOfFull, previewTab]);

    return (
        <Container>
            <Input>
                <input type="file" ref={fileInputRef} onChange={handleUpload} />
                {preview ? (
                    <FileOutput>
                        <div className="head">
                            <Icon iconName={getFileIcon(preview.name)} />
                            <div>
                                <header>
                                    <TooltipHost content={preview.name}>
                                        <span>{preview.name}</span>
                                    </TooltipHost>
                                </header>
                                <span>{formatSize(preview.size)}</span>
                            </div>
                        </div>
                        <div className="action">
                            <ActionButton text={intl.get('dataSource.upload.change')} iconProps={{ iconName: 'Refresh' }} onClick={handleReset} />
                        </div>
                    </FileOutput>
                ) : (
                    <InputButton role="button" tabIndex={0} onClick={handleButtonClick}>
                        <Icon iconName="Upload" style={{ fontSize: '2rem' }} />
                    </InputButton>
                )}
            </Input>
            <ActionGroup>
                {preview ? (
                    <Pivot
                        selectedKey={previewTab}
                        onLinkClick={(item) => {
                            item && setPreviewTab(item.props.itemKey as typeof previewTab);
                        }}
                    >
                        <PivotItem itemKey="parsed" headerText={intl.get('dataSource.upload.preview_parsed')}>
                            {previewOfFile ? (
                                <PreviewArea>
                                    <tbody>
                                        <tr>
                                            {previewOfFile.fields.map((f) => (
                                                <th key={f.fid}>{f.name || f.fid}</th>
                                            ))}
                                        </tr>
                                        {previewOfFile.dataSource.slice(0, 20).map((row, i) => (
                                            <tr key={i}>
                                                {previewOfFile.fields.map((f) => (
                                                    <td key={f.fid}>{JSON.stringify(row[f.fid])}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </PreviewArea>
                            ) : (
                                <p>{intl.get('dataSource.upload.data_is_empty')}</p>
                            )}
                        </PivotItem>
                        {previewOfFull && (
                            <PivotItem itemKey="full" headerText={intl.get('dataSource.upload.preview_full')}>
                                <PreviewArea>
                                    <tbody>
                                        <tr>
                                            {previewOfFull.fields.map((f) => (
                                                <th key={f.fid}>{f.name || f.fid}</th>
                                            ))}
                                        </tr>
                                        {previewOfFull.dataSource.slice(0, 20).map((row, i) => (
                                            <tr key={i}>
                                                {previewOfFull.fields.map((f) => (
                                                    <td key={f.fid}>{JSON.stringify(row[f.fid])}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </PreviewArea>
                            </PivotItem>
                        )}
                        <PivotItem itemKey="raw" headerText={intl.get('dataSource.upload.preview_raw')}>
                            <RawArea>{previewOfRaw}</RawArea>
                        </PivotItem>
                    </Pivot>
                ) : (
                    <p>{intl.get('dataSource.upload.fileTypes')}</p>
                )}
            </ActionGroup>
        </Container>
    );
});

export default observer(FileUpload);
