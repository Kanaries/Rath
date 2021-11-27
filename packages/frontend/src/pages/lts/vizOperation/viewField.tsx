import { IconButton } from 'office-ui-fabric-react';
import React from 'react';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';

const COLORS = {
    // tableau style
    // dimension: 'rgb(73, 150, 178)',
    // measure: 'rgb(0, 177, 128)',
    dimension: 'rgb(86, 170, 208)',
    measure: 'rgb(232, 149, 72)'
}

const FieldContainer = styled.div<{ type: IFieldMeta['analyticType'] }>`
    display: inline-block;
    margin: 2px;
    padding: 2px 12px 2px 2px;
    font-size: 14px;
    border-radius: 2px;
    color: #fff;
    background-color: ${props => props.type === 'dimension' ? COLORS.dimension : COLORS.measure};
`

export const Pill = styled.div<{colType: IFieldMeta['analyticType']}>`
  background-color: ${props => props.colType === 'measure' ? COLORS.measure : COLORS.dimension};
  color: #fff;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-align-items: center;
  -webkit-user-select: none;
  align-items: center;
  border-color: transparent;
  border-radius: 10px;
  border-style: solid;
  border-width: 1px;
  box-sizing: border-box;
  cursor: default;
  display: -webkit-flex;
  display: flex;
  font-size: 12px;
  height: 20px;
  min-width: 150px;
  overflow-y: hidden;
  padding: 0 10px;
  user-select: none;
  margin-right: 4px;
`

interface ViewFieldProps {
    type: IFieldMeta['analyticType'];
    text: string;
}
const ViewField: React.FC<ViewFieldProps> = props => {
    return <Pill colType={props.type}>
        
        {/* <IconButton iconProps={{ iconName: 'Cancel', style: { fontSize: '8px' } }} /> */}
        {props.text}
    </Pill>
}

export default ViewField;
