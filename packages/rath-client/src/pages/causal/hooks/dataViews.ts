import { useState, useMemo, useEffect } from "react";
import { applyFilters, IFilter } from '@kanaries/loa'
import { IRow } from "../../../interfaces";
import { baseDemoSample } from "../../painter/sample";

const VIZ_SUBSET_LIMIT = 2_000;
const SAMPLE_UPDATE_DELAY = 500;

/** 这是一个局部状态，不要在 causal page 以外的任何组件使用它 */
export function useDataViews (originData: IRow[]) {
    const [sampleRate, setSampleRate] = useState(1);
    const [appliedSampleRate, setAppliedSampleRate] = useState(sampleRate);
    const [filters, setFilters] = useState<IFilter[]>([]);
    const sampleSize = Math.round(originData.length * appliedSampleRate);
    const dataSource = useMemo(() => {
        if (appliedSampleRate >= 1) {
            return originData;
        }
        const sampleSize = Math.round(originData.length * appliedSampleRate);
        // console.log({sampleSize});
        return baseDemoSample(originData, sampleSize);
        // return viewSampling(originData, selectedFields, sampleSize); // FIXME: 用这个，但是有问题只能得到 0 / full ？
    }, [originData /*, selectedFields*/, appliedSampleRate]);
    const dataSubset = useMemo(() => {
        return applyFilters(dataSource, filters);
    }, [dataSource, filters]);
    const vizSampleData = useMemo(() => {
        if (dataSubset.length < VIZ_SUBSET_LIMIT) {
            return dataSubset;
        }
        return baseDemoSample(dataSubset, VIZ_SUBSET_LIMIT);
    }, [dataSubset]);

    useEffect(() => {
        if (sampleRate !== appliedSampleRate) {
            const delayedTask = setTimeout(() => {
                setAppliedSampleRate(sampleRate);
            }, SAMPLE_UPDATE_DELAY);

            return () => {
                clearTimeout(delayedTask);
            };
        }
    }, [sampleRate, appliedSampleRate]);
    return {
        vizSampleData,
        dataSubset,
        sampleRate,
        setSampleRate,
        appliedSampleRate,
        setAppliedSampleRate,
        filters,
        setFilters,
        sampleSize
    }
}