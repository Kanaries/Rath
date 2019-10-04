import React, { useMemo } from 'react';
import { DetailsList, SelectionMode, IColumn, Icon, IDetailsRowProps, IDetailsRowStyles, DetailsRow, IRenderFunction } from 'office-ui-fabric-react';
import chroma, { Color } from 'chroma-js';
import { FieldSummary } from '../../service';
import DistributionChart from './distributionChart';
import { FieldType } from '../../global';

// todo: distribution info
interface Impurity {
  name: string;
  value: number
}
export interface FieldDescription {
  name: string;
  type: string;
  impurity: Impurity[]
}
interface FieldAnalsisProps {
  fields: FieldDescription[];
  originSummary: FieldSummary[];
  groupedSummary: FieldSummary[];
}
const columns: IColumn[] = [
  {
    key: 'fieldName',
    name: 'fieldName',
    fieldName: 'fieldName',
    minWidth: 70,
    maxWidth: 150
  },
  {
    key: 'type',
    name: 'type',
    fieldName: 'type',
    minWidth: 70
  },
  {
    key: 'entropy',
    name: 'entropy',
    fieldName: 'entropy',
    minWidth: 70
  },
  {
    key: 'maxEntropy',
    name: 'maxEntropy',
    fieldName: 'maxEntropy',
    minWidth: 70
  },
  {
    key: 'distribution',
    name: 'distribution',
    fieldName: 'distribution',
    minWidth: 300
  }
];
function getIconNameByFieldType (type: string): string {
  switch (type) {
    case 'nominal':
      return 'TextField';
    case 'quantitative':
      return 'NumberField';
    case 'ordinal':
      return 'Breadcrumb';
    case 'temporal':
      return 'EventDate';
    default:
      return ''
  }
}

function getValueColor (value: number, range: [number, number]): string {
  return chroma.scale('YlGnBu').domain([range[1], range[0]])(value).hex()
}
const FieldAnalsis: React.FC<FieldAnalsisProps> = (props) => {
  const { fields, originSummary, groupedSummary } = props;
  const entropyRange = useMemo<[number, number]>(() => {
    const originEntropy = originSummary.map(s => s.entropy);
    const groupedEntropy = groupedSummary.map(s => s.entropy);
    const entropyList = originEntropy.concat(groupedEntropy);
    return [Math.min(...entropyList), Math.max(...entropyList)];
  }, [originSummary, groupedSummary])
  const renderItemColumn = (item: {[key: string]: any}, index?: number, column?: IColumn) => {
    if (column !== undefined) {
      const fieldContent = item[column.fieldName!];
      switch (column.key) {
        case 'type':
          return <span>
            <Icon iconName={getIconNameByFieldType(fieldContent)} /> {fieldContent}
          </span>
        case 'distribution':
          return <DistributionChart x="memberName" y="count" fieldType={item.type as FieldType} dataSource={fieldContent} />
        // case 'entropy':
        // case 'max_entropy':
        //   return <div style={{ backgroundColor: getValueColor(fieldContent, impurityRange[column.name])}}>{fieldContent}</div>
        default:
          return <span>{fieldContent}</span>
      }
    }
  }
  const onRenderRow: IRenderFunction<any> = (props) => {
    const customStyles: Partial<IDetailsRowStyles> = {};
    customStyles.root = { backgroundColor: getValueColor(props.item['entropy'], entropyRange), color: '#fff' }
    return <DetailsRow {...props} styles={customStyles} />;
  };
  return <div>
    <DetailsList compact={true} columns={columns} items={originSummary} selectionMode={SelectionMode.none} onRenderRow={onRenderRow} onRenderItemColumn={renderItemColumn} />
  </div>
}

export default FieldAnalsis;