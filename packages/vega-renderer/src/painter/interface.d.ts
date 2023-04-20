import type { View } from 'vega-typings';
interface IPainterDrawConfig {
    view: View;
    painterMode: 'color' | 'clean';
    fields: [string, string];
    point: [number, number];
    radius: number;
    /**
     * [number,number]: data extent of both fields, or \
     * number: data extent of fields[0] */
    range: [number, number] | number;
    /** Select item iff `item.datum[key] === limites[key]`, for all keys of `limits` */
    limits: { [key: string]: any };
    /** The key to store the `groupValue`. `_lab_field` by default */
    groupKey?: string;
    /** `groupValue` equals to "_selected" by default */
    groupValue?: any;
    /** The key of mutIndices to return */
    indexKey?: any;
    /** `"#ffffff for ERASE and #000000 for COLOR by default" */
    newColor?: string; // hex color
}
