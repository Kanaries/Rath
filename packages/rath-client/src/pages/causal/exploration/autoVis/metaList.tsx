import intl from 'react-intl-universal';
import { DetailsList, IColumn, SelectionMode } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useMemo } from "react";
import { useCausalViewContext } from "../../../../store/causalStore/viewStore";
import DistributionChart from "../../../dataSource/metaView/distChart";


const metaKeys = ['dist', 'unique', 'mean', 'min', 'qt_25', 'qt_50', 'qt_75', 'max', 'stdev'] as const;

const COL_WIDTH = 128;
const DIST_CHART_HEIGHT = 20;

const MetaList: FC = () => {
    const viewContext = useCausalViewContext();
    const { selectedFieldGroup } = viewContext ?? {};

    const columns = useMemo<IColumn[]>(() => {
        return new Array<IColumn>({
            key: 'KEY',
            name: '',
            minWidth: 100,
            maxWidth: 100,
            isResizable: false,
            onRender(key: typeof metaKeys[number]) {
                return {
                    dist: intl.get('causal.dataset.dist'),
                    unique: intl.get('causal.dataset.distinct_count'),
                    mean: intl.get('common.stat.mean'),
                    min: intl.get('common.stat.min'),
                    qt_25: intl.get('common.stat.qt_25'),
                    qt_50: intl.get('common.stat.qt_50'),
                    qt_75: intl.get('common.stat.qt_75'),
                    max: intl.get('common.stat.mean'),
                    stdev: intl.get('common.stat.stdev'),
                }[key];
            },
        }).concat(selectedFieldGroup?.map<IColumn>(f => ({
            key: f.fid,
            name: f.name || f.fid,
            minWidth: COL_WIDTH,
            maxWidth: COL_WIDTH,
            isResizable: false,
            onRender(key: typeof metaKeys[number]) {
                if (key === 'dist') {
                    return (
                        <DistributionChart
                            dataSource={f.distribution}
                            semanticType={f.semanticType}
                            analyticType={f.analyticType}
                            x="memberName"
                            y="count"
                            width={COL_WIDTH}
                            height={DIST_CHART_HEIGHT}
                            label={false}
                        />
                    );
                }
                const value = f.features[key];
                if (typeof value === 'number') {
                    if (key === 'unique') {
                        return value.toFixed(0);
                    }
                    if (Number.isFinite(value)) {
                        if (Math.abs(value - Math.floor(value)) < Number.MIN_VALUE) {
                            return value.toFixed(0);
                        }
                        return value > 0 && value < 1e-2 ? value.toExponential(2) : value.toPrecision(4);
                    }
                    return '-';
                }
                return value ?? '-';
            },
        })) ?? []);
    }, [selectedFieldGroup]);

    return selectedFieldGroup?.length ? (
        <div>
            <header>
                {intl.get('causal.dataset.stat')}
            </header>
            <DetailsList
                items={metaKeys.slice(0)}
                columns={columns}
                selectionMode={SelectionMode.none}
            />
        </div>
    ) : null;
};


export default observer(MetaList);
