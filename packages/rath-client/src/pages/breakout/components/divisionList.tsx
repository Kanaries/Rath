import { Pivot, PivotItem } from "@fluentui/react";
import intl from 'react-intl-universal';
import { observer } from "mobx-react-lite";
import { useBreakoutStore } from "../store";
import type { ISubgroupResult } from "../utils/top-drivers";
import { resolveCompareTarget } from "./controlPanel";
import DivisionDetailList, { type IFlatSubgroupResult } from "./divisionDetailList";


export const groupSubgroupResults = (data: readonly ISubgroupResult[]): IFlatSubgroupResult[] => {
    const headers = data.filter(item => !item.path || item.path.length === 0);

    const result: IFlatSubgroupResult[] = [];
    for (const header of headers) {
        result.push();
        const children = data.filter(item => item.path?.[0] === header.id);
        if (children.length) {
            const nextRes = groupSubgroupResults(children.map(item => {
                const path = item.path ?? [];
                const nextPath = path.slice(1);
                return {
                    ...item,
                    path: nextPath,
                };
            }));
            const nextLevel = nextRes.map(item => ({
                ...item,
                path: [header.id, ...item.path],
            }));
            if (nextLevel) {
                result.push({
                    ...header,
                    hasChildren: true,
                    path: [],
                }, ...nextLevel);
            } else {
                result.push({
                    ...header,
                    hasChildren: false,
                    path: [],
                });
            }
        } else {
            result.push({
                ...header,
                hasChildren: false,
                path: [],
            });
        }
    }
    return result;
};

const DivisionList = observer(function DivisionList () {
    const context = useBreakoutStore();
    const { generalAnalyses, comparisonAnalyses, mainField, mainFieldFilters, comparisonFilters, fields } = context;
    const targetField = mainField ? resolveCompareTarget(mainField, fields) : null;

    return (
        <div>
            {mainField && targetField && (
                <Pivot>
                    {comparisonFilters.length === 0 && (
                        <PivotItem headerText={intl.get('breakout.general_contribution')}>
                            <DivisionDetailList
                                data={generalAnalyses}
                                title={targetField.text}
                                action={mainFieldFilters.length ? 'setComparisonFilter' : 'setMainFilter'}
                            />
                        </PivotItem>
                    )}
                    {comparisonFilters.length > 0 && (
                        <PivotItem headerText={intl.get('breakout.comparison_contribution')}>
                            <DivisionDetailList
                                data={comparisonAnalyses}
                                title={targetField.text}
                            />
                        </PivotItem>
                    )}
                </Pivot>
            )}
        </div>
    );
});


export default DivisionList;
