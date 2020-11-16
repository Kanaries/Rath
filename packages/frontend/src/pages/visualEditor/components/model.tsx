import React from 'react';
import styled from 'styled-components';
import { IconButton } from 'office-ui-fabric-react';
const Container = styled.div`
  width: 880px;
  max-height: 800px;
  overflow: auto;
  > div.header {
    background-color: #f0f0f0;
    display: flex;
    padding: 8px;
    align-items: center;
  }
  > div.container {
    padding: 1em;
  }
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  box-shadow: 0px 0px 12px 3px rgba(0, 0, 0, 0.19);
  border-radius: 4px;
  z-index: 999;
`;
interface ModelProps {
  onClose?: () => void
  title?: string;
}
const Model: React.FC<ModelProps> = props => {
  const { onClose, title } = props;
  return (
    <Container>
      <div className="header">
        {title}
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          title="Upload"
          ariaLabel="upload data"
          onClick={onClose}
        />
      </div>
      <div className="container">{props.children}</div>
    </Container>
  )
}

export default Model;
