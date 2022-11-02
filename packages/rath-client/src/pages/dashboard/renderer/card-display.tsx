import { observer } from "mobx-react-lite";
import type { FC } from "react";
import type { CardProviderProps } from "./card";


const CardDisplay: FC<CardProviderProps> = ({ children }) => {
    return children({});
};


export default observer(CardDisplay);
