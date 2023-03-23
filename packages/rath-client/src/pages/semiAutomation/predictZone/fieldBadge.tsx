import styled from 'styled-components';
import { IFieldMeta } from 'visual-insights';
import { getSemanticTypeBackgroundColor, getSemanticTypeTextColor } from '../../megaAutomation/vizOperation/viewField';

export const FieldBadge = styled.div<{semanticType: IFieldMeta['semanticType']}>`
    background-color: ${props => getSemanticTypeBackgroundColor(props.semanticType)};
    color: ${props => getSemanticTypeTextColor(props.semanticType)};
    border-radius: 40px;
    padding: 1px 12px;
    margin: 2px 2px;
    font-size: 12px;
    font-weight: 500;
    display: inline-block;
`