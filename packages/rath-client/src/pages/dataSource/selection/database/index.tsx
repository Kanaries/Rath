import React, { useCallback, useEffect, useMemo, useRef, useState } from  'react';
import { observer } from 'mobx-react-lite';
import { IMuteFieldBase, IRow } from '../../../../interfaces';
import { DefaultButton, Dropdown, IDropdownOption, Label, PrimaryButton, Stack, TextField, Icon, registerIcons } from 'office-ui-fabric-react';
import intl from 'react-intl-universal';
import TablePreview from './table-preview';
import { fetchTablePreview, getSourceId, listDatabases, listSchemas, listTables, requestSQL } from './api';
import { logDataImport } from '../../../../loggers/dataImport';
import Progress from './progress';
import prefetch from '../../../../utils/prefetch';


const StackTokens = {
    childrenGap: 20
};

export type SupportedDatabaseType = (
    | 'postgres'
    | 'clickhouse'
    | 'mysql'
    | 'kylin'
    | 'oracle'
    | 'doris'
    | 'impala'
    | 'awsathena'
    | 'redshift'
    | 'sparksql'
    | 'hive'
    | 'sqlserver'
);

const datasetOptions = ([
    {
        text: 'PostgreSQL',
        key: 'postgres',
        rule: 'postgresql://{userName}:{password}@{host}:{port}/{database}',
        hasDatabase: false,
        requiredSchema: true,
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="5"
                y="5"
                width="90"
                height="90"
                xlinkHref="/assets/images/postgres_logo.png"
            />
        ),
        assetSrc: '/assets/images/postgres_logo.png',
    },
    {
        text: 'ClickHouse',
        key: 'clickhouse',
        rule: 'clickhouse://{userName}:{password}@{host}:{port}/{database}',
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="14"
                y="-56"
                width="220"
                height="220" 
                xlinkHref="/assets/images/clickhouse_logo.png"
            />
        ),
        assetSrc: '/assets/images/clickhouse_logo.png',
    },
    {
        text: 'MySQL',
        key: 'mysql',
        rule: 'mysql://{userName}:{password}@{host}/{database}',
        iconSvg: (
            <g
                role="presentation"
                aria-hidden
                xmlns="http://www.w3.org/2000/svg"
                display="inline"
                transform="scale(0.44),translate(-35,12)"
            >
                <g transform="matrix(1.2699241,0,0,-1.2699241,3.3662307,208.12494)">
                    <g transform="scale(0.1,0.1)">
                        <path fillRule="nonzero" fill="#00758F" d="m733.07,319.32-64.832,0c-2.28,109.43-8.6,212.33-18.93,308.72h-0.57104l-98.711-308.72h-49.363l-98.113,308.72h-0.578c-7.28-92.57-11.86-195.47-13.77-308.72h-59.113c3.82,137.73,13.38,266.84,28.68,387.36h80.356l93.535-284.62h0.57397l94.109,284.62h76.887c16.836-141.15,26.778-270.3,29.832-387.36"/>
                        <path fillRule="nonzero" fill="#00758F" d="m1014.3,605.11c-26.401-143.25-61.225-247.35-104.45-312.29-33.679-50.039-70.574-75.058-110.75-75.058-10.71,0-23.917,3.226-39.589,9.636v34.532c7.656-1.121,16.64-1.719,26.972-1.719,18.743,0,33.848,5.18,45.34,15.519,13.762,12.598,20.649,26.758,20.649,42.45,0,10.718-5.372,32.711-16.067,65.98l-71.152,220.95h63.691l51.067-165.25c11.472-37.519,16.257-63.711,14.343-78.64,27.93,74.601,47.442,155.9,58.543,243.89h61.401"/>
                        <path fillRule="nonzero" fill="#F29111" d="m1298.3,426.69c0-32.851-12.07-59.82-36.13-80.921-24.08-21.008-56.43-31.54-96.94-31.54-37.89,0-74.61,12.122-110.18,36.168l16.64,33.274c30.61-15.301,58.31-22.942,83.18-22.942,23.33,0,41.59,5.192,54.8,15.45,13.18,10.332,21.08,24.742,21.08,43.019,0,23-16.04,42.66-45.47,59.153-27.17,14.91-81.47,46.039-81.47,46.039-29.42,21.461-44.17,44.488-44.17,82.429,0,31.379,11,56.742,32.97,76.039,22.02,19.336,50.43,29.004,85.22,29.004,35.96,0,68.66-9.597,98.11-28.722l-14.96-33.243c-25.2,10.684-50.05,16.047-74.55,16.047-19.88,0-35.2-4.773-45.88-14.375-10.74-9.519-17.38-21.769-17.38-36.699,0-22.941,16.39-42.84,46.65-59.652,27.51-14.918,83.14-46.649,83.14-46.649,30.26-21.422,45.34-44.261,45.34-81.879"/>
                        <path fillRule="evenodd" fill="#F29111" d="m1414.2,396.81c-15.69,25.25-23.55,65.769-23.55,121.64,0,97.539,29.66,146.34,88.95,146.34,31,0,53.75-11.672,68.3-34.992,15.67-25.262,23.53-65.43,23.53-120.52,0-98.32-29.66-147.5-88.95-147.5-30.99,0-53.75,11.66-68.28,35.028m230.68-86.829-71.2,35.11c6.3401,5.199,12.36,10.808,17.81,17.301,30.23,35.539,45.36,88.14,45.36,157.78,0,128.15-50.31,192.26-150.92,192.26-49.35,0-87.81-16.25-115.35-48.797-30.24-35.582-45.34-87.985-45.34-157.23,0-68.089,13.38-118.04,40.16-149.77,24.4-28.68,61.3-43.04,110.7-43.04,18.43,0,35.34,2.269,50.71,6.808l92.72-53.957,25.28,43.539"/>
                        <path fillRule="nonzero" fill="#F29111" d="m1877.3,319.32-184.19,0,0,387.36,61.98,0,0-339.71,122.21,0,0-47.649"/>
                        <path fillRule="nonzero" fill="#F29111" d="m1921.5,319.36,10.27,0,0,39.411,13.44,0,0,8.05-37.67,0,0-8.05,13.96,0,0-39.411zm78.15,0,9.6801,0,0,47.461-14.56,0-11.85-32.351-12.9,32.351-14.03,0,0-47.461,9.1599,0,0,36.121,0.5201,0,13.51-36.121,6.9799,0,13.49,36.121,0-36.121"/>
                        <path fillRule="evenodd" fill="#00758F" d="m1955.1,836.43c-37.46,0.93695-66.47-2.801-90.8-13.106-7.02-2.805-18.24-2.805-19.2-11.699,3.77-3.738,4.2201-9.817,7.52-14.988,5.6-9.36,15.41-21.977,24.32-28.547,9.8299-7.492,19.66-14.953,29.97-21.504,18.24-11.281,38.84-17.805,56.6-29.043,10.33-6.543,20.59-14.961,30.92-22,5.13-3.742,8.38-9.836,14.96-12.152v1.417c-3.3001,4.2-4.22,10.286-7.48,14.993-4.67,4.644-9.36,8.883-14.05,13.543-13.58,18.25-30.45,34.148-48.66,47.254-14.99,10.324-47.77,24.367-53.83,41.632,0,0-0.49,0.49597-0.95,0.95697,10.3,0.95001,22.49,4.7,32.31,7.539,15.89,4.2,30.4,3.25,46.78,7.45,7.5,1.886,14.99,4.242,22.51,6.543v4.242c-8.47,8.4059-14.53,19.656-23.42,27.605-23.85,20.586-50.09,40.696-77.23,57.571-14.53,9.363-33.25,15.418-48.7,23.394-5.5899,2.813-14.94,4.199-18.23,8.906-8.4301,10.293-13.13,23.848-19.2,36.036-13.56,25.713-26.69,54.253-38.37,81.443-8.4199,18.24-13.57,36.48-23.87,53.34-48.23,79.58-100.63,127.76-181.13,175.04-17.32,9.84-37.91,14.05-59.89,19.2-11.72,0.49-23.41,1.4-35.11,1.86-7.5,3.29-15,12.19-21.54,16.4-26.69,16.84-95.46,53.34-115.13,5.14-12.64-30.44,18.72-60.38,29.49-75.83,7.9499-10.75,18.26-22.94,23.85-35.09,3.2801-7.96,4.22-16.4,7.51-24.81,7.48-20.59,14.49-43.53,24.34-62.73,5.13-9.8299,10.74-20.14,17.29-28.99,3.7799-5.1799,10.31-7.49,11.72-15.94-6.53-9.35-7.04-23.39-10.78-35.1-16.84-52.89-10.3-118.41,13.58-157.25,7.47-11.699,25.28-37.449,49.15-27.597,21.06,8.4098,16.38,35.089,22.46,58.476,1.3999,5.6562,0.4599,9.3668,3.26,13.106v-0.94592c6.5499-13.086,13.12-25.691,19.2-38.84,14.53-22.91,39.78-46.785,60.86-62.683,11.2-8.457,20.1-22.942,34.14-28.106v1.414h-0.92c-2.82,4.1998-7.0199,6.086-10.77,9.3478-8.4201,8.4299-17.76,18.731-24.34,28.086-19.65,26.199-36.99,55.234-52.4,85.184-7.5099,14.543-14.05,30.441-20.14,44.941-2.8001,5.5901-2.8001,14.039-7.4901,16.84-7.0399-10.285-17.31-19.191-22.45-31.789-8.9-20.149-9.8299-44.949-13.13-70.703-1.86-0.48895-0.92,0-1.86-0.92999-14.96,3.7419-20.11,19.184-25.74,32.246-14.04,33.274-16.4,86.627-4.2099,125.01,3.26,9.8101,17.34,40.7,11.7,50.06-2.8299,8.9299-12.18,14.03-17.32,21.08-6.0701,8.89-12.66,20.1-16.83,29.95-11.24,26.2-16.89,55.23-29.02,81.43-5.62,12.19-15.47,24.83-23.4,36.04-8.91,12.64-18.73,21.53-25.76,36.49-2.3201,5.16-5.6001,13.59-1.87,19.19,0.9199,3.75,2.8199,5.1601,6.5699,6.1001,6.0501,5.1499,23.39-1.39,29.46-4.2,17.33-7,31.84-13.59,46.33-23.4,6.5599-4.6899,13.58-13.58,21.99-15.94h9.8499c14.97-3.25,31.83-0.91,45.88-5.14,24.79-7.95,47.25-19.65,67.39-32.29,61.29-38.85,111.84-94.09,145.99-160.07,5.63-10.75,7.99-20.59,13.13-31.8,9.83-22.98,22.01-46.38,31.82-68.823,9.8201-22,19.2-44.446,33.26-62.727,7-9.812,35.09-14.961,47.73-20.113,9.3401-4.199,23.87-7.949,32.3-13.09,15.91-9.812,31.79-21.062,46.79-31.844,7.4699-5.617,30.88-17.304,32.29-26.679"/>
                        <path fillRule="evenodd" fill="#00758F" d="m1477.7,1243.2c-7.9399,0-13.54-0.96-19.19-2.3501v-0.9399h0.91c3.7799-7.47,10.34-12.66,14.98-19.2,3.77-7.4902,7.0499-14.95,10.79-22.45,0.4599,0.4599,0.9099,0.9501,0.9099,0.9501,6.5999,4.6599,9.87,12.14,9.87,23.39-2.83,3.3001-3.2701,6.5501-5.63,9.8401-2.8,4.6699-8.89,7.01-12.64,10.76"/>
                    </g>
                </g>
            </g>
        ),
    },
    {
        text: 'Apache Kylin',
        key: 'kylin',
        rule: 'kylin://{username}:{password}@{hostname}:{port}/{project}?{param1}={value1}&{param2}={value2}',
        hasDatabase: false,
        requiredSchema: true,
        schemaEnumerable: false,
        tableEnumerable: false,
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="0"
                y="0"
                width="100"
                height="100"
                xlinkHref="/assets/images/kylin_logo.png"
            />
        ),
        assetSrc: '/assets/images/kylin_logo.png',
    },
    {
        text: 'Oracle',
        key: 'oracle',
        rule: 'oracle://',
        hasDatabase: false,
        iconSvg: (
            <path
                d="M99.61,19.52h15.24l-8.05-13L92,30H85.27l18-28.17a4.29,4.29,0,0,1,7-.05L128.32,30h-6.73l-3.17-5.25H103l-3.36-5.23m69.93,5.23V0.28h-5.72V27.16a2.76,2.76,0,0,0,.85,2,2.89,2.89,0,0,0,2.08.87h26l3.39-5.25H169.54M75,20.38A10,10,0,0,0,75,.28H50V30h5.71V5.54H74.65a4.81,4.81,0,0,1,0,9.62H58.54L75.6,30h8.29L72.43,20.38H75M14.88,30H32.15a14.86,14.86,0,0,0,0-29.71H14.88a14.86,14.86,0,1,0,0,29.71m16.88-5.23H15.26a9.62,9.62,0,0,1,0-19.23h16.5a9.62,9.62,0,1,1,0,19.23M140.25,30h17.63l3.34-5.23H140.64a9.62,9.62,0,1,1,0-19.23h16.75l3.38-5.25H140.25a14.86,14.86,0,1,0,0,29.71m69.87-5.23a9.62,9.62,0,0,1-9.26-7h24.42l3.36-5.24H200.86a9.61,9.61,0,0,1,9.26-7h16.76l3.35-5.25h-20.5a14.86,14.86,0,0,0,0,29.71h17.63l3.35-5.23h-20.6"
                transform="translate(6,44),scale(0.39)"
            />
        ),
    },
    {
        text: 'Apache Doris',
        key: 'doris',
        rule: '',
        iconSvg: (
            <>
                <g clipPath="url(#clip0_163_263)" transform="scale(2.2),translate(14, 8)">
                    <path d="M13.6064 4.59429L10.3332 1.32107C9.91606 0.90283 9.42058 0.57089 8.87509 0.344218C8.3296 0.117546 7.74478 0.000586913 7.15407 1.93118e-05C6.06458 -0.00328922 5.01681 0.418635 4.23365 1.17603C3.82467 1.57082 3.49834 2.04305 3.27367 2.56521C3.049 3.08736 2.93048 3.649 2.925 4.21741C2.91953 4.78583 3.02722 5.34965 3.2418 5.87603C3.45637 6.40241 3.77355 6.88084 4.17485 7.28343L10.1137 13.2223C10.2397 13.3417 10.4066 13.4082 10.5802 13.4082C10.7537 13.4082 10.9207 13.3417 11.0467 13.2223L13.6025 10.6664C13.7632 10.4743 16.4367 7.42063 13.6064 4.59429Z" fill="#15A9CA"/>
                    <path d="M18.9689 9.8236C18.3456 9.21992 17.6988 8.59663 17.1148 7.92238V7.89886C17.0939 7.96018 17.0782 8.02312 17.0677 8.08702C16.8225 9.51983 16.1197 10.8346 15.0646 11.8346C11.6189 15.2568 8.13396 18.7534 4.76274 22.1364L4.30801 22.5872C3.6131 23.2265 3.14408 24.0737 2.97128 25.002C2.89829 25.6637 2.96756 26.3334 3.17443 26.9662C3.38131 27.599 3.72102 28.1803 4.17081 28.6711C4.55481 29.1067 5.03077 29.4515 5.5643 29.6806C6.09784 29.9098 6.67562 30.0175 7.25588 29.9961C8.60045 30.0157 9.25509 29.8393 10.2351 28.8867C14.1551 25.049 18.0752 21.1799 21.0426 18.2399C22.4421 16.8483 22.7635 14.5433 21.7718 12.991C20.9652 11.8287 20.0244 10.7656 18.9689 9.8236Z" fill="#52CAA3"/>
                    <path d="M-0.00390618 7.77345V22.2305C-0.00397307 22.3895 0.0431223 22.545 0.131419 22.6772C0.219716 22.8094 0.345246 22.9124 0.492127 22.9733C0.639009 23.0341 0.800637 23.05 0.956566 23.019C1.1125 22.988 1.25572 22.9114 1.3681 22.7989L8.64368 15.5234C8.78109 15.3846 8.85817 15.1973 8.85817 15.002C8.85817 14.8067 8.78109 14.6194 8.64368 14.4806L1.3681 7.20505C1.29503 7.1305 1.20781 7.07129 1.11155 7.0309C1.01529 6.99051 0.911933 6.96976 0.807543 6.96985C0.593686 6.96984 0.388466 7.05425 0.236514 7.20474C0.0845616 7.35522 -0.00183992 7.5596 -0.00390618 7.77345Z" fill="#5268AD"/>
                    <path d="M31.7483 21.1407V8.87494H35.3861C39.3728 8.87494 41.8541 11.227 41.8541 15.0019C41.8541 18.7769 39.3728 21.1407 35.3861 21.1407H31.7483ZM33.7083 19.3845H35.4684C38.1615 19.3845 39.898 17.6676 39.898 15.0137C39.898 12.3598 38.1615 10.6429 35.4684 10.6429H33.7083V19.3845Z" fill="#1D2434"/>
                    <path d="M50.6116 21.3289C49.7807 21.3289 48.958 21.1653 48.1904 20.8473C47.4228 20.5293 46.7253 20.0633 46.1378 19.4758C45.5503 18.8883 45.0842 18.1908 44.7663 17.4232C44.4483 16.6556 44.2847 15.8328 44.2847 15.002C44.2847 14.1711 44.4483 13.3484 44.7663 12.5808C45.0842 11.8131 45.5503 11.1157 46.1378 10.5282C46.7253 9.94065 47.4228 9.47462 48.1904 9.15666C48.958 8.8387 49.7807 8.67505 50.6116 8.67505C51.4425 8.67505 52.2652 8.8387 53.0328 9.15666C53.8004 9.47462 54.4979 9.94065 55.0854 10.5282C55.6729 11.1157 56.139 11.8131 56.4569 12.5808C56.7749 13.3484 56.9385 14.1711 56.9385 15.002C56.9385 15.8328 56.7749 16.6556 56.4569 17.4232C56.139 18.1908 55.6729 18.8883 55.0854 19.4758C54.4979 20.0633 53.8004 20.5293 53.0328 20.8473C52.2652 21.1653 51.4425 21.3289 50.6116 21.3289ZM50.6116 10.4939C49.4485 10.5425 48.3492 11.0386 47.5434 11.8787C46.7376 12.7188 46.2877 13.8379 46.2877 15.002C46.2877 16.1661 46.7376 17.2851 47.5434 18.1252C48.3492 18.9653 49.4485 19.4615 50.6116 19.51C51.7972 19.4825 52.9253 18.9936 53.7561 18.1474C54.587 17.3012 55.055 16.1644 55.0608 14.9785C55.064 13.7942 54.5973 12.6571 53.7633 11.8164C52.9292 10.9758 51.7958 10.5002 50.6116 10.4939Z" fill="#1D2434"/>
                    <path d="M75.0569 8.87494H73.042V21.129H75.0569V8.87494Z" fill="#1D2434"/>
                    <path d="M82.4737 21.3289C81.1791 21.3185 79.9001 21.0451 78.7144 20.5253V18.7221C79.8919 19.2745 81.1731 19.5711 82.4737 19.5923C84.0417 19.5923 85.0883 18.875 85.0883 17.8126C85.0883 16.617 83.8104 16.1427 82.458 15.6409C80.3372 14.8569 78.7144 14.1004 78.7144 12.0933C78.7144 9.57274 80.9958 8.67505 82.9519 8.67505C84.0515 8.67577 85.1414 8.88046 86.1663 9.27874V11.0428C85.1268 10.6282 84.02 10.4077 82.9009 10.392C81.3957 10.392 80.7214 11.176 80.7214 11.96C80.7214 12.9988 81.8504 13.4144 83.1754 13.8926C85.4882 14.7276 87.2522 15.5429 87.2522 17.7342C87.2443 19.8589 85.2843 21.3289 82.4737 21.3289Z" fill="#1D2434"/>
                    <path d="M66.025 16.174L66.7895 15.8447C67.4406 15.5649 67.9958 15.1007 68.3865 14.5094C68.7773 13.9181 68.9865 13.2254 68.9886 12.5166C68.9886 10.3057 67.3971 8.87885 64.9353 8.87885H60.29V21.1407H62.2501V10.6115H64.7275C65.0213 10.5938 65.3156 10.6366 65.5921 10.7373C65.8687 10.8381 66.1216 10.9945 66.3352 11.1971C66.5487 11.3996 66.7184 11.6439 66.8336 11.9147C66.9488 12.1855 67.0072 12.4771 67.0051 12.7714C67.0038 13.0648 66.9432 13.3548 66.8268 13.624C66.7104 13.8933 66.5406 14.1362 66.3278 14.338C66.1149 14.5399 65.8634 14.6965 65.5884 14.7985C65.3133 14.9005 65.0205 14.9457 64.7275 14.9314H63.6848C63.2261 14.998 63.4653 15.39 63.4653 15.39L67.4206 21.1407H69.6354L66.025 16.174Z" fill="#1D2434"/>
                </g>
                <defs>
                    <clipPath id="clip0_163_263">
                        <rect width="87.2442" height="30" fill="white"/>
                    </clipPath>
                </defs>
            </>
        ),
    },
    {
        text: 'Apache Impala',
        key: 'impala',
        rule: 'impala://{hostname}:{port}/{database}',
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="0"
                y="0"
                width="100"
                height="100"
                xlinkHref="/assets/images/impala_logo.png"
            />
        ),
        assetSrc: '/assets/images/impala_logo.png',
    },
    {
        text: 'Amazon Athena',
        key: 'awsathena',
        rule: 'awsathena+rest://{aws_access_key_id}:{aws_secret_access_key}@athena.{region_name}.amazonaws.com/{',
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="0"
                y="0"
                width="100"
                height="100"
                xlinkHref="/assets/images/athena_logo.png"
            />
        ),
        assetSrc: '/assets/images/athena_logo.png',
    },
    {
        text: 'Amazon Redshift',
        key: 'redshift',
        rule: 'redshift+psycopg2://<userName>:<DBPassword>@<AWS End Point>:5439/<Database Name>',
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="0"
                y="0"
                width="100"
                height="100"
                xlinkHref="/assets/images/redshift_logo.png"
            />
        ),
        assetSrc: '/assets/images/redshift_logo.png',
    },
    {
        text: 'Amazon Spark SQL',
        key: 'sparksql',
        rule: 'hive://hive@{hostname}:{port}/{database}',
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="0"
                y="0"
                width="100"
                height="100"
                xlinkHref="/assets/images/spark_logo.png"
            />
        ),
        assetSrc: '/assets/images/spark_logo.png',
    },
    {
        text: 'Apache Hive',
        key: 'hive',
        rule: 'hive://hive@{hostname}:{port}/{database}',
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="0"
                y="0"
                width="100"
                height="100"
                xlinkHref="/assets/images/hive_logo.png"
            />
        ),
        assetSrc: '/assets/images/hive_logo.png',
    },
    {
        text: 'SQL Server',
        key: 'sqlserver',
        rule: 'mssql://',
        requiredSchema: true,
        iconSvg: (
            <image
                role="presentation"
                aria-hidden
                x="0"
                y="0"
                width="100"
                height="100"
                xlinkHref="/assets/images/sqlserver_logo.png"
            />
        ),
        assetSrc: '/assets/images/sqlserver_logo.png',
    },
] as Array<
    & IDropdownOption
    & {
        key: SupportedDatabaseType;
        iconSvg?: JSX.Element;
        rule: string;
        assetSrc?: string;
        /** @default true */
        hasDatabase?: boolean;
        /** @default true */
        databaseEnumerable?: boolean;
        /** @default false */
        requiredSchema?: boolean;
        /** @default true */
        schemaEnumerable?: boolean;
        /** @default true */
        hasTableList?: boolean;
        /** @default true */
        tableEnumerable?: boolean;
    }
>).sort((a, b) => a.text.localeCompare(b.text));

registerIcons({
    icons: Object.fromEntries(
        datasetOptions.map<[string, JSX.Element]>(opt => [
            opt.key,
            <svg
                viewBox="0 0 100 100"
                role="presentation"
                aria-hidden
                focusable="false"
                style={{
                    width: '20px',
                    height: '20px',
                }}
            >
                {opt.iconSvg}
            </svg>
        ])
    ),
});

export type TableDataType = 'Int64';

export type TableLabels = {
    key: string;
    colIndex: number;
    dataType: TableDataType | string | null;
}[];

type TableRowItem<TL extends TableLabels> = {
    [key in keyof TL]: any
};

export interface TableData<TL extends TableLabels = TableLabels> {
    columns: TL;
    rows: TableRowItem<TL>[];
}

interface DatabaseDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[]) => void;
    setLoadingAnimation: (on: boolean) => void;
}

export type DatabaseOptions = [
    sourceType: SupportedDatabaseType,
    connectUri: string,
    sourceId: 'pending' | number | null,
    databaseList: string[] | 'input' | null,
    selectedDatabase: string | null,
    schemaList: 'pending' | 'input' | string[] | null,
    selectedSchema: string | null,
    tableList: 'pending' | 'input' | string[] | null,
    selectedTable: string | null,
    tablePreview: 'pending' | TableData<TableLabels>,
    queryString: string,
];

type Others<T extends any[]> = T extends [any, ...infer P] ? P : never;

type PartialArrayAsProgress<T extends any[]> = T extends { [1]: any } ? (
    [T[0]] | [T[0], ...PartialArrayAsProgress<Others<T>>]
) : T extends { [0]: any } ? (
    T
) : [];

type PartialDatabaseOptions = PartialArrayAsProgress<DatabaseOptions>;

const inputWidth = '180px';
const FETCH_THROTTLE_SPAN = 600;

const renderDropdownTitle: React.FC<typeof datasetOptions | undefined> = ([item]) => {
    if (!item) {
        return null;
    }

    const { iconSvg, text, key } = item;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
            }}
        >
            <Icon
                iconName={iconSvg ? key : 'database'}
                role="presentation"
                aria-hidden
                title={text}
                style={{
                    lineHeight: '20px',
                    width: '20px',
                    height: '20px',
                    textAlign: 'center',
                    marginInlineEnd: '8px',
                    overflow: 'hidden',
                }}
            />
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </div>
    );
};

const renderDropdownItem: React.FC<typeof datasetOptions[0] | undefined> = props => {
    if (!props) {
        return null;
    }

    const { iconSvg, text, key } = props;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
            }}
        >
            <Icon
                iconName={iconSvg ? key : 'database'}
                role="presentation"
                aria-hidden
                title={text}
                style={{
                    width: '20px',
                    height: '20px',
                    textAlign: 'center',
                    marginInlineEnd: '8px',
                    overflow: 'hidden',
                }}
            />
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </div>
    );
};

const DatabaseData: React.FC<DatabaseDataProps> = ({ onClose, onDataLoaded, setLoadingAnimation }) => {
    const [progress, setOptions] = useState<PartialDatabaseOptions>(['mysql']);
    const [
        sourceType,
        connectUri,
        sourceId,
        databaseList,
        selectedDatabase,
        schemaList,
        selectedSchema,
        tableList,
        selectedTable,
        tablePreview,
        queryString,
    ] = progress;

    // prefetch icons
    useEffect(() => {
        datasetOptions.forEach(({ assetSrc }) => {
            if (assetSrc) {
                prefetch(assetSrc);
            }
        });
    }, []);

    const whichDatabase = datasetOptions.find(which => which.key === sourceType)!;

    useEffect(() => {
        setLoadingAnimation(false);

        return () => setLoadingAnimation(false);
    }, [setLoadingAnimation]);

    const handleConnectionTest = useCallback(async () => {
        if (sourceType && connectUri && sourceId === undefined) {
            setOptions([sourceType, connectUri, 'pending']);
            setLoadingAnimation(true);

            const sId = await getSourceId(sourceType, connectUri);

            if (whichDatabase.hasDatabase === false) {
                setOptions(prevOpt => {
                    const [sType, cUri, sIdFlag] = prevOpt;

                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [sourceType, connectUri, sId, null, null];
                    }

                    return prevOpt;
                });

                setLoadingAnimation(false);

                return;
            } else if (whichDatabase.databaseEnumerable === false) {
                setOptions(prevOpt => {
                    const [sType, cUri, sIdFlag] = prevOpt;

                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [sourceType, connectUri, sId, 'input'];
                    }

                    return prevOpt;
                });

                setLoadingAnimation(false);

                return;
            }

            const databases = typeof sId === 'number' ? await listDatabases(sId) : null;

            if (databases) {
                setOptions(prevOpt => {
                    const [sType, cUri, sIdFlag] = prevOpt;

                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [sourceType, connectUri, sId, databases];
                    }

                    return prevOpt;
                });
            } else {
                setOptions(prevOpt => {

                    const [sType, cUri, sIdFlag] = prevOpt;
                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [sourceType, connectUri, null];
                    }
        
                    return prevOpt;
                });
            }

            setLoadingAnimation(false);
        }
    }, [sourceType, connectUri, sourceId, setLoadingAnimation, whichDatabase.hasDatabase, whichDatabase.databaseEnumerable]);

    // automatically fetch schema list when selected database changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList === undefined) {
            if (whichDatabase.requiredSchema) {
                if (whichDatabase.schemaEnumerable === false) {
                    setOptions([sourceType, connectUri, sourceId, databaseList, selectedDatabase, 'input']);
                    
                    return;
                }

                setOptions([sourceType, connectUri, sourceId, databaseList, selectedDatabase, 'pending']);
                setLoadingAnimation(true);
                
                listSchemas(sourceId, selectedDatabase).then(schemas => {
                    if (schemas) {
                        setOptions(([sType, cUri, sId, dbList, curDb]) => {
                            return [sType, cUri, sId, dbList, curDb, schemas] as PartialDatabaseOptions;
                        });
                    } else {
                        setOptions(([sType, cUri, sId, dbList]) => {
                            return [sType, cUri, sId, dbList] as PartialDatabaseOptions;
                        });
                    }
                }).finally(() => {
                    setLoadingAnimation(false);
                });
            } else {
                setOptions([
                    sourceType, connectUri, sourceId, databaseList, selectedDatabase, null, null
                ]);
            }
        }
    }, [sourceId, connectUri, sourceType, databaseList, whichDatabase, selectedDatabase, schemaList, setLoadingAnimation]);

    // automatically fetch table list when selected schema changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && (schemaList === null || schemaList === 'input' || Array.isArray(schemaList)) && selectedDatabase !== undefined && selectedSchema !== undefined && tableList === undefined) {
            if (whichDatabase.hasTableList === false) {
                setOptions([
                    sourceType,
                    connectUri,
                    sourceId,
                    databaseList,
                    selectedDatabase,
                    schemaList,
                    selectedSchema,
                    null,
                    null,
                ]);

                return;
            } else if (whichDatabase.tableEnumerable === false) {
                setOptions([
                    sourceType,
                    connectUri,
                    sourceId,
                    databaseList,
                    selectedDatabase,
                    schemaList,
                    selectedSchema,
                    'input',
                ]);

                return;
            }

            setOptions([
                sourceType,
                connectUri,
                sourceId,
                databaseList,
                selectedDatabase,
                schemaList,
                selectedSchema,
                'pending'
            ]);
            setLoadingAnimation(true);
            
            listTables(sourceId, selectedDatabase, selectedSchema).then(tables => {
                if (tables) {
                    setOptions(([sType, cUri, sId, dbList, curDb, smList, curSm]) => {
                        return [sType, cUri, sId, dbList, curDb, smList, curSm, tables] as PartialDatabaseOptions;
                    });
                } else {
                    setOptions(([sType, cUri, sId, dbList, curDb, smList]) => {
                        return [sType, cUri, sId, dbList, curDb, smList] as PartialDatabaseOptions;
                    });
                }
            }).finally(() => {
                setLoadingAnimation(false);
            });
        }
    }, [sourceType, connectUri, sourceId, databaseList, selectedDatabase, schemaList, selectedSchema, setLoadingAnimation, tableList, whichDatabase.hasTableList, whichDatabase.tableEnumerable]);

    let lastInputTimeRef = useRef(0);
    let throttledRef = useRef<NodeJS.Timeout | null>(null);

    // automatically fetch table preview when selected table changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && (schemaList === null || schemaList === 'input' || Array.isArray(schemaList)) && tableList !== undefined && selectedDatabase !== undefined && selectedSchema !== undefined && selectedTable !== undefined) {
            setOptions([
                sourceType,
                connectUri,
                sourceId,
                databaseList,
                selectedDatabase,
                schemaList,
                selectedSchema,
                tableList,
                selectedTable,
                'pending'
            ]);
            setLoadingAnimation(true);

            const autoPreview = () => {
                fetchTablePreview(sourceId, selectedDatabase, selectedSchema, selectedTable, !(whichDatabase.tableEnumerable ?? true)).then(data => {
                    if (data) {
                        setOptions(([sType, cUri, sId, dbList, curDb, smList, curSm, tList, curT]) => {
                            return [
                                sType, cUri, sId, dbList, curDb, smList, curSm, tList, curT, data, `select * from ${selectedTable || '<table_name>'}`
                            ] as PartialDatabaseOptions;
                        });
                    } else {
                        setOptions(([sType, cUri, sId, dbList, curDb, smList, curSm, tList]) => {
                            return [sType, cUri, sId, dbList, curDb, smList, curSm, tList] as PartialDatabaseOptions;
                        });
                    }
                }).finally(() => {
                    throttledRef.current = null;
                    setLoadingAnimation(false);
                });
            };

            if (Date.now() - lastInputTimeRef.current < FETCH_THROTTLE_SPAN) {
                if (throttledRef.current !== null) {
                    clearTimeout(throttledRef.current);
                }

                throttledRef.current = setTimeout(autoPreview, FETCH_THROTTLE_SPAN);
            } else {
                autoPreview();
            }
        }
    }, [sourceType, connectUri, sourceId, databaseList, selectedDatabase, schemaList, selectedSchema, tableList, selectedTable, setLoadingAnimation, whichDatabase.tableEnumerable]);

    const databaseSelector: IDropdownOption[] | null = useMemo(() => {
        return databaseList === 'input' ? null : databaseList?.map<IDropdownOption>(
            dbName => ({
                text: dbName,
                key: dbName,
            })
        ) ?? null;
    }, [databaseList]);

    const schemaSelector: IDropdownOption[] | null = useMemo(() => {
        if (whichDatabase.requiredSchema && Array.isArray(schemaList)) {
            return schemaList.map<IDropdownOption>(
                dbName => ({
                    text: dbName,
                    key: dbName,
                })
            ) ?? [];
        }

        return null;
    }, [whichDatabase, schemaList]);

    const tableSelector: IDropdownOption[] | null = useMemo(() => {
        if (Array.isArray(tableList)) {
            return tableList.map<IDropdownOption>(
                tName => ({
                    text: tName,
                    key: tName,
                })
            ) ?? [];
        }

        return null;
    }, [tableList]);

    const [isQuerying, setQuerying] = useState(false);

    const query = useCallback(() => {
        if (isQuerying) {
            return;
        }

        if (typeof sourceId === 'number' && typeof selectedTable === 'string' && queryString) {
            setLoadingAnimation(true);
    
            setQuerying(true);

            requestSQL(sourceId, queryString).then(data => {
                if (data) {
                    const { dataSource, fields } = data;
                    
                    logDataImport({
                        dataType: `Database/${sourceType}`,
                        name: [selectedDatabase, selectedSchema, selectedTable].filter(
                            Boolean
                        ).join('.'),
                        fields,
                        dataSource: [],
                        size: dataSource.length,
                    });

                    onDataLoaded(fields, dataSource);

                    onClose();
                }
            }).finally(() => {
                setQuerying(false);
                setLoadingAnimation(false);
            });
        }
    }, [isQuerying, sourceId, selectedTable, queryString, setLoadingAnimation, sourceType, selectedDatabase, selectedSchema, onDataLoaded, onClose]);

    return (
        <Stack>
            <Progress
                progress={progress}
            />
            {
                typeof sourceId !== 'number' && (
                    <Stack horizontal style={{ alignItems: 'flex-end' }}>
                        <Dropdown
                            label={intl.get('dataSource.connectUri')}
                            title={intl.get('dataSource.databaseType')}
                            ariaLabel={intl.get('dataSource.databaseType')}
                            required
                            styles={{
                                dropdown: {
                                    width: '13.6em',
                                    borderRadius: '2px 0 0 2px',
                                },
                                dropdownItems: {
                                    paddingBlockStart: '6px',
                                    paddingBlockEnd: '6px',
                                    maxHeight: '20vh',
                                    overflowY: 'scroll',
                                },
                                dropdownItemSelected: {
                                    position: 'static',
                                    minHeight: '2.2em',
                                },
                                dropdownItem: {
                                    position: 'static',
                                    minHeight: '2.2em',
                                },
                            }}
                            options={datasetOptions}
                            selectedKey={sourceType}
                            onRenderOption={renderDropdownItem as (e?: IDropdownOption) => JSX.Element}
                            onRenderTitle={renderDropdownTitle as (e?: IDropdownOption[]) => JSX.Element}
                            onChange={(_, item) => {
                                if (item) {
                                    setOptions([item.key as SupportedDatabaseType]);
                                }
                            }}
                        />
                        <TextField
                            name={`connectUri:${whichDatabase.key}`}
                            title={intl.get('dataSource.connectUri')}
                            aria-required
                            value={connectUri ?? ''}
                            placeholder={whichDatabase.rule}
                            errorMessage={
                                sourceId === null
                                    ? intl.get('dataSource.btn.connectFailed')
                                    : undefined
                            }
                            onChange={(_, uri) => {
                                if (typeof uri === 'string') {
                                    setOptions([sourceType, uri]);
                                } else {
                                    setOptions([sourceType]);
                                }
                            }}
                            onKeyPress={e => {
                                if (e.key === 'Enter' && !(!Boolean(connectUri) || sourceId === 'pending' || sourceId === null)) {
                                    handleConnectionTest();
                                }
                            }}
                            styles={{
                                root: {
                                    position: 'relative',
                                    marginRight: '1em',
                                    flexGrow: 1,
                                    flexShrink: 1,
                                },
                                fieldGroup: {
                                    borderLeft: 'none',
                                    borderRadius: '0 4px 4px 0',
                                },
                                // 如果错误信息被插入到下方，
                                // static 定位时会导致布局被向上顶开.
                                errorMessage: {
                                    position: 'absolute',
                                    paddingBlock: '5px',
                                    paddingInlineStart: '1em',
                                    bottom: '100%',
                                },
                            }}
                        />
                        <PrimaryButton
                            text={intl.get('dataSource.btn.connect')}
                            disabled={
                                !Boolean(connectUri)
                                || sourceId === 'pending'
                                || sourceId === null
                            }
                            onClick={handleConnectionTest}
                        />
                    </Stack>
                )
            }
            {
                typeof sourceId === 'number' && (
                    <>
                        <Stack
                            tokens={StackTokens}
                            horizontal
                            style={{
                                marginBlockStart: '1.2em',
                                marginBlockEnd: '0.8em',
                                alignItems: 'center',
                            }}
                        >
                            <TextField
                                readOnly
                                value={connectUri}
                                tabIndex={-1}
                                styles={{
                                    root: {
                                        flexGrow: 1,
                                    },
                                }}
                            />
                            <DefaultButton
                                text={intl.get('dataSource.btn.reset')}
                                style={{
                                    marginInlineStart: '1em',
                                    marginInlineEnd: '0',
                                    paddingInline: '0.6em',
                                    fontSize: '70%',
                                }}
                                onClick={() => setOptions([sourceType])}
                            />
                        </Stack>
                        <Stack horizontal tokens={StackTokens}>
                            {
                                databaseList !== null && databaseList !== undefined && (
                                    databaseSelector ? (
                                        <Dropdown
                                            label={intl.get('dataSource.databaseName')}
                                            style={{ width: inputWidth }}
                                            options={databaseSelector}
                                            selectedKey={selectedDatabase}
                                            required
                                            onChange={(_, item) => {
                                                if (item && typeof connectUri === 'string' && databaseList) {
                                                    setOptions([
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        item.key as string,
                                                    ]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <TextField
                                            name="databaseName"
                                            label={intl.get('dataSource.databaseName')}
                                            style={{ width: inputWidth }}
                                            value={selectedDatabase as string | undefined}
                                            required
                                            onChange={(_, key) => {
                                                lastInputTimeRef.current = Date.now();
                                                
                                                if (typeof key === 'string' && typeof connectUri === 'string' && databaseList) {
                                                    setOptions([
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        key,
                                                    ]);
                                                }
                                            }}
                                        />
                                    )
                                )
                            }
                            {
                                schemaList !== null && schemaList !== undefined && schemaList !== 'pending' && (
                                    schemaSelector ? (
                                        <Dropdown
                                            label={intl.get('dataSource.schemaName')}
                                            style={{ width: inputWidth }}
                                            options={schemaSelector}
                                            selectedKey={selectedSchema}
                                            required
                                            onChange={(_, item) => {
                                                if (item && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList) {
                                                    setOptions([
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        item.key as string,
                                                    ]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <TextField
                                            name="schemaName"
                                            label={intl.get('dataSource.schemaName')}
                                            style={{ width: inputWidth }}
                                            value={selectedSchema as string | undefined}
                                            required
                                            onChange={(_, key) => {
                                                lastInputTimeRef.current = Date.now();
                                                
                                                if (typeof key === 'string' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList) {
                                                    setOptions([
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        key,
                                                    ]);
                                                }
                                            }}
                                        />
                                    )
                                )
                            }
                            {
                                tableList !== null && tableList !== undefined && tableList !== 'pending' && (
                                    tableSelector ? (
                                        <Dropdown
                                            label={intl.get('dataSource.tableName')}
                                            style={{ width: inputWidth }}
                                            options={tableSelector}
                                            selectedKey={selectedTable}
                                            required
                                            onChange={(_, item) => {
                                                if (item && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && (schemaList === null || Array.isArray(schemaList)) && selectedSchema !== undefined && tableList) {
                                                    setOptions([
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        selectedSchema,
                                                        tableList,
                                                        item.key as string,
                                                    ]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <TextField
                                            name="tableName"
                                            label={intl.get('dataSource.tableName')}
                                            style={{ width: inputWidth }}
                                            value={selectedTable as string | undefined}
                                            required
                                            onChange={(_, key) => {
                                                lastInputTimeRef.current = Date.now();
                                                
                                                if (typeof key === 'string' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && (schemaList === null || schemaList === 'input' || Array.isArray(schemaList)) && selectedSchema !== undefined && tableList) {
                                                    setOptions([
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        selectedSchema,
                                                        tableList,
                                                        key,
                                                    ]);
                                                }
                                            }}
                                        />
                                    )
                                )
                            }
                        </Stack>
                        {
                            typeof tablePreview === 'object' && (
                                <Stack tokens={StackTokens} style={{ marginBlockStart: '0.35em' }}>
                                    <Label>
                                        {intl.get('dataSource.preview')}
                                    </Label>
                                    <TablePreview
                                        data={tablePreview}
                                    />
                                    <Stack
                                        horizontal
                                        style={{
                                            alignItems: 'flex-end',
                                            marginBlockEnd: '10px',
                                        }}
                                    >
                                        <TextField
                                            name="query_string"
                                            label={intl.get('dataSource.query')}
                                            required
                                            readOnly={isQuerying}
                                            placeholder={`select * from ${selectedTable || '<table_name>'}`}
                                            value={queryString}
                                            styles={{
                                                root: {
                                                    flexGrow: 1,
                                                },
                                            }}
                                            onChange={(_, sql) => {
                                                if (typeof sql === 'string' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && (schemaList === null || Array.isArray(schemaList)) && selectedSchema !== undefined && (tableList !== undefined && tableList !== 'pending') && selectedTable !== undefined && tablePreview) {
                                                    setOptions([
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        selectedSchema,
                                                        tableList,
                                                        selectedTable,
                                                        tablePreview,
                                                        sql,
                                                    ]);
                                                }
                                            }}
                                            onKeyPress={e => {
                                                if (e.key === 'Enter') {
                                                    query();
                                                }
                                            }}
                                        />
                                        <PrimaryButton
                                            text={intl.get('dataSource.btn.query')}
                                            disabled={isQuerying || !(typeof sourceId === 'number' && typeof selectedTable === 'string' && queryString)}
                                            autoFocus
                                            onClick={query}
                                            style={{
                                                marginInline: '10px',
                                            }}
                                        />
                                    </Stack>
                                </Stack>
                            )
                        }
                    </>
                )
            }
        </Stack>
    );
};


export default observer(DatabaseData);
