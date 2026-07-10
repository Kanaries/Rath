import { PAINTER_MODE } from "../../interfaces";

export const COLOR_SCHEME: string[] = ['#4c78a8', '#f58518', '#e45756', '#72b7b2', '#54a24b', '#eeca3b', '#b279a2', '#ff9da6', '#9d755d', '#bab0ac']

export const COLOR_CELLS = COLOR_SCHEME.map((c, i) => ({
    id: `L_${i + 1}`,
    color: c,
    label: `L_${i + 1}`,
}));

interface PainterModeOption {
    key: PAINTER_MODE;
    text: string;
    disabled?: boolean;
}

export const PAINTER_MODE_LIST: PainterModeOption[] = [
    { key: PAINTER_MODE.MOVE, text: 'Move' },
    { key: PAINTER_MODE.COLOR, text: 'color' },
    { key: PAINTER_MODE.ERASE, text: 'clean' },
    {
        key: PAINTER_MODE.CREATE,
        text: 'create',
        disabled: true,
    },
];

export const LABEL_FIELD_KEY = '_lab_field';
export const LABEL_INDEX = '_label_index';
