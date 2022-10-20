import { Stack } from '@fluentui/react';
import { applyFilters, IFilter, IRow } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { debounce } from 'vega';
import { IFieldMeta } from '../../../interfaces';
import { computeFieldFeatures } from '../../../lib/meta/fieldMeta';
import { useGlobalStore } from '../../../store';
import DetailTable from './detailTable';
import FullDistViz from './fullDistViz';
import StatTable from './statTable';

const DetailContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    padding: 1em;
    .detail-header {
        font-size: 1.5em;
        font-weight: 500;
    }
    .detail-content {
        color: #666;
        font-size: 12px;
    }
`;

interface MetaDetailProps {
    field?: IFieldMeta;
}
const MetaDetail: React.FC<MetaDetailProps> = (props) => {
    const { field } = props;
    const [selection, setSelection] = React.useState<any[]>([]);
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData } = dataSourceStore;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onSelectionChange = useCallback(debounce(200, setSelection), [])

    useEffect(() => {
        setSelection([])
    }, [field])

    const filters = useMemo<IFilter[]>(() => {
        const ans: IFilter[] = [];
        if (!field) return ans;
        if (selection.length === 0) return ans;
        if (field.semanticType === 'quantitative') {
            const _min = field.features.min;
            const _max = field.features.max;
            const step = (_max - _min) / 10;
            ans.push({
                fid: field.fid,
                type: 'range',
                range: [Math.min(...selection) - step / 2, Math.max(...selection) + step / 2],
            });
        } else {
            ans.push({
                fid: field.fid,
                type: 'set',
                values: selection,
            });
        }
        return ans;
    }, [field, selection]);

    const filteredData = useMemo<IRow[]>(() => {
        return applyFilters(cleanedData, filters);
    }, [cleanedData, filters]);

    const features = useMemo<IFieldMeta['features']>(() => {
        if (!field) return {} as IFieldMeta['features'];
        if (filters.length === 0) return field.features;
        const { features } = computeFieldFeatures(filteredData.map(r => r[field.fid]), field.semanticType);
        return features
    }, [field, filteredData, filters]);
    if (typeof field === 'undefined') return <div></div>;
    return (
        <DetailContainer>
            <h1 className="detail-header">{field.name}</h1>
            <p className="detail-content">Column ID: {field.fid}</p>
            <FullDistViz
                dataSource={field.distribution}
                x="memberName"
                y="count"
                height={200}
                width={620}
                maxItemInView={1000}
                analyticType={field.analyticType}
                semanticType={field.semanticType}
                onSelect={onSelectionChange}
            />
            <Stack horizontal tokens={{ childrenGap: '3em' }}>
            <StatTable title='origin' features={field.features} semanticType={field.semanticType} />
                { filters.length > 0 && <StatTable title='selection' features={features} semanticType={field.semanticType} />}
            </Stack>
            {
                filters.length > 0 && <DetailTable data={filteredData} />
            }
        </DetailContainer>
    );
};

export default observer(MetaDetail);
