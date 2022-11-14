import { DefaultButton, PrimaryButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import type { IRow, IFieldMeta, IExtField } from '../../interfaces';
import type { Static } from '../../latiao/program/types';
import { useGlobalStore } from '../../store';
import DistributionChart from '../../pages/dataSource/metaView/distChart';


const Container = styled.div`
    > .preview {
        flex-grow: 1;
        flex-shrink: 1;
        border: 1px solid #8882;
        margin: 1em 0;
        height: 400px;
        overflow: hidden scroll;
        display: flex;
        flex-direction: column;
        align-items: center;
    
        > div {
            margin: 1em 0;
            padding: 1em 2em;
            border: 1px solid;
    
            > header {
                font-size: 0.9rem;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
        }
        & + div {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            > * {
                margin-inline: 1em;
            }
        }
    }
`;

export interface LaTiaoPreviewProps {
    preview: Static<IFieldMeta[]>;
    result: Static<IRow[]> | undefined;
    close: () => void;
    clearInput: () => void;
}

const LaTiaoPreview = observer<LaTiaoPreviewProps>(({ preview, result, close, clearInput }) => {
    const { dataSourceStore } = useGlobalStore();
    const { rawData } = dataSourceStore;

    return (
        <Container>
            <div className="preview">
                {preview.length === 0 ? (
                    <p>
                        {intl.get('dataSource.extend.empty')}
                    </p>
                ) : (
                    <>
                        {preview.map(meta => (
                            <div key={meta.fid}>
                                <header>
                                    {meta.name ? (
                                        <>
                                            {meta.name}
                                            <small>
                                                {`(${meta.fid})`}
                                            </small>
                                        </>
                                    ) : meta.fid}
                                </header>
                                <DistributionChart
                                    dataSource={meta.distribution as unknown as IRow[]}
                                    x="memberName"
                                    y="count"
                                    height={70}
                                    width={220}
                                    maxItemInView={16}
                                    analyticType={meta.analyticType}
                                    semanticType={meta.semanticType}
                                />
                            </div>
                        ))}
                    </>
                )}
            </div>
            <div>
                <PrimaryButton
                    disabled={preview.length === 0 || !result}
                    onClick={() => {
                        if (preview.length === 0 || !result) {
                            return;
                        }
                        if (result.length !== rawData.length) {
                            console.error(
                                'Lengths do not match:',
                                result.length,
                                rawData.length,
                            );

                            return;
                        }

                        // dataSourceStore.mergeExtended(resultRef.current, preview);
                        dataSourceStore.addExtFieldsFromRows(
                            result,
                            preview.map(f => ({
                                ...f,
                                extInfo: f.extInfo ? {
                                    extOpt: f.extInfo.extOpt,
                                    extInfo: f.extInfo.extInfo,
                                    extFrom: f.extInfo.extFrom.map(s => s.slice(1)),    // 里面为了防止 fid 作为保留字前面加了一个下划线所以这里记得去掉
                                } : undefined,
                                stage: 'settled',
                            }) as IExtField),
                        );
                        close();
                        clearInput();
                    }}
                >
                    {intl.get('dataSource.extend.apply')}
                </PrimaryButton>
                <DefaultButton onClick={() => close()}>
                    {intl.get('dataSource.extend.cancel')}
                </DefaultButton>
            </div>
        </Container>
    );
});


export default LaTiaoPreview;
