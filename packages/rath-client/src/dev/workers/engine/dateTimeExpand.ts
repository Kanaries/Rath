import { IAnalyticType, IRow, ISemanticType } from "visual-insights";
import { IGeoRole, IMuteFieldBase, IRawField } from "rath-client/src/interfaces";
import { field } from "vega";

class Knowable<T> {
    value: T;
    known: boolean;
    constructor(type: { new(): T; }, val: T|undefined = undefined) {
        if (val === undefined) {
            this.value = new type();
            this.known = false
        }
        else {
            this.value = val
            this.known = true
        }
    }
    set(val: T) {
        this.known = true
        this.value = val
    }
}
interface DateTimeInfo {
    utime: Knowable<Number>; // unix timestamp
    $y:  Knowable<Number>; // Year
    $M:  Knowable<Number>; // Month - starts from 1
    $D:  Knowable<Number>; // Day - starts from 1
    $L:  Knowable<String>; // Locale
    $W:  Knowable<Number>; // Week
    $H:  Knowable<Number>; // Hour
    $m:  Knowable<Number>; // minute
    $s:  Knowable<Number>; // second
    $ms: Knowable<Number>; // milliseconds
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
        utime: new Knowable(Number, date.getTime()      ),
        $y:  new Knowable(Number, date.getUTCFullYear()    ),
        $M:  new Knowable(Number, date.getUTCMonth()+1     ),
        $D:  new Knowable(Number, date.getUTCDate()        ),
        $W:  new Knowable(Number, date.getUTCDay()         ),
        $H:  new Knowable(Number, date.getUTCHours()       ),
        $m:  new Knowable(Number, date.getUTCMinutes()     ),
        $s:  new Knowable(Number, date.getUTCSeconds()     ),
        $ms: new Knowable(Number, date.getUTCMilliseconds()),
        $L:  new Knowable(String)
    }
}
function parseDateTime(dateTime: string): DateTimeInfo {
    if (dateTime === null) return {} as DateTimeInfo
    if (dateTime === undefined) {
        let date = new Date()
        return Date2Info(date)
    }
    if (!/Z$/i.test(dateTime)) {
        const match = dateTime.match(REGEX_PARSE)
        if (match) {
            let $y, $M, $D, $H, $m, $s, $ms
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
            let utime = dateTime.getTime(), $W;
            if (match[1] && match[2] && match[3]) {
                $W = dateTime.getUTCDay()
            }
            return {
                utime: new Knowable(Number, utime),
                $y:  new Knowable(Number, $y),
                $M:  new Knowable(Number, $M),
                $D:  new Knowable(Number, $D),
                $W:  new Knowable(Number, $W),
                $H:  new Knowable(Number, $H),
                $m:  new Knowable(Number, $m),
                $s:  new Knowable(Number, $s),
                $ms: new Knowable(Number, $ms),
                $L:  new Knowable(String, undefined)
            } as DateTimeInfo
        }
    }
    // Polyfill
    return Date2Info(new Date(dateTime))
}

interface DateTimeInfoArray {
    utime: Knowable<any>[]; // unix timestamp
    $y:   Knowable<any>[]; // Year
    $M?:  Knowable<any>[]; // Month - starts from 0
    $D?:  Knowable<any>[]; // Day - starts from 1
    $W?:  Knowable<any>[]; // Week
    $H?:  Knowable<any>[]; // Hour
    $m?:  Knowable<any>[]; // minute
    $s?:  Knowable<any>[]; // second
    $ms?: Knowable<any>[]; // milliseconds
    $L?:  Knowable<any>[]; // Locale
}
const UnknownDateTimeInfo: DateTimeInfo = {
    utime: new Knowable<Number>(Number),
    $y: new Knowable<Number>(Number),
    $M: new Knowable<Number>(Number),
    $D: new Knowable<Number>(Number),
    $W: new Knowable<Number>(Number),
    $H: new Knowable<Number>(Number),
    $m: new Knowable<Number>(Number),
    $s: new Knowable<Number>(Number),
    $ms: new Knowable<Number>(Number),
    $L: new Knowable<String>(String)
}

type InfoArrayType = keyof DateTimeInfoArray
type InfoType = keyof DateTimeInfo
function parseDateTimeArray(dateTime: string[]): DateTimeInfoArray {
    // TODO: Polyfills: 中文格式等
    let infoArray = {
        utime: new Array<Knowable<any>>(dateTime.length),
        $y: new Array<Knowable<any>>(dateTime.length)
    } as DateTimeInfoArray
    for (let i = 0;i < dateTime.length; ++i) {
        let info = parseDateTime(dateTime[i])
        Object.keys(info).forEach(key => {
            let infoKey = key as InfoType, infoArrayKey = key as InfoArrayType
            if (info[infoKey].known) {
                if (infoArray[infoArrayKey] === undefined) {
                    let array: Knowable<any>[] = new Array<Knowable<any>>(dateTime.length)
                    array.fill(UnknownDateTimeInfo[infoKey], 0, i)
                    array[i] = info[infoKey]
                    infoArray[infoArrayKey] = array
                }
                else {
                    (infoArray[infoArrayKey] as Knowable<any>[]).fill(info[infoKey], i, i+1)
                }
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
                let infoArray = moment[key as InfoArrayType] as Knowable<any>[]
                for (let i = 0; i < dataSource.length; ++i) {
                    dataSource[i][extField.fid] = infoArray[i].value
                }
            })
        }
    })
    return {
        dataSource: dataSource,
        fields: extFields
    }
}
