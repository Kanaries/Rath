import React from 'react';
import styled from 'styled-components';
import { Icon } from '@fluentui/react';
import { IFieldMeta } from '../../../interfaces';

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

export function getSemanticTypeTextColor(colType: IFieldMeta['semanticType']) {
    switch (colType) {
        case 'nominal':
            return '#5b21b6';
        case 'ordinal':
            return '#075985';
        case 'quantitative':
            return '#166534';
        case 'temporal':
            return '#92400e';
        default:
            return '#5b21b6';
    }
}

export function getSemanticTypeBackgroundColor(colType: IFieldMeta['semanticType']) {
    switch (colType) {
        case 'nominal':
            return '#ede9fe';
        case 'ordinal':
            return '#e0f2fe';
        case 'quantitative':
            return '#dcfce7';
        case 'temporal':
            return '#ffedd5';
        default:
            return '#ede9fe';
    }
}

export function getSemanticTypeBorderColor(colType: IFieldMeta['semanticType']) {
    switch (colType) {
        case 'nominal':
            return '#c4b5fd';
        case 'ordinal':
            return '#7dd3fc';
        case 'quantitative':
            return '#86efac';
        case 'temporal':
            return '#fcd34d';
        default:
            return '#c4b5fd';
    }
}


export const Pill = styled.div<{colType: IFieldMeta['semanticType'], mode: 'real' | 'wildcard'}>`
  background-color: ${props => getSemanticTypeBackgroundColor(props.colType)};
  border-color: ${props => getSemanticTypeBorderColor(props.colType)};
  color: ${props => getSemanticTypeTextColor(props.colType)};
  border-style: ${props => props.mode === 'real' ? 'solid' : 'dashed'};
  opacity: ${props => props.mode === 'real' ? 1 : 0.5};
  -ms-user-select: none;
  -webkit-align-items: center;
  -webkit-user-select: none;
  align-items: center;
  /* border-radius: 10px; */
  border-radius: 10px;
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
  margin-bottom: 4px;
  .cancel-icon{
      cursor: pointer;
  }
`

export const PillPlaceholder = styled.div`
    color: ${COLORS.black};
    -ms-user-select: none;
    -webkit-align-items: center;
    -webkit-user-select: none;
    align-items: center;
    /* border-radius: 10px; */
    border-style: dashed;
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
    margin-bottom: 4px;
    justify-content: center;
    .cancel-icon{
        cursor: pointer;
    }
`

interface ViewFieldProps {
    analyticType: IFieldMeta['analyticType'];
    semanticType: IFieldMeta['semanticType'];
    text: string;
    mode?: 'real' | 'wildcard';
    onRemove?: () => void;
    onDoubleClick?: () => void;
}
const ViewField: React.FC<ViewFieldProps> = props => {
    const { onRemove, text, mode = 'real', semanticType, onDoubleClick } = props;
    return <Pill mode={mode} colType={semanticType} onDoubleClick={onDoubleClick}>
        {onRemove && <Icon className="cancel-icon" iconName="Cancel" onClick={onRemove} />}
        {/* <IconButton iconProps={{ iconName: 'Cancel', style: { fontSize: '8px' } }} /> */}
        {text}
    </Pill>
}

export default ViewField;
