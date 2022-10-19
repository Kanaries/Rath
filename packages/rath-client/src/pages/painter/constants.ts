import { IChoiceGroupOption } from "@fluentui/react";
import { PAINTER_MODE } from "../../interfaces";

export const COLOR_SCHEME: string[] = ['#4c78a8', '#f58518', '#e45756', '#72b7b2', '#54a24b', '#eeca3b', '#b279a2', '#ff9da6', '#9d755d', '#bab0ac']

export const COLOR_CELLS = COLOR_SCHEME.map((c, i) => ({
    id: `L_${i + 1}`,
    color: c,
    label: `L_${i + 1}`,
}));

export const PAINTER_MODE_LIST: IChoiceGroupOption[] = [
    { key: PAINTER_MODE.MOVE, text: 'Move', iconProps: { iconName: 'Move', style: { fontSize: '18px' } } },
    { key: PAINTER_MODE.COLOR, text: 'color', iconProps: { iconName: 'Color', style: { fontSize: '18px' } } },
    { key: PAINTER_MODE.ERASE, text: 'clean', iconProps: { iconName: 'EraseTool', style: { fontSize: '18px' } } },
    {
        key: PAINTER_MODE.CREATE,
        text: 'create',
        iconProps: { iconName: 'Brush', style: { fontSize: '18px' } },
        disabled: true,
    },
];

export const LABEL_FIELD_KEY = '_lab_field';
export const LABEL_INDEX = '_label_index';