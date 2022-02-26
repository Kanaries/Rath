import { IDataSourceType } from "../../global";
import intl from 'react-intl-universal';
import { useMemo } from "react";

export const useDataSourceTypeOptions = function (): Array<{ key: IDataSourceType; text: string }> {
    const fileText = intl.get(`dataSource.importData.type.${IDataSourceType.FILE}`);
    const restfulText = intl.get(`dataSource.importData.type.${IDataSourceType.RESTFUL}`);
    const mysqlText = intl.get(`dataSource.importData.type.${IDataSourceType.MYSQL}`);
    const demoText = intl.get(`dataSource.importData.type.${IDataSourceType.DEMO}`)
    const clickHouseText = 'ClickHouse';

    const options = useMemo<Array<{ key: IDataSourceType; text: string }>>(() => {
        return [
            {
                key: IDataSourceType.FILE,
                text: fileText,
                iconProps: { iconName: "ExcelDocument" },
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
            {
                key: IDataSourceType.MYSQL,
                text: mysqlText,
                iconProps: { iconName: "LinkedDatabase" },
                disabled: true,
            },
            {
                key: IDataSourceType.CLICKHOUSE,
                text: clickHouseText,
                iconProps: { iconName: "TripleColumn" },
                disabled: false,
            }
        ];
    }, [fileText, restfulText, mysqlText, demoText]);
    return options;
};

export const DemoDataAssets = {
    // CARS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-cars-service.json",
    CARS: "http://localhost:3000/datasets/ds-cars-service.json",
    // STUDENTS: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds-students-service.json",
    STUDENTS: "http://localhost:3000/datasets/ds-students-service.json",
    BTC_GOLD: "https://chspace.oss-cn-hongkong.aliyuncs.com/api/ds_btc_gold_service.json",
    // BTC_GOLD: "http://localhost:3000/datasets/demo.json",
} as const;

export type IDemoDataKey = keyof typeof DemoDataAssets;

export const useDemoDataOptions = function (): Array<{key: IDemoDataKey; text: string}> {
    const options = useMemo<Array<{ key: IDemoDataKey; text: string }>>(() => {
        return [
            {
                key: 'BTC_GOLD',
                text: "2022MCM Problem C: Trading Strategies"
            },
            {
                key: "CARS",
                text: "Cars",
            },
            {
                key: "STUDENTS",
                text: "students"
            }
        ];
    }, []);
    return options;
}
