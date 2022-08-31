import React from "react";
import styled from "styled-components";
import { COLORS } from "../config";

export const AestheticSegment = styled.div`
  border: 1px solid #dfe3e8;
  font-size: 12px;
  margin: 0.2em;

  .aes-header{
    border-bottom: 1px solid #dfe3e8;
    padding: 0.6em;
    h4 {
      font-weight: 400;
    }
  }
  .aes-container{

  }

`

export const FieldListContainer: React.FC<{ name: string }> = (props) => {
  return (
    <FieldListSegment>
      <div className="fl-header">
        <h4>{props.name}</h4>
      </div>
      <div className="fl-container">{props.children}</div>
    </FieldListSegment>
  );
};

export const AestheticFieldContainer: React.FC<{ name: string }> = props => {
  return (
    <AestheticSegment>
      <div className="aes-header">
        <h4>{props.name}</h4>
      </div>
      <div className="aes-container">{props.children}</div>
    </AestheticSegment>
  );
}

export const FieldsContainer = styled.div`
  display: flex;
  padding: 0.2em;
  min-height: 2.4em;
  flex-wrap: wrap;
  >div{
    margin: 1px;
  }
`;

export const FieldListSegment = styled.div`
  display: flex;
  border: 1px solid #dfe3e8;
  margin: 0.2em;
  font-size: 12px;
  div.fl-header {
    /* flex-basis: 100px; */
    width: 100px;
    border-right: 1px solid #dfe3e8;
    flex-shrink: 0;
    h4 {
      margin: 0.6em;
      font-weight: 400;
    }
  }
  div.fl-container {
    flex-grow: 10;
    /* display: flex;
    flex-wrap: wrap; */
    /* overflow-x: auto;
    overflow-y: hidden; */
  }
`;

export const Pill = styled.div<{colType: 'discrete' | 'continuous'}>`
  background-color: ${props => props.colType === 'continuous' ? COLORS.white : COLORS.black};
  border-color: ${props => props.colType === 'continuous' ? COLORS.black : COLORS.white};
  color: ${props => props.colType === 'continuous' ? COLORS.black : COLORS.white};
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-align-items: center;
  -webkit-user-select: none;
  align-items: center;
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
  /* --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow-color: rgb(6 182 212/0.5);
  --tw-shadow: var(--tw-shadow-colored);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color),0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow); */
`

