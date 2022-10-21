import type { OperatorName } from './operator';


type DateObjectDimension = 'Y' | 'M' | 'W' | 'D' | 'h' | 'm' | 's';

export type TokenType = (
  | 'OP'
  | 'JS.string'
  | 'JS.number'
  | 'RATH.FIELD'
  | 'RATH.FIELD_LIST'
  | '$DATE'
);

interface IToken {
  type: TokenType;
}

interface OpToken extends IToken {
  type: 'OP';
  op: OperatorName;
  args: Token[];
}

interface StringToken extends IToken {
  type: 'JS.string';
  value: string;
}

interface NumberToken extends IToken {
  type: 'JS.number';
  value: number;
}

export type FieldType = (
  | 'set'         // number set not supporting operation
  | 'group'       // number set supporting operation
  | 'collection'  // string set
);

interface FieldToken extends IToken {
  type: 'RATH.FIELD';
  fid: string;
  name: string;
  mode: FieldType;
}

interface FieldListToken extends IToken {
  type: 'RATH.FIELD_LIST';
  tuple: readonly Omit<FieldToken, 'type'>[];
}

interface DateToken extends IToken {
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
