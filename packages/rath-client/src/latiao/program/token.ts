import type { OperatorName } from './operator';


type DateObjectDimension = 'Y' | 'M' | 'W' | 'D' | 'h' | 'm' | 's';

export type FieldType = (
  | 'set'         // number set not supporting operation
  | 'group'       // number set supporting operation
  | 'collection'  // string set
);

export type TokenType = (
  | 'OP'
  | 'JS.string'
  | 'JS.number'
  | `RATH.FIELD::${FieldType}`
  | 'RATH.FIELD_LIST'
  | '$DATE'
);

interface IToken {
  type: TokenType;
}

export interface OpToken extends IToken {
  type: 'OP';
  op: OperatorName;
  args: Token[];
  output: Exclude<TokenType, 'OP'>;
  exports: false | string;
}

export interface StringToken extends IToken {
  type: 'JS.string';
  value: string;
}

export interface NumberToken extends IToken {
  type: 'JS.number';
  value: number;
}

export interface FieldToken<T extends FieldType = FieldType> extends IToken {
  type: `RATH.FIELD::${T}`;
  fid: string;
  name: string;
  mode: T;
}

export interface FieldListToken<T extends FieldType[] = FieldType[]> extends IToken {
  type: 'RATH.FIELD_LIST';
  tuple: {
    [index in keyof T]: FieldToken<T[index]>;
  };
}

export interface DateToken extends IToken {
  type: '$DATE';
  source: string;
  fid: string;
  dimensions: DateObjectDimension[];
}

export type Token = (
  | OpToken
  | StringToken
  | NumberToken
  | FieldToken
  | FieldListToken
  | DateToken
);
