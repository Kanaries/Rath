import React from "react";
import styled from "styled-components";

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

export const FieldsContainer = styled.div`
  display: flex;
  padding: 0.2em;
  min-height: 2.4em;
  display: flex;
    flex-wrap: wrap;
    >div{
      margin: 1px;
    }
`;

export const FieldListSegment = styled.div`
  display: flex;
  border: 1px solid #dfe3e8;
  margin: 0.2em;
  div.fl-header {
    /* flex-basis: 100px; */
    width: 100px;
    border-right: 1px solid #dfe3e8;
    background-color: #f5f5f5;
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

export const FieldLabel = styled.div<{ highlight?: boolean; type?: 'D' | 'M' }>`
  padding: 0.2em 0.4em;
  margin: 0.2em;
  border-radius: 0.2em;
  background-color: ${props => (props.type === 'D' ? '#2185d0' : '#21ba45')};
  color: #fff;
  ${(props) =>
    props.highlight ? "box-shadow: 0px 0px 5px 1px #21ba45" : null};
  position: relative;
`;
