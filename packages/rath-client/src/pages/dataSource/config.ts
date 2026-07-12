import intl from 'react-intl-universal';
import { useMemo } from "react";
import { publicAssetUrl, runtimeEnv } from 'runtime-env';
import { IDataSourceType } from "../../global";
import type { LegacyIconName } from '../../components/icons';

export interface DataSourceTypeOption {
    key: IDataSourceType;
    text: string;
    icon: LegacyIconName;
    disabled?: boolean;
}

export const useDataSourceTypeOptions = function (): DataSourceTypeOption[] {
    const fileText = intl.get(`dataSource.importData.type.${IDataSourceType.FILE}`);
    const restfulText = intl.get(`dataSource.importData.type.${IDataSourceType.RESTFUL}`);
    const demoText = intl.get(`dataSource.importData.type.${IDataSourceType.DEMO}`);
    const dbText = intl.get(`dataSource.importData.type.${IDataSourceType.DATABASE}`);
    const historyText = intl.get('common.history');

    const options = useMemo<DataSourceTypeOption[]>(() => {
        return [
            {
                key: IDataSourceType.LOCAL,
                text: historyText,
                icon: 'History',
            },
            {
                key: IDataSourceType.FILE,
                text: fileText,
                icon: 'FabricUserFolder',
            },
            {
                key: IDataSourceType.DEMO,
                text: demoText,
                icon: 'FileTemplate',
            },
            {
                key: IDataSourceType.DATABASE,
                text: dbText,
                icon: 'Database',
            },
            {
                key: IDataSourceType.AIRTABLE,
                text: 'AirTable',
                icon: 'Table',
                disabled: false
            },
            {
                key: IDataSourceType.RESTFUL,
                text: restfulText,
                icon: 'Cloud',
            },
            {
                key: IDataSourceType.OLAP,
                text: 'OLAP',
                icon: 'TripleColumn',
                disabled: true,
            }
        ];
    }, [fileText, restfulText, demoText, dbText, historyText]);
    return options;
};

export const DemoDataAssets = runtimeEnv.isProduction ? {
    CARS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-cars-service.json",
    STUDENTS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-students-service.json",
    BTC_GOLD: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds_btc_gold_service.json",
    BIKE_SHARING: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-bikesharing-service.json',
    CAR_SALES: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-carsales-service.json',
    COLLAGE: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-collage-service.json',
    TITANIC: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-titanic-service.json',
    KEPLER: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-kelper-service.json',
    BIKE_SHARING_DC: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/bike_dc-dataset-service.json'
} : {
    // CARS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-cars-service.json",
    CARS: publicAssetUrl('datasets/ds-cars-service.json'),
    // CARS: "/datasets/test.json",
    // STUDENTS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-students-service.json",
    STUDENTS: publicAssetUrl('datasets/ds-students-service.json'),
    BTC_GOLD: publicAssetUrl('datasets/ds_btc_gold_service.json'),
    BIKE_SHARING: publicAssetUrl('datasets/ds-bikesharing-service.json'),
    CAR_SALES: publicAssetUrl('datasets/ds-carsales-service.json'),
    COLLAGE: publicAssetUrl('datasets/ds-collage-service.json'),
    TITANIC: publicAssetUrl('datasets/ds-titanic-service.json'),
    KEPLER: publicAssetUrl('datasets/ds-kelper-service.json'),
    BIKE_SHARING_DC: publicAssetUrl('datasets/bike_dc-dataset-service.json')
} as const;

export type IDemoDataKey = keyof typeof DemoDataAssets;

export const useDemoDataOptions = function (): Array<{key: IDemoDataKey; text: string; nCols: number; nRows: number}> {
    const options = useMemo<Array<{ key: IDemoDataKey; text: string; nCols: number; nRows: number }>>(() => {
        return [
            {
                key: "CARS",
                text: "Cars",
                nCols: 9,
                nRows: 406,
            },
            {
                key: "STUDENTS",
                text: "Students' Performance",
                nCols: 8,
                nRows: 1000,
            },
            {
                key: 'BIKE_SHARING_DC',
                text: 'Bike Sharing in Washington D.C.',
                nCols: 16,
                nRows: 17319,
            },
            {
                key: "CAR_SALES",
                text: "Car Sales",
                nCols: 16,
                nRows: 157,
            },
            {
                key: "COLLAGE",
                text: "Collage",
                nCols: 16,
                nRows: 1294,
            },
            {
                key: "KEPLER",
                text: "NASA Kepler",
                nCols: 44,
                nRows: 9218,
            },
            {
                key: 'BTC_GOLD',
                text: "2022MCM Problem C: Trading Strategies",
                nCols: 7,
                nRows: 464,
            },
            {
                key: "TITANIC",
                text: "Titanic",
                nCols: 11,
                nRows: 712,
            },
        ];
    }, []);
    return options;
}

export const SEMANTIC_TYPE_CHOICES: {key: string; text: string }[] = [
    { key: 'nominal', text: 'nominal' },
    { key: 'ordinal', text: 'ordinal' },
    { key: 'temporal', text: 'temporal' },
    { key: 'quantitative', text: 'quantitative' },
]

export const ANALYTIC_TYPE_CHOICES: {key: string; text: string }[] = [
    { key: 'dimension', text: 'dimension' },
    { key: 'measure', text: 'measure' },
]
