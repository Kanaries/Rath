import { FC } from "react";
import { observer } from "mobx-react-lite";
import type { useInteractFieldGroups } from "../../hooks/interactFieldGroup";


export interface IAutoVisProps {
    interactFieldGroups: ReturnType<typeof useInteractFieldGroups>;
}

const AutoVis: FC<IAutoVisProps> = ({ interactFieldGroups }) => {
    return (
        <></>
    );
};


export default observer(AutoVis);
