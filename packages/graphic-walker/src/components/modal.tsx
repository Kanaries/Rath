import React, { useRef } from 'react';
import styled from 'styled-components';
import { XCircleIcon } from '@heroicons/react/24/outline';


const Background = styled.div({
  position: 'fixed',
  left: 0,
  top: 0,
  width: '100vw',
  height: '100vh',
  backdropFilter: 'blur(1px)',
  zIndex: 25535,
});

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
  const prevMouseDownTimeRef = useRef(0);

  return (
    <Background
      // This is a safer replacement of onClick handler.
      // onClick also happens if the click event is begun by pressing mouse button
      // at a different element and then released when the mouse is moved on the target element.
      // This case is required to be prevented, especially disturbing when interacting
      // with a Slider component.
      onMouseDown={() => prevMouseDownTimeRef.current = Date.now()}
      onMouseOut={() => prevMouseDownTimeRef.current = 0}
      onMouseUp={() => {
        if (Date.now() - prevMouseDownTimeRef.current < 1000) {
          onClose?.();
        }
      }}
    >
      <Container
        role="dialog"
        className="shadow-lg"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="header relative h-9">
          <header className="font-bold">
            {title}
          </header>
          <XCircleIcon
            className="text-red-600 absolute right-2 w-6 cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="close dialog"
            onClick={onClose}
          />
        </div>
        <div className="container">{props.children}</div>
      </Container>
    </Background>
  );
}

export default Modal;
