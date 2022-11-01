import { DefaultButton, Dropdown, IDropdownOption, Stack } from '@fluentui/react';
import { applyFilters, IFilter, IRow } from '@kanaries/loa';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { debounce } from 'vega';
import { PIVOT_KEYS } from '../../../constants';
import { IFieldMeta } from '../../../interfaces';
import { computeFieldFeatures } from '../../../lib/meta/fieldMeta';
import { useGlobalStore } from '../../../store';
import FieldFilter from '../../../components/fieldFilter';
import { ANALYTIC_TYPE_CHOICES, SEMANTIC_TYPE_CHOICES } from '../config';
import DetailTable from './detailTable';
import FullDistViz from './fullDistViz';
import StatTable from './statTable';
import { patchFilterTemporalRange } from './utils';

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
    position: relative;
    .bottom-bar {
        position: absolute;
        height: 4px;
        border-radius: 0px 0px 2px 2px;
        left: 0px;
        right: 0px;
        top: 0px;
        margin: 0px 1px;
    }
    .dimension {
        background-color: #1890ff;
    }
    .measure {
        background-color: #13c2c2;
    }
    .disable {
        background-color: #9e9e9e;
    }
`;

interface MetaDetailProps {
    field?: IFieldMeta;
}
const MetaDetail: React.FC<MetaDetailProps> = (props) => {
    const { field } = props;
    const [selection, setSelection] = React.useState<any[]>([]);
    const { dataSourceStore, commonStore, semiAutoStore } = useGlobalStore();
    const { cleanedData } = dataSourceStore;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onSelectionChange = useCallback(debounce(200, setSelection), []);

    useEffect(() => {
        setSelection([]);
    }, [field]);

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
        } else if (field.semanticType === 'temporal') {
            ans.push({
                fid: field.fid,
                type: 'range',
                range: [Math.min(...selection), Math.max(...selection)],
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
        if (!field) return [];
        if (field.semanticType === 'temporal') return patchFilterTemporalRange(cleanedData, filters);
        return applyFilters(cleanedData, filters);
    }, [cleanedData, filters, field]);

    const features = useMemo<IFieldMeta['features']>(() => {
        if (!field) return {} as IFieldMeta['features'];
        if (filters.length === 0) return field.features;
        const { features } = computeFieldFeatures(
            filteredData.map((r) => r[field.fid]),
            field.semanticType
        );
        return features;
    }, [field, filteredData, filters]);

    const ANALYTIC_TYPE_CHOICES_LANG: IDropdownOption[] = ANALYTIC_TYPE_CHOICES.map((ch) => ({
        ...ch,
        text: intl.get(`common.${ch.key}`),
    }));

    const SEMANTIC_TYPE_CHOICES_LANG: IDropdownOption[] = SEMANTIC_TYPE_CHOICES.map((ch) => ({
        ...ch,
        text: intl.get(`common.semanticType.${ch.key}`),
    }));
    if (typeof field === 'undefined') return <div></div>;
    return (
        <DetailContainer>
            <div className={`${field.analyticType} bottom-bar`}></div>
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
            <Stack horizontal tokens={{ childrenGap: 10 }} style={{ marginTop: '1em' }} verticalAlign="center">
                <DefaultButton
                    text={intl.get('dataSource.statViewInfo.explore')}
                    iconProps={{ iconName: 'Lightbulb' }}
                    onClick={() => {
                        runInAction(() => {
                            commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                            semiAutoStore.clearMainView();
                            semiAutoStore.updateMainView({
                                fields: [field],
                                imp: field.features.entropy,
                            });
                        });
                    }}
                />
                <Dropdown
                    options={ANALYTIC_TYPE_CHOICES_LANG}
                    selectedKey={field.analyticType}
                    onChange={(ev, option) => {
                        option && dataSourceStore.updateFieldInfo(field.fid, 'analyticType', option.key);
                    }}
                />
                <Dropdown
                    options={SEMANTIC_TYPE_CHOICES_LANG}
                    selectedKey={field.semanticType}
                    onChange={(ev, option) => {
                        option && dataSourceStore.updateFieldInfo(field.fid, 'semanticType', option.key);
                    }}
                />
                <FieldFilter fid={field.fid} />
            </Stack>
            <hr style={{ margin: '1em' }} />
            <Stack horizontal tokens={{ childrenGap: '3em' }}>
                <StatTable
                    title={intl.get('dataSource.statViewInfo.originStatTable')}
                    features={field.features}
                    semanticType={field.semanticType}
                />
                {filters.length > 0 && (
                    <StatTable
                        title={intl.get('dataSource.statViewInfo.selectionStatTable')}
                        features={features}
                        semanticType={field.semanticType}
                    />
                )}
            </Stack>
            {filters.length > 0 && <DetailTable data={filteredData} />}
        </DetailContainer>
    );
};

export default observer(MetaDetail);
