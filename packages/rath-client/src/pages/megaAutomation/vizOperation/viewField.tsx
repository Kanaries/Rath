import React from 'react';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';
import { Icon } from '@fluentui/react';

const COLORS = {
    // tableau style
    // dimension: 'rgb(73, 150, 178)',
    // measure: 'rgb(0, 177, 128)',
    // dimension: 'rgb(86, 170, 208)',
    // measure: 'rgb(232, 149, 72)',
    dimension: '#00b7c3',
    measure: '#00ad56',
    black: '#000',
    white: '#fff'
}

export const Pill = styled.div<{colType: IFieldMeta['analyticType']}>`
  background-color: ${props => props.colType === 'measure' ? COLORS.white : COLORS.black};
  border-color: ${props => props.colType === 'measure' ? COLORS.black : COLORS.white};
  color: ${props => props.colType === 'measure' ? COLORS.black : COLORS.white};
  -ms-user-select: none;
  -webkit-align-items: center;
  -webkit-user-select: none;
  align-items: center;
  /* border-radius: 10px; */
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
  .cancel-icon{
      cursor: pointer;
  }
`

interface ViewFieldProps {
    type: IFieldMeta['analyticType'];
    text: string;
    onRemove?: () => void;
}
const ViewField: React.FC<ViewFieldProps> = props => {
    return <Pill colType={props.type}>
        <Icon className="cancel-icon" iconName="Cancel" onClick={props.onRemove} />
        {/* <IconButton iconProps={{ iconName: 'Cancel', style: { fontSize: '8px' } }} /> */}
        {props.text}
    </Pill>
}

export default ViewField;
