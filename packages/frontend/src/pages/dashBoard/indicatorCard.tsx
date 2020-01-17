import React, { useMemo } from "react";
import styled from "styled-components";
import { DataSource } from "../../global";
import datalib from "datalib";

function numberWithCommas(x: number): string {
  let parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

const Card = styled.div`
  display: inline-block;
  padding: 1rem;
  border: 1px solid #f5f5f5;
  margin: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
  'Segoe UI Emoji', 'Segoe UI Symbol';
  .indicator-card.header {
    color: #8c8c8c;
    margin-top: 0px;
    margin-bottom: 0px;
    font-size: 20px;
    line-height: 28px;
    font-weight: 400;
  }
  .indicator-card.content {
    color: #0078d4;
    font-size: 56px;
    line-height: 64px;
    font-weight: 400;
    margin: 0px;
  }
`;
interface IndicatorProps {
  dataSource: DataSource;
  measures: string[];
  operator?: 'sum' | 'mean' | 'max' | 'min';
}
const IndicatorCard: React.FC<IndicatorProps> = props => {
  const { dataSource = [], measures = [], operator = 'sum' } = props;
  const value = useMemo(() => {
    if (measures.length === 0 || dataSource.length === 0) {
      return '-'
    }
    let ans = 0;
    try {
      ans = datalib[operator](dataSource.map(d => d[measures[0]]));
    } catch (error) {
      console.log('operator does not exist or not in vega/datalib.')
    }
    if (Math.abs(ans - Math.round(ans)) > 0.00001) {
      ans = Number(ans.toFixed(2));
    }
    return numberWithCommas(ans);
  }, [dataSource, measures, operator]);

  return (
    <Card>
      <h4 className="indicator-card header">{measures[0]} {operator && `(${operator})`}</h4>
      <h1 className="indicator-card content">{ value }</h1>
    </Card>
  );
};

export default IndicatorCard;
