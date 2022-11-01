import { observer } from "mobx-react-lite";
import type { FC } from "react";
import styled from "styled-components";
import { useGlobalStore } from "../../store";


const Preview = styled.div`
    width: 100%;
    height: 100%;
`;

const DocumentPreview: FC<{ index: number }> = ({ index }) => {
    const { dashboardStore } = useGlobalStore();
    const dataUrl = dashboardStore.usePreview(index);

    return (
        <Preview
            style={{
                backgroundImage: `url(${dataUrl})`,
            }}
        />
    );
};


export default observer(DocumentPreview);
