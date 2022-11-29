import { IRow, ISemanticType } from "visual-insights";
import { IMuteFieldBase } from "rath-client/src/interfaces";
import { LexAnalyzer, LexAnalyzerItem, SynAnalyzerRule } from "./synAnalyzer"
import { checkExpandEnv } from "./checkExpandEnv";

interface IDateTimeInfo {
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
class DateTimeInfo implements IDateTimeInfo {
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
    constructor(y?: string, M?: string, D?: string, H?: string, m?: string, s?: string, ms?: string, L?: string) {
        if (y) this.$y = parseInt(y)
        else throw new Error("[parseDateTime]: Missing 'Year' in dateTime string")
        if (M) this.$M = parseInt(M)
        if (D) this.$D = parseInt(D)
        if (H) this.$H = parseInt(H)
        if (m) this.$m = parseInt(m)
        if (s) this.$s = parseInt(s)
        if (ms) this.$ms = parseInt(ms)
        this.$L = L
        let dateTime = new Date(Date.UTC(this.$y, (this.$M || 1) - 1, this.$D || 1, this.$H || 0, this.$m || 0, this.$s || 0, this.$ms || 0))
        this.utime = dateTime.getTime();
        if (y && M && D) {
            this.$W = dateTime.getUTCDay()
        }
    }
}
/** parameter locations of DateTimeInfo constructor */
enum DateTimeParamPos {
    year = 0, month, date, hour, min, sec, ms
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
export class DateTimeLexAnalyzer implements LexAnalyzer<DateTimeParamPos> {
    static MONTH_NAME_LIST = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    static MONTH_ABBR_LIST = ['Jan', 'Feb', 'March', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
    static MONTH_MAP = new Map<string, string>(
        this.MONTH_NAME_LIST.map<[string, string]>((s, i) => [s, `${i + 1}`])
        .concat(this.MONTH_ABBR_LIST.map((s, i) => [s, `${i + 1}`]))
    )
    static TODAY = new Date()
    static CUR_YEAR = this.TODAY.getUTCFullYear()
    symbols = {
        YEAR:       Symbol.for('lex_year'),
        YEAR2:      Symbol.for('lex_year2'),
        MONTH:      Symbol.for('lex_month'),
        MONTH2:     Symbol.for('lex_month2'),
        MONTH_NAME: Symbol.for('lex_month_name'),
        MONTH_ABBR: Symbol.for('lex_month_abbr'),
        DATE:       Symbol.for('lex_date'),
        DATE2:      Symbol.for('lex_date2'),
        HOUR:       Symbol.for('lex_hour'),
        MIN:        Symbol.for('lex_min'),
        SEC:        Symbol.for('lex_sec'),
        MS:         Symbol.for('lex_ms')
    }
    items: {[x: symbol]: [LexAnalyzerItem, DateTimeParamPos]} = {
        // [symbol]: [ LexAnalyzerItem, data index in DateTime constructor param list ]
        [this.symbols.YEAR]: [
            new LexAnalyzerItem('[1-2][0-9]{3}'), DateTimeParamPos.year
        ],
        [this.symbols.YEAR2]: [
            new LexAnalyzerItem('[0-9]{2}', (p?: string) => p && ((parseInt("20" + p) <= DateTimeLexAnalyzer.CUR_YEAR) ? "20" + p : "19" + p)), DateTimeParamPos.year
        ],
        [this.symbols.MONTH]: [
            new LexAnalyzerItem('(?:0?[1-9])|(?:1[0-2])'), DateTimeParamPos.month
        ],
        [this.symbols.MONTH2]: [
            new LexAnalyzerItem('(?:0[1-9])|(?:1[0-2])'), DateTimeParamPos.month
        ],
        [this.symbols.MONTH_NAME]: [
            new LexAnalyzerItem(DateTimeLexAnalyzer.MONTH_NAME_LIST.join('|'), (p?: string) => p && DateTimeLexAnalyzer.MONTH_MAP.get(p)), DateTimeParamPos.month
        ],
        [this.symbols.MONTH_ABBR]: [
            new LexAnalyzerItem(DateTimeLexAnalyzer.MONTH_ABBR_LIST.join('|'), (p?: string) => p && DateTimeLexAnalyzer.MONTH_MAP.get(p)), DateTimeParamPos.month
        ],
        [this.symbols.DATE]: [
            new LexAnalyzerItem('(?:0?[1-9])|(?:[1-2][0-9])|(?:3[0-1])'), DateTimeParamPos.date
        ],
        [this.symbols.DATE2]: [
            new LexAnalyzerItem('(?:0[1-9])|(?:[1-2][0-9])|(?:3[0-1])'), DateTimeParamPos.date
        ],
        [this.symbols.HOUR]: [
            new LexAnalyzerItem('(?:[0-1]?[0-9])|(?:2[0-4])'), DateTimeParamPos.hour
        ],
        [this.symbols.MIN]: [
            new LexAnalyzerItem('[-:][0-5]?[0-9]', (p?: string) => p?.slice(1)), DateTimeParamPos.min
        ],
        [this.symbols.SEC]: [
            new LexAnalyzerItem('[-:][0-5]?[0-9]', (p?: string) => p?.slice(1)), DateTimeParamPos.sec
        ],
        [this.symbols.MS]: [
            new LexAnalyzerItem('[\\.:-][0-9]{0,3}', (p?: string) => p && ((p[0] === '.') ? p + '000' : p).substring(1, 4)), DateTimeParamPos.ms
        ]
    }
    trans(regRes: RegExpExecArray, type: symbol[]): [string | undefined, DateTimeParamPos][] {
        if (regRes.length !== type.length + 1) throw new Error("[DateTimeLexAnalyzer.trans]: different length")
        let res = new Array<[string | undefined, DateTimeParamPos]>(type.length)
        for (let i = 0;i < type.length; ++i) {
            res[i] = [ this.items[type[i]][0].trans(regRes[i+1]), this.items[type[i]][1] ]
        }
        return res
    }
}
export class DateTimeSynAnalyzer {
    lex = new DateTimeLexAnalyzer()
    rules: Array<SynAnalyzerRule>
    constructor() {
        let s = this.lex.symbols
        this.rules = [
            new SynAnalyzerRule(this.lex,
                [s.YEAR, s.MONTH, s.DATE, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})[-/\\s\\.,](${r[1]})(?:[-/\\s\\.](${r[2]}))?(?:[Tt\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // YYYY-MM-DD [HH[:mm[:ss[.ms]]]]
            new SynAnalyzerRule(this.lex,
                [s.YEAR, s.MONTH2, s.DATE2, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})(${r[1]})(${r[2]})?(?:[Tt\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // YYYYMMDD [HH[:mm[:ss[.ms]]]]
            new SynAnalyzerRule(this.lex,
                [s.YEAR2, s.MONTH, s.DATE, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})[-/\\s\\.,](${r[1]})(?:[-/\\s\\.](${r[2]}))?(?:[Tt\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // YY-MM-DD [HH[:mm[:ss[.ms]]]]
            new SynAnalyzerRule(this.lex,
                [s.YEAR2, s.MONTH2, s.DATE2, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})(${r[1]})(${r[2]})?(?:[Tt\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // YYMMDD [HH[:mm[:ss[.ms]]]]
            new SynAnalyzerRule(this.lex,
                [s.MONTH, s.DATE, s.YEAR, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})[-/\\s\\.](${r[1]})(?:[-/\\s,](${r[2]}))?(?:[Tt\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // MM-DD-YYYY
            new SynAnalyzerRule(this.lex,
                [s.MONTH2, s.DATE2, s.YEAR, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})(${r[1]})(${r[2]})?(?:[Tt\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // MMDDYYYY
            new SynAnalyzerRule(this.lex,
                [s.MONTH, s.DATE, s.YEAR2, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})[-/\\s\\.](${r[1]})[-/\\s\\,](${r[2]})(?:[Tt\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // MM-DD-YY
            new SynAnalyzerRule(this.lex,
                [s.MONTH2, s.DATE2, s.YEAR2, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})(${r[1]})(${r[2]})(?:[Tt\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // MMDDYY
            new SynAnalyzerRule(this.lex,
                [s.MONTH_NAME, s.DATE, s.YEAR, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})[-/\\.,\\s]*(${r[1]})[-/A-Za-z\\s\\.,]*(${r[2]})(?:[\\.,\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // Mo-DD-YYYY
            new SynAnalyzerRule(this.lex,
                [s.MONTH_NAME, s.DATE, s.YEAR2, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})[-/\\.,\\s]*(${r[1]})[-/A-Za-z\\s\\.,]*(${r[2]})(?:[\\.,\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // Mo-DD-YY
            new SynAnalyzerRule(this.lex,
                [s.MONTH_ABBR, s.DATE, s.YEAR, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})[-/\\.,\\s]*(${r[1]})[-/A-Za-z\\s\\.,]*(${r[2]})(?:[\\.,\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ), // Mo.-DD-YYYY
            new SynAnalyzerRule(this.lex,
                [s.MONTH_ABBR, s.DATE, s.YEAR2, s.HOUR, s.MIN, s.SEC, s.MS],
                (r: string[]) => `^(${r[0]})[-/\\.,\\s]*(${r[1]})[-/A-Za-z\\s\\.,]*(${r[2]})(?:[\\.,\\s]+(${r[3]}))?(${r[4]})?(${r[5]})?(${r[6]})?$`
            ) // Mo.-DD-YY
        ]
    }
}

let analyzer = new DateTimeSynAnalyzer()
export function parseReg(value: string, reg_id: number): DateTimeInfo {
    if (!(Number.isInteger(reg_id) && reg_id < analyzer.rules.length)) throw new Error("reg_id error")
    let parse_res = analyzer.rules[reg_id].exec(value)
    if (parse_res) {
        let res = analyzer.lex.trans(parse_res, analyzer.rules[reg_id].symbols)
        let infoArray = new Array<string | undefined>(7)
        for (let i = 0; i < res.length; ++i) infoArray[res[i][1]] = res[i][0];
        return new DateTimeInfo(...infoArray)
    }
    return {} as DateTimeInfo
}

function date2Info(date: Date): DateTimeInfo {
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

function parseDateTime(dateTime: string, reg_id?: number): DateTimeInfo {
    try {
        if (reg_id !== undefined) return parseReg(dateTime, reg_id)
        if (dateTime === null || dateTime === undefined) return UnknownDateTimeInfo;
        // if (!/Z$/i.test(dateTime)) {
        // }
        // Polyfill
        return date2Info(new Date(dateTime))
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
export type DateTimeInfoType = keyof DateTimeInfo
export function parseDateTimeArray(dateTime: string[]): DateTimeInfoArray {
    // TODO: [refactor] Polyfills: 中文格式等
    // TODO: [feat] assume the same dateTime format or support different format in one column
    let infoArray = {} as DateTimeInfoArray
    let reg_id: number | undefined, max_cnt = 0;
    for (let i = 0; i < analyzer.rules.length; ++i) {
        let cnt = dateTime.map<number>(d => analyzer.rules[i].test(d) ? 1 : 0).reduce((a, b) => a + b)
        if (cnt > max_cnt) {
            reg_id = i
            max_cnt = cnt
        }
    }
    // TODO: [feat] 推荐多种不同选择
    for (let i = 0; i < dateTime.length; ++i) {
        let info = parseDateTime(dateTime[i], max_cnt > 0 ? reg_id : undefined)
        Object.keys(info).forEach(key => {
            let infoKey = key as DateTimeInfoType, infoArrayKey = key as InfoArrayType
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
export function isDateTimeArray(data: string[]): boolean {
    let max_cnt = 0;
    let emptyCount = data.map<number>(d => (d === null || d === undefined || d === "") ? 1 : 0)
        .reduce((a, b) => a + b);
    for (let i = 0; i < analyzer.rules.length; ++i) {
        let cnt = data.map<number>(d => analyzer.rules[i].test(d) ? 1 : 0).reduce((a, b) => a + b)
        if (cnt > max_cnt) {
            max_cnt = cnt
        }
    }
    return max_cnt + emptyCount === data.length;
}

export function dateTimeExpand(props: { dataSource: IRow[]; fields: IMuteFieldBase[] })
    : { dataSource: IRow[]; fields: IMuteFieldBase[] } {
    const { dataSource, fields } = props;
    if (dataSource.length === 0 || fields.length === 0) {
        console.error("[dateTimeExpand]: dataSource x fields is empty")
        return props
    }

    let extFields: IMuteFieldBase[] = []
    let fieldIds = new Set(fields.map(f => (f.extInfo && f.extInfo?.extOpt === "dateTimeExpand") ? f.extInfo?.extFrom[0] : ''))
    let keySemanticType: { [k: string]: ISemanticType } = {
        utime: 'temporal',
        $y: 'ordinal',
        $M: 'ordinal',
        $D: 'ordinal',
        $W: 'ordinal',
        $H: 'ordinal',
        $m: 'ordinal',
        $s: 'ordinal',
        $ms:'ordinal',
        $L: 'nominal'
    }
    for (let i = 0;i < fields.length; ++i) {
        const field = fields[i]
        extFields.push(field)
        if (field.disable) continue
        if (field.semanticType === 'temporal' && !fieldIds.has(field.fid)) {
            let dateTime = dataSource.map(item => item[field.fid])
            let moment: DateTimeInfoArray = parseDateTimeArray(dateTime)
            if (moment.utime !== undefined) {
                field.disable = true
                if (moment.utime?.map<boolean>(t => typeof(t) === 'number').reduce((a, b) => a && b) === false) {
                    throw new Error("[dateTimeExpand] Some 'utime' not number")
                }
            }
            for (let key of Object.keys(moment)) if (moment[key as InfoArrayType] !== undefined) {
                let momentInfo = moment[key as InfoArrayType] as any[]
                let extField: IMuteFieldBase = {
                    fid: `${field.fid}_${key}`,
                    disable: (new Set(momentInfo.filter((info, index, array) => !index || info !== array[index-1]))).size <= 1,
                    name: `${field.name}.${dateTimeDict.get(key)}`,
                    analyticType: 'dimension',
                    semanticType: keySemanticType[key],
                    geoRole: 'none',
                    extInfo: {
                        extFrom: [field.fid],
                        extOpt: 'dateTimeExpand',
                        extInfo: `${key}`
                    }
                }
                extFields.push(extField)
                for (let i = 0; i < dataSource.length; ++i) {
                    dataSource[i][extField.fid] = momentInfo[i]
                }
            }
        }
    }
    return {
        dataSource: dataSource,
        fields: extFields
    }
}

export function dateTimeExpandTest(testCase: Array<string>) {
    // eslint-disable-next-line no-console
    console.log(parseDateTimeArray(testCase))
    for (let i = 0;i < analyzer.rules.length;++i) {
        let cnt = 0
        for (let s of testCase) {
            let res = analyzer.rules[i].exec(s)
            if (res) {
                // eslint-disable-next-line no-console
                console.log(i, s, analyzer.rules[i].trans(res));
                cnt += 1;
            }
        }
        // eslint-disable-next-line no-console
        console.log(i, cnt, analyzer.rules[i].reg)
    }
}

if (checkExpandEnv().toLowerCase() === 'debug') {
    (global as any).parseDateTimeArray = parseDateTimeArray;
    (global as any).dateTimeExpandTest = dateTimeExpandTest
}

export function doTest() {
    let testCases: Array<Array<string>> = [
        ["1998-04-09"],
        ["19980409"],
        ["98-05-09", "02-04-09", "00-04-12"],
        ["980409", "920409", "000412", "400912"],
        ["200924", "200831", "200128"],
        ["980409 12:12:13.98", "220409 12:12:13.198"],
        ["980409 12:12:13:98", "220409 12:12:13:198"],
        ["Apr. 8th, 2014 13:13"],
        ["1998/4/9"],
        ["040202", "040502", "040802", "042002", "043102"],
        ["2015-12-14", "2013-08-09", "2013-10-11", "2016-02-25"],
        ["April-8-09"],
        ["04.29,2004", "12.29, 2008"],
        ["2008,08.24"],
        ["980409", "", "000412", ""],
        ["200924", "", "200128"],
    ]
    for (let c of testCases) dateTimeExpandTest(c)
}