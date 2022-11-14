import type { IFieldMeta } from '../../interfaces';
import type { OperatorName } from './operator';
import type { Static } from './types';


export type DateObjectDimension = 'Y' | 'M' | 'W' | 'D' | 'h' | 'm' | 's';

export type FieldType = (
  | 'bool'        // numeric, 0 (false) or 1 (true)
  | 'vec'         // number set supporting operation
  | 'set'         // number set not supporting operation
  | 'text'        // string set
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
  args: Static<Token[]>;
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
  extInfo?: IFieldMeta['extInfo'];
  out: false | string;
}

export interface FieldListToken<T extends FieldType[] = FieldType[]> extends IToken {
  type: 'RATH.FIELD_LIST';
  tuple: {
    [index in keyof T]: FieldToken<T[index]>;
  };
}

export interface DateToken extends IToken {
  type: '$DATE';
  source: FieldToken;
  dimensions: 'all' | DateObjectDimension[];
  exports: false | string;
}

export type Token = (
  | OpToken
  | StringToken
  | NumberToken
  | FieldToken
  | FieldListToken
  | DateToken
);
