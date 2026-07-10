import { observer } from 'mobx-react-lite';
import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import { IDataPrepProgressTag } from '../../../interfaces';
import { useActionModes } from '../baseActions/mainActionButton';
import { RathIcon } from '../../../components/icons';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';

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
                <Alert className="row" variant="info" role="status">
                    <RathIcon name="Info" className="shrink-0 text-message-icon" />
                    <AlertDescription>{intl.get('dataSource.advice.lackData')}</AlertDescription>
                </Alert>
            )}
            {!hasOriginalDimensionInData && (
                <Alert className="row" variant="warning" role="status">
                    <RathIcon name="Info" className="shrink-0 text-message-icon" />
                    <AlertDescription>{intl.get('dataSource.advice.lackDimension')}</AlertDescription>
                </Alert>
            )}
            {measures.length === 0 && (
                <Alert className="row" variant="blocked">
                    <RathIcon name="Blocked2" className="shrink-0 text-message-blocked-icon" />
                    <AlertDescription>{intl.get('dataSource.advice.lackMeasure')}</AlertDescription>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto min-w-40 shrink-0 bg-background/80 px-6 text-foreground"
                        onClick={onForceAnalysis}
                    >
                        {intl.get('dataSource.advice.forceAnalysis')}
                    </Button>
                </Alert>
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
