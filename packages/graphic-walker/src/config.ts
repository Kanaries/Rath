import { IStackMode } from "./interfaces";

export const GEMO_TYPES: Readonly<string[]> = [
    'auto',
    'bar',
    'line',
    'area',
    'trail',
    'point',
    'circle',
    'tick',
    'rect',
    'arc',
    'boxplot',
] as const;

export const STACK_MODE: Readonly<IStackMode[]> = [
    'none',
    'stack',
    'normalize'
]

export const CHART_LAYOUT_TYPE: Readonly<string[]> = [
    'auto',
    'fixed',
] as const;

export const COLORS = {
    // tableau style
    // dimension: 'rgb(73, 150, 178)',
    // measure: 'rgb(0, 177, 128)',
    // dimension: 'rgb(86, 170, 208)',
    // measure: 'rgb(232, 149, 72)'
    dimension: 'rgba(0, 0, 0, 0.9)',
    measure: 'rgba(10, 0, 0, 0.6)',
    black: '#141414',
    white: '#fafafa'
}