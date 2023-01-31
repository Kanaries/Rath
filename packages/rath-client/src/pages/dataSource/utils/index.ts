import { Sampling } from 'visual-insights';
import { FileReader as KFileReader } from '@kanaries/web-data-loader'
import intl from 'react-intl-universal';
import { useMemo } from "react";
import * as xlsx from 'xlsx';
import { STORAGE_FILE_SUFFIX } from "../../../constants";
import { FileLoader } from "../../../utils";
import { IMuteFieldBase, IRow } from "../../../interfaces";
import { IRathStorage, RathStorageParse } from "../../../utils/storage";
import { workerService } from "../../../services/index";


/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import FileDataTransformWorker from './transFileData.worker?worker';

export enum SampleKey {
  none = 'none',
  reservoir = 'reservoir',
}

export const useSampleOptions = function () {
    const noneText = intl.get(`dataSource.sampling.${SampleKey.none}`);
    const reservoirText = intl.get(`dataSource.sampling.${SampleKey.reservoir}`);
    const options = useMemo(() => {
        return [
            {
                key: SampleKey.none,
                text: noneText,
            },
            {
                key: SampleKey.reservoir,
                text: reservoirText,
            },
        ];
    }, [noneText, reservoirText])
    return options;
}

export async function rawData2DataWithBaseMetas (rawData: IRow[]): Promise<{
    fields: IMuteFieldBase[];
    dataSource: IRow[]
}> {
    const worker = new FileDataTransformWorker()
    const res = await workerService<{
            fields: IMuteFieldBase[];
            dataSource: IRow[]
        }, IRow[]>(worker, rawData);
    if (res.success) {
        return res.data;
    } else {
        throw new Error(res.message)
    }
}

export const readRaw = (file: File, encoding?: string, limit?: number, rowLimit?: number, colLimit?: number): Promise<string | null> => {
    const fr = new FileReader();
    fr.readAsText(file, encoding);
    return new Promise<string | null>(resolve => {
        fr.onload = () => {
            let text = fr.result as string | null;
            if (typeof text === 'string') {
                if (limit) {
                    text = text.slice(0, limit);
                }
                if (rowLimit || colLimit) {
                    text = text.split('\n').slice(0, rowLimit).map(row => row.slice(0, colLimit)).join('\n');
                }
                return resolve(text);
            } else {
                return resolve(text);
            }
        };
        fr.onerror = () => resolve(null);
    });
};

interface LoadDataFileProps {
    file: File;
    sampleMethod: SampleKey;
    sampleSize?: number;
    encoding?: string;
    onLoading?: (progress: number) => void;
    separator: string;
}
export async function loadDataFile(props: LoadDataFileProps): Promise<{
    fields: IMuteFieldBase[];
    dataSource: IRow[]
}> {
    const {
        file,
        sampleMethod,
        sampleSize = 500,
        encoding = 'utf-8',
        onLoading,
        separator,
    } = props;
    /**
     * tmpFields is fields cat by specific rules, the results is not correct sometimes, waitting for human's input
     */
    let rawData: IRow[] = []

    if (file.type.match(/^text\/.*/)) {     // csv-like text files
        if (separator && separator !== ',') {
            const content = (await readRaw(file, encoding) ?? '');
            const rows = content.split(/\r?\n/g).map(row => row.split(separator));
            const fields = rows[0]?.map<IMuteFieldBase>((h, i) => ({
                fid: `col_${i + 1}`,
                name: h,
                geoRole: '?',
                analyticType: '?',
                semanticType: '?',
            }));
            const dataSource = rows.slice(1).map<IRow>(row => Object.fromEntries(fields.map((f, i) => [f.fid, row[i]])));
            return { fields, dataSource };
        }
        if (sampleMethod === SampleKey.reservoir) {
            rawData = (await KFileReader.csvReader({
              file,
              encoding,
              config: {
                type: 'reservoirSampling',
                size: sampleSize,
              },
              onLoading
            })) as IRow[]
        } else {
            rawData = (await KFileReader.csvReader({
              file,
              encoding,
              onLoading
            })) as IRow[]
        }
    } else if (file.type === 'application/json') {
        rawData = await FileLoader.jsonLoader(file)
        if (sampleMethod === SampleKey.reservoir) {
            rawData = Sampling.reservoirSampling(rawData, sampleSize)
        }
    } else {
        throw new Error(`unsupported file type=${file.type} `)
    }
    const dataset = await rawData2DataWithBaseMetas(rawData);
    return dataset
}

export const isExcelFile = (file: File): boolean => {
    return [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',    // xlsx
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12',                // xlsb
        'application/vnd.ms-excel',                                             // xls
        'application/vnd.ms-excel.sheet.macroEnabled.12',                       // xlsm
    ].includes(file.type);
};

export const parseExcelFile = async (file: File) => {
    const content = await FileLoader.binaryLoader(file);
    const data = xlsx.read(content);
    return data;
};

export const loadExcelRaw = async (data: Awaited<ReturnType<typeof parseExcelFile>>, sheetIdx: number, limit?: number, rowLimit?: number, colLimit?: number): Promise<string> => {
    const sheet = data.SheetNames[sheetIdx];
    const worksheet = data.Sheets[sheet];
    const csvData = xlsx.utils.sheet_to_csv(worksheet, { skipHidden: true });   // more options available here
    let text = csvData;
    if (limit) {
        text = text.slice(0, limit);
    }
    if (rowLimit || colLimit) {
        text = text.split('\n').slice(0, rowLimit).map(row => row.slice(0, colLimit)).join('\n');
    }
    return text;
};

export const loadExcelFile = async (
    data: Awaited<ReturnType<typeof parseExcelFile>>, sheetIdx: number, encoding: string,
    range?: [[number, number], [number, number]],
): Promise<{
    fields: IMuteFieldBase[];
    dataSource: IRow[];
}> => {
    const sheet = data.SheetNames[sheetIdx];
    const worksheet = data.Sheets[sheet];
    const copy = range ? { ...worksheet } : worksheet;
    if (range) {
        copy['!ref'] = xlsx.utils.encode_range({
            s: { r: range[0][0], c: range[0][1] },
            e: { r: range[1][0], c: range[1][1] },
        });
    }
    const csvData = xlsx.utils.sheet_to_csv(copy, { skipHidden: true });   // more options available here
    const csvFile = new File([new Blob([csvData], { type: 'text/plain' })], 'file.csv');
    const rawData = (await KFileReader.csvReader({
        file: csvFile,
        encoding,
    })) as IRow[];
    return await rawData2DataWithBaseMetas(rawData);
};

export async function loadRathStorageFile (file: File): Promise<IRathStorage> {
    // FIXME file type
    if (file.name.split('.').slice(-1)[0] === STORAGE_FILE_SUFFIX) {
        const rawContent = await FileLoader.textLoader(file);
        return RathStorageParse(rawContent);
    } else {
        throw new Error(`file type not supported: ${file.name.split('.').slice(-1)[0]}`)
    }
}
