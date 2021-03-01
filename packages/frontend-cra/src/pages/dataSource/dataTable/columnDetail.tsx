import React, { useEffect, useState } from 'react';
import { BIFieldType } from '../../../global';
import { IRow } from '../../../interfaces';
import { FieldSummary, getFieldsSummaryService } from '../../../service';
import DistributionChart from './distributionMiniChart';

interface ColumnDetailProps {
    name: string;
    code: string;
    analyticType: BIFieldType;
    dataSource: IRow[];
}
// FIXME: 分布的计数字段名，弱约束风险
const COUNT_FIELD = 'count';
const SUMMARY_FIELD = 'memberName';
// TODO: summary cache
const ColumnDetail: React.FC<ColumnDetailProps> = props => {
    const { code, dataSource, name } = props;
    const [summary, setSummary] = useState<FieldSummary>({
        fieldName: '',
        distribution: [],
        entropy: 0,
        maxEntropy: 0,
        type: 'nominal'
    });

    useEffect(() => {
        getFieldsSummaryService(dataSource, [code]).then(res => {
            if (res.length > 0) {
                setSummary(res[0]);
            }
        })
    }, [code])
    return (
        <div>
            <h2>{name}</h2>
            <div>Type: {summary.type}</div>
            <DistributionChart fieldType={summary.type} dataSource={summary.distribution} x={SUMMARY_FIELD} y={COUNT_FIELD} />
        </div>
    );
}

export default ColumnDetail;
