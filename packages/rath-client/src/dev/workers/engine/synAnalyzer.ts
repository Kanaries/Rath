
export class LexAnalyzerItem {
    regExp: string;
    trans: (arg0?: string) => string | undefined;
    constructor(regExp: string, transform?: (arg0?: string) => string | undefined) {
        this.regExp = regExp
        this.trans = transform || ((p?: string) => p)
    }
}
export interface LexAnalyzer<T> {
    symbols: { [s: string]: symbol };
    items: {[x: symbol]: [LexAnalyzerItem, T]};
    trans: (regRes: RegExpExecArray, type: symbol[]) => [string | undefined, T][];
}
export class SynAnalyzerRule {
    reg: RegExp
    /**
     * construct a SynAnalyzer rule
     * @param lex: LexAnalyzer<T>
     * @param symbols symbol of entities this rule involves (in order)
     * @param getReg: (regExps: string[]) => string 接收symbols中每个元素对应的正则表达式, 拼接出该规则的完整表达式
     */
    constructor(public lex: LexAnalyzer<any>, public symbols: symbol[], getReg: (regExps: string[]) => string) {
        let regs = symbols.map<string>((s: symbol) => lex.items[s][0].regExp)
        this.reg = new RegExp(getReg(regs), 'i')
    }
    test(s: string): boolean { return this.reg.test(s) }
    exec(s: string): RegExpExecArray | null { return this.reg.exec(s) }
    trans(regRes: RegExpExecArray): [string | undefined, any][] {
        return this.lex.trans(regRes, this.symbols)
    }
}
