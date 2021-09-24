import React from 'react';
import styled from 'styled-components';
import { XCircleIcon } from '@heroicons/react/outline';
const Container = styled.div`
  width: 880px;
  max-height: 800px;
  overflow: auto;
  > div.header {
    background-color: #f0f0f0;
    display: flex;
    padding: 12px;
    font-size: 14px;
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
  /* box-shadow: 0px 0px 12px 3px rgba(0, 0, 0, 0.19); */
  border-radius: 4px;
  z-index: 999;
`;
interface ModalProps {
    onClose?: () => void
    title?: string;
}
const Modal: React.FC<ModalProps> = props => {
    const { onClose, title } = props;
    return (
        <Container className="shadow-lg">
            <div className="header relative h-9">
                {title}
                <XCircleIcon
                    className="text-red-600 absolute right-2 w-6 cursor-pointer"
                    onClick={onClose}
                />
            </div>
            <div className="container">{props.children}</div>
        </Container>
    )
}

export default Modal;
