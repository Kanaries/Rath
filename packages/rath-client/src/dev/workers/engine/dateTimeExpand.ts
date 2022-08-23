import { IRow } from "visual-insights";
import { IMuteFieldBase } from "rath-client/src/interfaces";

interface DateTimeInfo {
    utime?: number; // unix timestamp
    $y?: number; // Year
    $M?: number; // Month - starts from 1
    $D?: number; // Day - starts from 1
    $L?: string; // Locale
    $W?: number; // Week
    $H?: number; // Hour
    $m?: number; // minute
    $s?: number; // second
    $ms?: number; // milliseconds
}
const dateTimeDict = new Map<string, string>([
    ['utime', 'utime'],
    ['$y', 'year'],
    ['$M', 'month'],
    ['$D', 'date'],
    ['$L', 'locale'],
    ['$W', 'weekday'],
    ['$H', 'hour'],
    ['$m', 'min'],
    ['$s', 'sec'],
    ['$ms', 'ms']
])

const REGEX_PARSE = /^(\d{2,4})[-/](\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/
function Date2Info(date: Date): DateTimeInfo {
    return {
        utime: date.getTime(),
        $y: date.getUTCFullYear(),
        $M: date.getUTCMonth() + 1,
        $D: date.getUTCDate(),
        $W: date.getUTCDay(),
        $H: date.getUTCHours(),
        $m: date.getUTCMinutes(),
        $s: date.getUTCSeconds(),
        $ms: date.getUTCMilliseconds(),
        $L: ""
    }
}
function parseDateTime(dateTime: string): DateTimeInfo {
    try {
        if (dateTime === null) return UnknownDateTimeInfo;
        if (dateTime === undefined) {
            let date = new Date()
            return Date2Info(date)
        }
        if (!/Z$/i.test(dateTime)) {
            const match = dateTime.match(REGEX_PARSE)
            if (match) {
                let $y, $M, $D, $W, $H, $m, $s, $ms
                if (match[1]) $y = parseInt(match[1])
                else throw new Error("[parseDateTime]: Missing 'Year' in dateTime string")
                if (match[2]) $M = parseInt(match[2])
                else $M = undefined
                if (match[3]) $D = parseInt(match[3])
                else $D = undefined
                if (match[4]) $H = parseInt(match[4])
                else $H = undefined
                if (match[5]) $m = parseInt(match[5])
                else $m = undefined
                if (match[6]) $s = parseInt(match[6])
                else $s = undefined
                if (match[7]) $ms = parseInt(match[7].substring(0, 3))
                else $ms = undefined
                let dateTime = new Date(Date.UTC($y, ($M || 1) - 1, $D || 1, $H || 0, $m || 0, $s || 0, $ms || 0))
                let utime = dateTime.getTime();
                if (match[1] && match[2] && match[3]) {
                    $W = dateTime.getUTCDay()
                }
                return {
                    utime: utime,
                    $y: $y,
                    $M: $M,
                    $D: $D,
                    $W: $W,
                    $H: $H,
                    $m: $m,
                    $s: $s,
                    $ms: $ms
                } as DateTimeInfo
            }
        }
        // Polyfill
        return Date2Info(new Date(dateTime))
    }
    catch(error) {
        console.warn(error)
        return UnknownDateTimeInfo
    }
}

interface DateTimeInfoArray {
    utime?: any[]; // unix timestamp
    $y?: any[]; // Year
    $M?: any[]; // Month - starts from 0
    $D?: any[]; // Day - starts from 1
    $W?: any[]; // Week
    $H?: any[]; // Hour
    $m?: any[]; // minute
    $s?: any[]; // second
    $ms?: any[]; // milliseconds
    $L?: any[]; // Locale
}
const UnknownDateTimeInfo: DateTimeInfo = {}

type InfoArrayType = keyof DateTimeInfoArray
type InfoType = keyof DateTimeInfo
function parseDateTimeArray(dateTime: string[]): DateTimeInfoArray {
    // TODO: Polyfills: 中文格式等
    let infoArray = {} as DateTimeInfoArray
    for (let i = 0; i < dateTime.length; ++i) {
        let info = parseDateTime(dateTime[i])
        Object.keys(info).forEach(key => {
            let infoKey = key as InfoType, infoArrayKey = key as InfoArrayType
            if (info[infoKey] !== undefined && info[infoKey] !== "") {
                if (infoArray[infoArrayKey] === undefined) {
                    infoArray[infoArrayKey] = new Array<any>(dateTime.length)
                }
                (infoArray[infoArrayKey] as any[])[i] = info[infoKey]
            }
        })
    }
    return infoArray
}

export function dateTimeExpand(props: { dataSource: IRow[]; fields: IMuteFieldBase[] })
    : { dataSource: IRow[]; fields: IMuteFieldBase[] } {
    const { dataSource, fields } = props;

    let extFields: IMuteFieldBase[] = []
    let fieldIds = new Set(fields.map(f => (f.extInfo && f.extInfo?.extInfo === "dateTimeExpand") ? f.fid : ''))
    fields.forEach(field => {
        extFields.push(field)
        if (field.semanticType === 'temporal' && !fieldIds.has(field.fid)) {
            let dateTime = dataSource.map(item => item[field.fid])
            let moment: DateTimeInfoArray = parseDateTimeArray(dateTime)
            Object.keys(moment).forEach(key => {
                let extField: IMuteFieldBase = {
                    fid: `${field.fid}_${key}`,
                    name: `${field.name}.${dateTimeDict.get(key)}`,
                    analyticType: 'dimension',
                    semanticType: 'ordinal',
                    geoRole: 'none',
                    extInfo: {
                        extFrom: [field.fid],
                        extOpt: 'dateTimeExpand',
                        extInfo: `${key}.value`
                    }
                }
                extFields.push(extField)
                let infoArray = moment[key as InfoArrayType] as any[]
                for (let i = 0; i < dataSource.length; ++i) {
                    dataSource[i][extField.fid] = infoArray[i]
                }
            })
        }
    })
    return {
        dataSource: dataSource,
        fields: extFields
    }
}
