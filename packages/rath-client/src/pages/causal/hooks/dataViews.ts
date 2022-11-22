import { useState, useMemo, useEffect } from "react";
import { applyFilters, IFilter } from '@kanaries/loa'
import { IRow } from "../../../interfaces";
import { focusedSample } from "../../../utils/sample";
import { useGlobalStore } from "../../../store";
import { baseDemoSample } from "../../painter/sample";

const VIZ_SUBSET_LIMIT = 2_000;
const SAMPLE_UPDATE_DELAY = 500;

/** 这是一个局部状态，不要在 causal page 以外的任何组件使用它 */
export function useDataViews (originData: IRow[]) {
    const { causalStore } = useGlobalStore();
    const { selectedFields } = causalStore;
    const [sampleRate, setSampleRate] = useState(1);
    const [appliedSampleRate, setAppliedSampleRate] = useState(sampleRate);
    const [filters, setFilters] = useState<IFilter[]>([]);
    const sampleSize = Math.round(originData.length * appliedSampleRate);
    const filteredData = useMemo(() => {
        return applyFilters(originData, filters);
    }, [originData, filters]);
    const sample = useMemo(() => {
        return focusedSample(filteredData, selectedFields, sampleSize).map(i => filteredData[i]);
    }, [filteredData, selectedFields, sampleSize]);
    const vizSampleData = useMemo(() => {
        if (sample.length < VIZ_SUBSET_LIMIT) {
            return sample;
        }
        return baseDemoSample(sample, VIZ_SUBSET_LIMIT);
    }, [sample]);

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
        dataSubset: sample,
        sample,
        filteredData,
        sampleRate,
        setSampleRate,
        appliedSampleRate,
        setAppliedSampleRate,
        filters,
        setFilters,
        sampleSize
    }
}