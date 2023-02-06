import { observer } from 'mobx-react-lite';
import { MessageBar, MessageBarButton, MessageBarType } from '@fluentui/react';
import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import { IDataPrepProgressTag } from '../../../interfaces';
import { useActionModes } from '../baseActions/mainActionButton';

const AdviceContainer = styled.div`
    .row {
        margin-bottom: 2px;
        margin-top: 2px;
    }
`;

const Advice: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { measures, cleanedData, hasOriginalDimensionInData, /*groupMeanLimitCountsLog,*/ dataPrepProgressTag } = dataSourceStore;
    const { startMode } = useActionModes();

    const onForceAnalysis = () => {
        startMode.onClick && startMode.onClick();
    };

    return (
        <AdviceContainer>
            {dataPrepProgressTag === IDataPrepProgressTag.none && cleanedData.length === 0 && (
                <MessageBar className="row">{intl.get('dataSource.advice.lackData')}</MessageBar>
            )}
            {!hasOriginalDimensionInData && (
                <MessageBar className="row" isMultiline={false} messageBarType={MessageBarType.warning}>
                    {intl.get('dataSource.advice.lackDimension')}
                </MessageBar>
            )}
            {measures.length === 0 && (
                <MessageBar
                    className="row"
                    isMultiline={false}
                    actions={
                        <div>
                            <MessageBarButton onClick={onForceAnalysis}>{intl.get('dataSource.advice.forceAnalysis')}</MessageBarButton>
                        </div>
                    }
                    messageBarType={MessageBarType.blocked}
                >
                    {intl.get('dataSource.advice.lackMeasure')}
                </MessageBar>
            )}
            {/* {Math.log2(cleanedData.length) - groupMeanLimitCountsLog < Math.log2(8) && (
                <MessageBar className="row" messageBarType={MessageBarType.warning}>
                    {intl.get('dataSource.advice.smallSample')}
                </MessageBar>
            )} */}
        </AdviceContainer>
    );
};

export default observer(Advice);
