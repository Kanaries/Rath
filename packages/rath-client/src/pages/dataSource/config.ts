import { IDataSourceType } from "../../global";
import intl from 'react-intl-universal';
import { useMemo } from "react";

export const useDataSourceTypeOptions = function (): Array<{ key: IDataSourceType; text: string }> {
    const fileText = intl.get(`dataSource.importData.type.${IDataSourceType.FILE}`);
    const restfulText = intl.get(`dataSource.importData.type.${IDataSourceType.RESTFUL}`);
    // const mysqlText = intl.get(`dataSource.importData.type.${IDataSourceType.MYSQL}`);
    const demoText = intl.get(`dataSource.importData.type.${IDataSourceType.DEMO}`)
    const clickHouseText = 'clickhouse';
    const localText = intl.get('common.history')

    const options = useMemo<Array<{ key: IDataSourceType; text: string }>>(() => {
        return [
            {
                key: IDataSourceType.FILE,
                text: fileText,
                iconProps: { iconName: "ExcelDocument" },
            },
            {
                key: IDataSourceType.LOCAL,
                text: localText,
                iconProps: { iconName: "FabricUserFolder" },
                disabled: false,
            },
            {
                key: IDataSourceType.DEMO,
                text: demoText,
                iconProps: { iconName: "FileTemplate" },
            },
            {
                key: IDataSourceType.RESTFUL,
                text: restfulText,
                iconProps: { iconName: "Cloud" },
            },
            // {
            //     key: IDataSourceType.MYSQL,
            //     text: mysqlText,
            //     iconProps: { iconName: "LinkedDatabase" },
            //     disabled: true,
            // },
            {
                key: IDataSourceType.CLICKHOUSE,
                text: clickHouseText,
                iconProps: { iconName: "TripleColumn" },
                disabled: false,
            },
            {
                key: IDataSourceType.AIRTABLE,
                text: 'AirTable',
                iconProps: { iconName: 'Table' },
                disabled: false
            }
        ];
    }, [fileText, restfulText, demoText, localText]);
    return options;
};

export const DemoDataAssets = process.env.NODE_ENV === 'production' ? {
    CARS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-cars-service.json",
    STUDENTS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-students-service.json",
    BTC_GOLD: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds_btc_gold_service.json",
    BIKE_SHARING: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-bikesharing-service.json',
    CAR_SALES: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-carsales-service.json',
    COLLAGE: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-collage-service.json',
    TITANIC: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-titanic-service.json',
    KELPER: 'https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-kelper-service.json',
} : {
    // CARS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-cars-service.json",
    CARS: "/datasets/ds-cars-service.json",
    // CARS: "/datasets/dataset-service-edge.json",
    // STUDENTS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-students-service.json",
    STUDENTS: "/datasets/ds-students-service.json",
    BTC_GOLD: "/datasets/ds_btc_gold_service.json",
    BIKE_SHARING: '/datasets/ds-bikesharing-service.json',
    CAR_SALES: '/datasets/ds-carsales-service.json',
    COLLAGE: '/datasets/ds-collage-service.json',
    TITANIC: '/datasets/ds-titanic-service.json',
    KELPER: '/datasets/ds-kelper-service.json',
} as const;

export type IDemoDataKey = keyof typeof DemoDataAssets;

export const useDemoDataOptions = function (): Array<{key: IDemoDataKey; text: string}> {
    const options = useMemo<Array<{ key: IDemoDataKey; text: string }>>(() => {
        return [
            {
                key: "CARS",
                text: "Cars",
            },
            {
                key: "STUDENTS",
                text: "Students' Performance"
            },
            {
                key: "BIKE_SHARING",
                text: "Bike Sharing"
            },
            {
                key: "CAR_SALES",
                text: "Car Sales"
            },
            {
                key: "COLLAGE",
                text: "Collage"
            },
            {
                key: "KELPER",
                text: "NASA Kelper"
            },
            {
                key: 'BTC_GOLD',
                text: "2022MCM Problem C: Trading Strategies"
            },
            {
                key: "TITANIC",
                text: "Titanic"
            }
        ];
    }, []);
    return options;
}
