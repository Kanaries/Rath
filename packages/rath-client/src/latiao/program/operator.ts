import { nanoid } from 'nanoid';
import type { Context } from '.';
import { LaTiaoError, LaTiaoSyntaxError } from './error';
import type { TokenType, Token } from './token';


export type OperatorName = `$${string}`;

type MapParameters<A extends TokenType[]> = {
  [index in keyof A]: Token & { type: A[index] };
};

type MapReturnType<R extends TokenType> = Token & { type: R };

export type Operator<
  A extends TokenType[] = TokenType[],
  P extends MapParameters<A> = MapParameters<A>,
  R extends TokenType = TokenType,
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

const operators: Readonly<Operator[]> = [
  {
    name: '$id',
    args: [],
    returns: 'RATH.FIELD',
    exec: async context => {
      return {
        type: 'RATH.FIELD',
        fid: nanoid(),
        name: 'id',
        mode: 'set',
      };
    },
  },
];

export const getOperator = (op: Token & { type: 'OP' }, loc?: ConstructorParameters<typeof LaTiaoError>[1]): Readonly<Operator> => {
  const overloads = operators.filter(o => o.name === op.op);

  if (overloads.length === 0) {
    throw new LaTiaoSyntaxError(`"${op.op}" is not an operator.`, loc);
  }

  for (const overload of overloads) {
    if (overload.args.length !== op.args.length) {
      continue;
    } else if (!overload.args.every((arg, i) => arg === op.args[i].type)) {
      continue;
    }

    return overload;
  }

  throw new LaTiaoSyntaxError(`No overload of ${op.op} matches arguments: [${op.args.map(a => a.type).join(', ')}]`, loc);
};
