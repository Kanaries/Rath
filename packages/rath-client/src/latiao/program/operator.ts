import { LaTiaoError, LaTiaoNameError, LaTiaoTypeError } from './error';
import type { TokenType, Token, OpToken, FieldToken, FieldType } from './token';
import type { LaTiaoProgramContext, Static } from './types';


export type OperatorName = `$${string}`;

type MapParameter<T extends TokenType> = (
  T extends `RATH.FIELD::${infer P}` ? P extends FieldType ? FieldToken<P> : FieldToken : Token & { type: T }
);

type MapParameters<A extends TokenType[]> = {
  [index in keyof A]: MapParameter<A[index]>;
};

type MapReturnType<R extends TokenType> = Token & { type: R };

export type Operator<
  A extends Exclude<TokenType, 'OP'>[] = Exclude<TokenType, 'OP'>[],
  R extends Exclude<TokenType, 'OP'> = Exclude<TokenType, 'OP'>,
  M extends Exclude<TokenType, 'OP'> | null = Exclude<TokenType, 'OP'> | null,
  P extends MapParameters<A> = MapParameters<A>,
  S extends MapReturnType<R> = MapReturnType<R>,
> = {
  name: OperatorName;
  args: Readonly<A>;
  returns: R;
  /** @default false */
  secret?: boolean;
  trailing?: M;
  exec: (
    context: LaTiaoProgramContext,
    args: M extends Exclude<TokenType, 'OP'> ? [...P, ...MapParameters<M[]>] : P,
  ) => Promise<S>;
};

const operators: Operator[] = [];

export const subscribeOperator = <
  A extends Exclude<TokenType, 'OP'>[] = Exclude<TokenType, 'OP'>[],
  R extends Exclude<TokenType, 'OP'> = Exclude<TokenType, 'OP'>,
  M extends Exclude<TokenType, 'OP'> | null = null,
  P extends MapParameters<A> = MapParameters<A>,
  S extends MapReturnType<R> = MapReturnType<R>,
>(op: Operator<A, R, M, P, S>): void => {
  operators.push(op as unknown as Operator);
};

export const getOperator = (op: Omit<OpToken, 'output'>, loc?: ConstructorParameters<typeof LaTiaoError>[1]): Readonly<Operator> => {
  const overloads = operators.filter(o => o.name === op.op);

  if (overloads.length === 0) {
    throw new LaTiaoNameError(`"${op.op}" is not an operator.`, loc);
  }

  const input = op.args.map(arg => arg.type === 'OP' ? arg.output : arg.type);

  for (const overload of overloads) {
    if (overload.trailing) {
      if (!input.slice(0, overload.args.length).every((type, i) => type === overload.args[i])) {
        continue;
      }
      if (!input.slice(overload.args.length).every(type => type === overload.trailing)) {
        continue;
      }

      return overload;
    }

    if (overload.args.length !== op.args.length) {
      continue;
    }

    if (!overload.args.every((arg, i) => arg === input[i])) {
      continue;
    }

    return overload;
  }

  throw new LaTiaoTypeError(
    `No overload of ${op.op} matches arguments: [${input.join(', ')}]\nPossible overloads: ${
      overloads.map((o, i) => `\n  [${i + 1}] ${op.op}(${o.args.join(', ')}${
        o.trailing ? `${o.args.length ? ', ' : ''}...${o.trailing}` : ''
      })`).join('')
    }`,
    loc
  );
};

export const getOperatorList = () => {
  return operators.filter(op => !op.secret) as readonly Readonly<Operator>[];
};
