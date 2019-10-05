import React, { useMemo } from 'react';
import { DetailsList, SelectionMode, IColumn, Icon, IDetailsRowProps, IDetailsRowStyles, DetailsRow, IRenderFunction, HoverCard, IExpandingCardProps } from 'office-ui-fabric-react';
import chroma, { Color } from 'chroma-js';
import { FieldSummary } from '../../service';
import DistributionChart from './distributionChart';
import { FieldType, Record } from '../../global';

import './fieldAnalysis.css';

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
    minWidth: 50
  },
  {
    key: 'entropy',
    name: 'entropy',
    fieldName: 'entropy',
    minWidth: 120
  },
  // {
  //   key: 'entropy(group)',
  //   name: 'entropy(group)',
  //   fieldName: 'entropy',
  //   minWidth: 70
  // },
  {
    key: 'maxEntropy',
    name: 'maxEntropy',
    fieldName: 'maxEntropy',
    minWidth: 120
  },
  // {
  //   key: 'distribution',
  //   name: 'distribution',
  //   fieldName: 'distribution',
  //   minWidth: 300
  // },
  // {
  //   key: 'groupedDistribution',
  //   name: 'groupedDistribution',
  //   minWidth: 300
  // }
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

  const onRenderCompactCard = (item: Record) => {
    return (
      <div className="field-hover-card">
        <h2>{item.fieldName}</h2>
        <div>Field entropy is { Number(item.entropy).toFixed(2) }</div>
        <div className="chart-vertical-margin-container" >
          <DistributionChart x="memberName" y="count" fieldType={item.type as FieldType} dataSource={item.distribution} />
        </div>
        
      </div>
    )
  }
  const onRenderExpandedCard = (item: Record) => {
    const name = item.fieldName;
    const target = groupedSummary.find(s => s.fieldName === name + '(group)')
    return (
      <div className="field-hover-card">
        {
          target ? <div>
            <h3>{target.fieldName}</h3>
            <div>Field entropy is { Number(target.entropy).toFixed(2) }</div>
            <div className="chart-vertical-margin-container">
              <DistributionChart x="memberName" y="count" fieldType={target.type as FieldType} dataSource={target.distribution} />
            </div>
          </div> : <div>This field is not grouped.</div>
        }
      </div>
    )
  }



  const renderItemColumn = (item: Record, index?: number, column?: IColumn) => {
    if (column !== undefined) {
      const name = item.fieldName;
      const target = groupedSummary.find(s => s.fieldName === name + '(group)')
      const expandingCardProps: IExpandingCardProps = {
        onRenderCompactCard,
        onRenderExpandedCard,
        renderData: item,
        compactCardHeight: 320,
        expandedCardHeight: target ? 320 : 40
      }
      const fieldContent = item[column.fieldName!];
      switch (column.key) {
        case 'type':
          return <span>
            <Icon iconName={getIconNameByFieldType(fieldContent)} /> {fieldContent}
          </span>
        default:
          return <HoverCard expandedCardOpenDelay={800} expandingCardProps={expandingCardProps} instantOpenOnClick={true}>
          <div>{fieldContent}</div>
        </HoverCard>
      }
    }
  }

  const onRenderRow: IRenderFunction<any> = (props) => {
    const customStyles: Partial<IDetailsRowStyles> = {};
    customStyles.root = { backgroundColor: getValueColor(props.item['entropy'], entropyRange), color: '#fff' }
    return <DetailsRow {...props} styles={customStyles} />;
  };

  return <div>
    <h2 style={{fontWeight: 400, marginBottom: 0}}>Univariate Summary</h2>
    <DetailsList compact={true} columns={columns} items={originSummary} selectionMode={SelectionMode.none} onRenderRow={onRenderRow} onRenderItemColumn={renderItemColumn} />
  </div>
}

export default FieldAnalsis;