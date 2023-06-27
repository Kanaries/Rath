import { IPattern } from "@kanaries/loa";
import { toJS } from "mobx";
import { IFieldMeta, IRow, IVegaSubset } from "../../interfaces";
import { adviceVisSize } from "../../pages/collection/utils";
import { distVis } from "../../queries/distVis";
import { labDistVis } from "../../queries/labdistVis";
import { IMainVizSetting } from "./localTypes";

interface AutoVisProps {
    mainVizSetting: IMainVizSetting;
    mainViewQuery: IPattern | null;
    fieldMetas: IFieldMeta[];
    vizAlgo: 'lite' | 'strict';
    dataSource?: IRow[];
}
export function autoVis (props: AutoVisProps): IVegaSubset | null {
    const { mainVizSetting, mainViewQuery, fieldMetas, vizAlgo, dataSource = [] } = props;
    if (mainViewQuery === null) return null
    if (vizAlgo === 'lite') {
        return adviceVisSize(distVis({
            resizeMode: mainVizSetting.resize.mode,
            pattern: toJS(mainViewQuery),
            width: mainVizSetting.resize.width,
            height: mainVizSetting.resize.height,
            interactive: mainVizSetting.interactive,
            stepSize: 32,
            excludeScaleZero: mainVizSetting.excludeScaleZero,
            specifiedEncodes: mainViewQuery.encodes
        }), fieldMetas, 800, 500)
    } else {
        return adviceVisSize(labDistVis({
            resizeMode: mainVizSetting.resize.mode,
            pattern: toJS(mainViewQuery),
            width: mainVizSetting.resize.width,
            height: mainVizSetting.resize.height,
            interactive: mainVizSetting.interactive,
            stepSize: 32,
            dataSource,
            excludeScaleZero: mainVizSetting.excludeScaleZero,
            specifiedEncodes: mainViewQuery.encodes
        }), fieldMetas, 800, 500)
    }
}