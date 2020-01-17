import React, { useMemo } from 'react';
import { DetailsList, SelectionMode, IColumn, Icon, HoverCard, IExpandingCardProps } from 'office-ui-fabric-react';
import chroma from 'chroma-js';
import { FieldSummary } from '../../service';
import DistributionChart from './distributionChart';
import { FieldType, Record } from '../../global';

import './fieldAnalysis.css';

// todo: distribution info

interface FieldAnalsisProps {
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
  {
    key: 'maxEntropy',
    name: 'maxEntropy',
    fieldName: 'maxEntropy',
    minWidth: 120
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

function getValueColor (value: number, range: [number, number]): [number, number, number] {
  return chroma.scale('YlGnBu').domain([range[1], range[0]])(value).rgb();
}

/**
 * 
 * @param color rgb array
 * algorithm provided by https://stackoverflow.com/questions/1855884/determine-font-color-based-on-background-color
 */
function contrastColor(color: [number, number, number]): [number, number, number] {
  let luminance = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
  return luminance > 0.5 ? [0, 0, 0] : [255, 255, 255]
}
const FieldAnalsis: React.FC<FieldAnalsisProps> = (props) => {

  const { originSummary, groupedSummary } = props;

  const entropyRange = useMemo<[number, number]>(() => {
    const originEntropy = originSummary.map(s => s.maxEntropy);
    return [0, Math.max(...originEntropy)];
  }, [originSummary])

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
      let bgColor: [number, number, number] = [255, 255, 255];
      switch (column.key) {
        case 'type':
          return <div>
            <Icon iconName={getIconNameByFieldType(fieldContent)} /> {fieldContent}
          </div>
        case 'entropy':
        case 'maxEntropy':
          bgColor = getValueColor(item[column.key], entropyRange);
          let bgColorStr = `rgb(${bgColor.join(',')})`
          let fontColorStr = `rgb(${contrastColor(bgColor).join(',')})`
          return (
            <HoverCard expandedCardOpenDelay={800} expandingCardProps={expandingCardProps} instantOpenOnClick={true}>
              <div style={{ boxShadow: `${bgColorStr} 0px 0px 0px 10px`, backgroundColor: bgColorStr, color: fontColorStr }}>{fieldContent}</div>
            </HoverCard>
          )
        default:
          return <HoverCard expandedCardOpenDelay={800} expandingCardProps={expandingCardProps} instantOpenOnClick={true}>
          <div>{fieldContent}</div>
        </HoverCard>
      }
    }
  }

  // const onRenderRow: IRenderFunction<any> = (props) => {
  //   const customStyles: Partial<IDetailsRowStyles> = {};
  //   customStyles.root = { backgroundColor: getValueColor(props.item['entropy'], entropyRange), color: '#fff' }
  //   return <DetailsRow {...props} styles={customStyles} />;
  // };

  return <DetailsList compact={true} columns={columns} items={originSummary} selectionMode={SelectionMode.none} onRenderItemColumn={renderItemColumn} />
}

export default FieldAnalsis;