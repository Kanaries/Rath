import React, { useCallback, useMemo } from 'react';
import intl from 'react-intl-universal';
import { Icon, HoverCard, IExpandingCardProps } from 'office-ui-fabric-react';
import chroma from 'chroma-js';
import { FieldSummary } from '../../service';
import DistributionChart from './distributionChart';
import { BaseTable, ArtColumn } from 'ali-react-table';
import styled from 'styled-components';

import './fieldAnalysis.css';
import { IRow } from '../../interfaces';
import { ISemanticType } from 'visual-insights';

// todo: distribution info

const CustomBaseTable = styled(BaseTable)`
    --header-bgcolor: #fafafa;
    --bgcolor: rgba(0, 0, 0, 0);
    --header-row-height: 48px;
`;

interface FieldAnalsisProps {
  originSummary: FieldSummary[];
  groupedSummary: FieldSummary[];
}

const baseColumns: ArtColumn[] = [
  {
    code: 'fieldName',
    name: 'fieldName',
  },
  {
    code: 'type',
    name: 'type',
    width: 160,
  },
  {
    code: 'entropy',
    name: 'entropy',
    width: 220,
    align: 'right'
  },
  {
    code: 'maxEntropy',
    name: 'maxEntropy',
    width: 220,
    align: 'right'
  },
]

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

  const onRenderCompactCard = useCallback((item: IRow) => {
      return (
          <div className="field-hover-card">
              <h2>{item.fieldName}</h2>
              <div>Field entropy is {Number(item.entropy).toFixed(2)}</div>
              <div className="chart-vertical-margin-container">
                  <DistributionChart x="memberName" y="count" fieldType={item.type as ISemanticType} dataSource={item.distribution} />
              </div>
          </div>
      );
  }, []);
  const onRenderExpandedCard = useCallback((item: IRow) => {
      const name = item.fieldName;
      const target = groupedSummary.find((s) => s.fieldName === name + "(group)");
      return (
          <div className="field-hover-card">
              {target ? (
                  <div>
                      <h3>{target.fieldName}</h3>
                      <div>Field entropy is {Number(target.entropy).toFixed(2)}</div>
                      <div className="chart-vertical-margin-container">
                          <DistributionChart
                              x="memberName"
                              y="count"
                              fieldType={target.type as ISemanticType}
                              dataSource={target.distribution}
                          />
                      </div>
                  </div>
              ) : (
                  <div>This field is not grouped.</div>
              )}
          </div>
      );
  }, [groupedSummary]);

  const columns = useMemo<ArtColumn[]>(() => {
    return baseColumns.map((col) => {
        const nextCol: ArtColumn = {
            ...col,
            name: intl.get(`noteBook.univariate.columns.${col.code}`),
            render(value: any, record: IRow, rowIndex?: number) {
                const name = record.fieldName;
                const target = groupedSummary.find((s) => s.fieldName === name + "(group)");
                const expandingCardProps: IExpandingCardProps = {
                    onRenderCompactCard,
                    onRenderExpandedCard,
                    renderData: record,
                    compactCardHeight: 320,
                    expandedCardHeight: target ? 320 : 40,
                };
                const fieldContent = record[col.code!];
                switch (col.code) {
                    case "type":
                        return (
                            <div>
                                <Icon iconName={getIconNameByFieldType(fieldContent)} /> {fieldContent}
                            </div>
                        );
                    case "entropy":
                    case "maxEntropy":
                    default:
                        return (
                            <HoverCard expandedCardOpenDelay={800} expandingCardProps={expandingCardProps} instantOpenOnClick={true}>
                                <div>{fieldContent}</div>
                            </HoverCard>
                        );
                }
            },
        };
        if (col.code === 'entropy' || col.code === 'maxEntropy') {
          nextCol.getCellProps = function (value: any, record: IRow, rowIndex?: number) {
            const bgColor = getValueColor(value, entropyRange);
            let bgColorStr = `rgb(${bgColor.join(",")})`;
            let fontColorStr = `rgb(${contrastColor(bgColor).join(",")})`;
            return {
              style: {
                backgroundColor: bgColorStr,
                color: fontColorStr
              }
            }
          }
        }
        return nextCol;
    });
  }, [entropyRange, groupedSummary, onRenderExpandedCard, onRenderCompactCard])

  return <CustomBaseTable dataSource={originSummary} columns={columns} style={{ height: "600px" }} />;
}

export default FieldAnalsis;