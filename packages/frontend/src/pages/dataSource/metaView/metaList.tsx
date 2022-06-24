import { ChoiceGroup, DefaultButton, IChoiceGroupOption, Separator, Toggle } from 'office-ui-fabric-react';
import React from 'react';
import styled from 'styled-components';
import { IAnalyticType, ISemanticType } from 'visual-insights';
import { IFieldMeta, IRawField, IRow } from '../../../interfaces';
import DistributionChart from './distChart';
import intl from 'react-intl-universal'
import FieldFilter from '../../../components/fieldFilter';

const MetaContainer = styled.div`
    overflow: auto;
`
const MetaItemContainer = styled.div`
    over-flow: hidden;
    position: relative;
    color: #333;
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
    h1{
        font-weight: 500;
        font-size: 26px;
        color: #333;
    }
    .fid{
        font-size: 12px; font-weight: 400; color: rgb(89, 89, 89);
    }
    padding: 1em;
    margin: 1em;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    border-radius: 8px;
    .flex-container {
        display: flex;
    }
    .operation-column{
        margin-left: 1em;
        padding: 0em 1em;
        border-left: 1px solid rgb(229, 231, 235)
    }
    .dist-graphics{
        flex-grow: 0;
    }
`

const IndicatorCard = styled.div`
    padding: 0em 1em;
    margin-left: 1em;
    .ind-title{
        font-family: "Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: rgb(50, 49, 48);
        box-sizing: border-box;
    }
    .ind-value{
        font-size: 3em;
        font-weight: 500;
    }
`

interface MetaItemProps {
    colKey: string;
    colName: string;
    semanticType: ISemanticType;
    analyticType: IAnalyticType;
    dist: IRow[];
    disable?: boolean;
    onChange?: (fid: string, propKey: keyof IRawField, value: any) => void
}

const SEMANTIC_TYPE_CHOICES: IChoiceGroupOption[] = [
    { key: 'nominal', text: 'nominal' },
    { key: 'ordinal', text: 'ordinal' },
    { key: 'temporal', text: 'temporal' },
    { key: 'quantitative', text: 'quantitative' },
]

const ANALYTIC_TYPE_CHOICES: IChoiceGroupOption[] = [
    { key: 'dimension', text: 'dimension' },
    { key: 'measure', text: 'measure' },
]
const MetaItem: React.FC<MetaItemProps> = props => {
    const { colKey, colName, semanticType, analyticType, dist, disable, onChange } = props;
    const ANALYTIC_TYPE_CHOICES_LANG: IChoiceGroupOption[] = ANALYTIC_TYPE_CHOICES.map(ch => ({
        ...ch,
        text: intl.get(`common.${ch.key}`)
    }))
    
    return <MetaItemContainer className="ms-depth-4">
        <div className={`${analyticType} bottom-bar`}></div>
        <h1>{colName}</h1>
        <div className="fid">Column ID: {colKey}</div>
        <Separator />
        <div className="flex-container">
            <DistributionChart
                dataSource={dist}
                x="memberName"
                y="count"
                analyticType={analyticType}
                semanticType={semanticType} />
            <IndicatorCard>
                <div className="ind-title ms-Label root-130">{intl.get('dataSource.meta.uniqueValue')}</div>
                <div className="ind-value">{dist.length}</div>
            </IndicatorCard>
            <div className="operation-column">
                <ChoiceGroup
                    label={intl.get('dataSource.meta.analyticType')}
                    options={ANALYTIC_TYPE_CHOICES_LANG}
                    selectedKey={analyticType}
                    onChange={(ev, option) => {
                        onChange && option && onChange(colKey, 'analyticType', option.key)
                    }}
                />
            </div>
            <div className="operation-column">
                <ChoiceGroup
                    label={intl.get('dataSource.meta.semanticType')}
                    options={SEMANTIC_TYPE_CHOICES}
                    selectedKey={semanticType}
                    onChange={(ev, option) => {
                        onChange && option && onChange(colKey, 'semanticType', option.key)
                    }}
                />
            </div>
            <div className="operation-column">
                <Toggle
                    label={intl.get('dataSource.meta.disable.title')}
                    checked={!disable}
                    onText={intl.get('dataSource.meta.disable.on')}
                    offText={intl.get('dataSource.meta.disable.off')}
                    onChange={(ev, checked) => {
                        onChange && onChange(colKey, 'disable', !checked)
                    }}
                />
            </div>
            <div className="operation-column">
                <FieldFilter fid={colKey} />
            </div>
        </div>
    </MetaItemContainer>
}

interface MetaListProps {
    metas: IFieldMeta[];
    onChange?: (fid: string, propKey: keyof IRawField, value: any) => void
}
const MetaList: React.FC<MetaListProps> = props => {
    const { metas, onChange } = props;
    return <MetaContainer>
        {
            metas.map(m => <MetaItem
                key={m.fid}
                colKey={m.fid}
                colName={`${m.name}`}
                semanticType={m.semanticType}
                analyticType={m.analyticType}
                dist={m.distribution}
                disable={m.disable}
                onChange={onChange}
            />)
        }
    </MetaContainer>
}

export default MetaList;