import type { Context } from '.';
import { LaTiaoError, LaTiaoNameError, LaTiaoTypeError } from './error';
import type { TokenType, Token, OpToken } from './token';


export type OperatorName = `$${string}`;

type MapParameters<A extends TokenType[]> = {
  [index in keyof A]: Token & { type: A[index] };
};

type MapReturnType<R extends TokenType> = Token & { type: R };

export type Operator<
  A extends Exclude<TokenType, 'OP'>[] = Exclude<TokenType, 'OP'>[],
  R extends Exclude<TokenType, 'OP'> = Exclude<TokenType, 'OP'>,
  P extends MapParameters<A> = MapParameters<A>,
  S extends MapReturnType<R> = MapReturnType<R>,
> = {
  name: OperatorName;
  args: Readonly<A>;
  returns: R;
  exec: (
    context: Context,
    args: P,
  ) => Promise<S>;
};

const operators: Operator[] = [];

export const subscribeOperator = <
  A extends Exclude<TokenType, 'OP'>[] = Exclude<TokenType, 'OP'>[],
  R extends Exclude<TokenType, 'OP'> = Exclude<TokenType, 'OP'>,
  P extends MapParameters<A> = MapParameters<A>,
  S extends MapReturnType<R> = MapReturnType<R>,
>(op: Operator<A, R, P, S>): void => {
  operators.push(op as unknown as Operator);
};

export const getOperator = (op: Omit<OpToken, 'output'>, loc?: ConstructorParameters<typeof LaTiaoError>[1]): Readonly<Operator> => {
  const overloads = operators.filter(o => o.name === op.op);

  if (overloads.length === 0) {
    throw new LaTiaoNameError(`"${op.op}" is not an operator.`, loc);
  }

  const input = op.args.map(arg => arg.type === 'OP' ? arg.output : arg.type);

  for (const overload of overloads) {
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
      overloads.map((o, i) => `\n  [${i + 1}] ${op.op}(${o.args.join(',')})`).join('')
    }`,
    loc
  );
};

export const getOperatorList = () => {
  return operators as readonly Readonly<Operator>[];
};
