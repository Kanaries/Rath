import React, { useMemo } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import DistributionMiniChart from './distributionMiniChart';
import { FieldSummary } from '../../../service';
import { DropdownSelect } from '@tableau/tableau-ui'
import { BIFieldType, FieldType } from '../../../global';

const HeaderCellContainer = styled.div`
    .bottom-bar {
        position: absolute;
        height: 4px;
        border-radius: 0px 0px 2px 2px;
        left: 0px;
        right: 0px;
        top: 0px;
        margin: 0px 1px;
    }
    .dim {
        background-color: #1890ff;
    }
    .mea {
        background-color: #13c2c2;
    }
    .header{
        margin-top: 0px;
        margin-bottom: 0px;
    }
`;

interface HeaderCellProps {
    name: string;
    code: string;
    type: 'dimension' | 'measure';
    onChangeBIType?: (type: BIFieldType, fieldKey: string) => void;
    summary: FieldSummary | null;
}

interface IOption<T = string> { key: T; text: string };

const DataTypeOptions: IOption<FieldType>[] = [
    { key: 'nominal', text: 'nominal' },
    { key: 'ordinal', text: 'ordinal' },
    { key: 'quantitative', text: 'quantitative' },
    { key: 'temporal', text: 'temporal' }
]

function useBIFieldTypeOptions (): IOption<BIFieldType>[] {
    const dimensionLabel = intl.get('meta.dimension');
    const measureLabel = intl.get('meta.measure');
    const options = useMemo<IOption<BIFieldType>[]>(() => {
        return [
            { key: 'dimension', text: dimensionLabel },
            { key: 'measure', text: measureLabel }
        ]
    }, [dimensionLabel, measureLabel]);
    return options;
}

const HeaderCell: React.FC<HeaderCellProps> = props => {
    const { name, code, type, summary, onChangeBIType } = props;
    const optionsOfBIFieldType = useBIFieldTypeOptions();
    return (
        <HeaderCellContainer>
            <h3 className="header">{name}</h3>
            {summary && (
                <DropdownSelect aria-readonly kind="text" disabled={true} defaultValue={summary.type}>
                    {DataTypeOptions.map((op) => (
                        <option key={op.key} value={op.key}>
                            {op.text}
                        </option>
                    ))}
                </DropdownSelect>
            )}
            {
                <DropdownSelect kind="text" value={type} onChange={(e) => {
                    if (onChangeBIType) {
                        onChangeBIType(e.target.value as BIFieldType, code);
                    }
                }}>
                    {
                        optionsOfBIFieldType.map(op => <option key={op.key} value={op.key}>{op.text}</option>)
                    }
                </DropdownSelect>
            }
            {summary && <DistributionMiniChart dataSource={summary.distribution} x="memberName" y="count" fieldType={summary.type} />}
            <div className={`bottom-bar ${type === "dimension" ? "dim" : "mea"}`}></div>
        </HeaderCellContainer>
    );
}

export default HeaderCell;
