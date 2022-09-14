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
    // STUDENTS: "https://chspace.oss-cn-hongkong.aliyuncs.com/datasets/ds-students-service.json",
    STUDENTS: "/datasets/ds-students-service.json",
    BTC_GOLD: "/datasets/ds_btc_gold_service.json",
    BIKE_SHARING: '/datasets/ds-bikesharing-service.json',
    CAR_SALES: '/datasets/ds-carsales-service.json',
    COLLAGE: '/datasets/ds-collage-service.json',
    TITANIC: '/datasets/ds-titanic-service.json',
    KELPER: '/datasets/ds-kelper-service.json',
} as const;

interface IPublicData {
    key: string;
    title: string;
    desc?: string;
}

export const PUBLIC_DATA_LIST: IPublicData[] = [
    {
        key: "CARS",
        title: "Cars",
    },
    {
        key: "STUDENTS",
        title: "Students' Performance"
    },
    {
        key: "BIKE_SHARING",
        title: "Bike Sharing"
    },
    {
        key: "CAR_SALES",
        title: "Car Sales"
    },
    {
        key: "COLLAGE",
        title: "Collage"
    },
    {
        key: "KELPER",
        title: "NASA Kelper"
    },
    {
        key: 'BTC_GOLD',
        title: "2022MCM Problem C: Trading Strategies"
    },
    {
        key: "TITANIC",
        title: "Titanic"
    }
]