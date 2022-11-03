import { IconButton } from "@fluentui/react";
import type { FC } from "react";
import styled from "styled-components";


const Container = styled.div`
    position: absolute;
    right: 0;
    top: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid #8888;
    cursor: pointer;
    background-color: #ffffff;
    > button {
        color: #da3b01;
        :hover {
            color: #da3b01;
        }
    }
`;

export interface DeleteButtonProps {
    remove: () => void;
}

const DeleteButton: FC<DeleteButtonProps> = ({ remove }) => {
    return (
        <Container>
            <IconButton
                iconProps={{ iconName: 'Delete' }}
                onClick={remove}
            />
        </Container>
    );
};


export default DeleteButton;
