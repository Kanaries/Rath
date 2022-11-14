import { parse as p } from '@babel/parser';
import { validDateSlice } from './implement/date-slice';
import { LaTiaoSyntaxError, LaTiaoTypeError } from './error';
import { getOperator } from './operator';
import type { OpToken, Token, TokenType } from './token';
import type { Context } from '.';


export type ASTExpression = (ReturnType<typeof p>['program']['body'][0] & {
  type: 'ExpressionStatement';
})['expression'];

export type ASTNode = {};

export const prefix = `/* LaTiao 100 */

function main() {
`;

export const suffix = `
}
`;

export const validNameRegExp = /^[^$\s,.;:'"`+\-~!?<>@#%^&*/\\|]+$/;

const translate = (source: string): string => {
  return `${prefix}${
    source.replaceAll(
      /\b(out)\b(\s+(?<id>[^$\s,.;:'"`+\-~!?<>@#%^&*/\\|]+))?/g,
      (_a0, _a1, _a2, _a3, _a4, _a5, { id }: { id: string | undefined }) => {
        if (id && !validNameRegExp.test(id)) {
          throw new LaTiaoSyntaxError(`"${id}" is not a valid field id.`);
        }

        return `$${id ?? ''} = `;
      }
    )
  }${suffix}`;
};

const resolveMemberExp = (exp: ASTExpression & { type: 'MemberExpression' }): (ASTExpression & { type: 'MemberExpression' })[] => {
  if (
    exp.object.type === 'CallExpression'
    && exp.object.callee.type === 'Identifier'
    && exp.object.callee.name === '$toDate'
    && exp.property.type === 'Identifier'
  ) {
    validDateSlice(exp.property.name);

    return [exp];
  }

  throw new LaTiaoTypeError(
    'Left value does not support slice.',
    exp,
  );
};

const findEntry = (res: ReturnType<typeof p>) => {
  const body = res.program.body[0];

  if (body.type === 'FunctionDeclaration' && body.id?.name === 'main' && body.body.body.length === 1) {
    const statement = body.body.body[0];

    if (statement.type !== 'ExpressionStatement') {
      return [];
    }

    const expression = statement.expression;

    switch (expression.type) {
      case 'CallExpression': {
        return [expression];
      }
      case 'BinaryExpression': {
        return [expression];
      }
      case 'AssignmentExpression': {
        return [expression];
      }
      case 'MemberExpression': {
        return resolveMemberExp(expression);
      }
      case 'SequenceExpression': {
        if (expression.expressions.every(exp => ['CallExpression', 'AssignmentExpression'].includes(exp.type))) {
          return expression.expressions as (typeof expression & { type: 'CallExpression' | 'AssignmentExpression' })[];
        }

        return [];
      }
      default: {
        return [];
      }
    }
  }

  return [];
};

export type Statement = ReturnType<typeof p>['program']['body'][0];
export type ExportExpression = ReturnType<typeof findEntry>[0] & { type: 'AssignmentExpression' };
export type CallExpression = ReturnType<typeof findEntry>[0] & { type: 'CallExpression' };
export type SliceExpression = ReturnType<typeof findEntry>[0] & { type: 'MemberExpression' };
export type BinOpExpression = ReturnType<typeof findEntry>[0] & { type: 'BinaryExpression' };

const resolveNode = (exp: CallExpression['arguments'][0], context: Context, out: () => void): Token => {
  switch (exp.type) {
    case 'Identifier': {
      const { name } = exp;
      const field = context.resolveFid(name);
      
      return field;
    }
    case 'CallExpression': {
      return resolveCall(exp, context, out);
    }
    case 'AssignmentExpression': {
      return resolveExport(exp, context, out);
    }
    case 'MemberExpression': {
      return resolveSlice(exp, context, out);
    }
    case 'StringLiteral': {
      return {
        type: 'JS.string',
        value: exp.value,
      };
    }
    case 'NumericLiteral': {
      return {
        type: 'JS.number',
        value: exp.value,
      };
    }
    case 'BinaryExpression': {
      return resolveBinOp(exp, context, out);
    }
    default: {
      // console.log('->', exp);
      throw new LaTiaoSyntaxError(
        'Unexpected token.',
        exp,
      );
    }
  }
};

const resolveExport = (exp: ExportExpression, context: Context, out: () => void): OpToken => {
  if (exp.operator !== '=' || exp.left.type !== 'Identifier' || !exp.left.name.startsWith('$')) {
    throw new LaTiaoSyntaxError('Failed to parse', exp);
  }

  const name = exp.left.name.replace(/^\$/, '');

  if (name && !validNameRegExp.test(name)) {
    throw new LaTiaoSyntaxError(`"${name}" is not a valid field id.`);
  }

  if (exp.right.type === 'MemberExpression') {
    const op = resolveSlice(exp.right, context, out);

    out();
  
    return {
      ...op,
      exports: name,
    };
  } else if (exp.right.type === 'BinaryExpression') {
    const op = resolveBinOp(exp.right, context, out);

    out();

    return {
      ...op,
      exports: name,
    };
  }

  if (exp.right.type !== 'CallExpression' || exp.right.callee.type !== 'Identifier') {
    throw new LaTiaoSyntaxError(
      'Expect operator here.',
      exp,
    );
  }

  const op = resolveCall(exp.right, context, out);

  out();

  return {
    ...op,
    exports: name,
  };
};

const resolveSlice = (exp: SliceExpression, context: Context, out: () => void): OpToken => {
  const targetOp = exp.object.type === 'AssignmentExpression' ? resolveExport(exp.object, context, out)
    : exp.object.type === 'CallExpression' ? resolveCall(exp.object, context, out)
    : null;

  if (!targetOp) {
    throw new LaTiaoTypeError(
      'Left value does not support slice.',
      exp,
    );
  }

  const target = getOperator(targetOp);

  if (target.returns === '$DATE') {
    if (exp.property.type !== 'Identifier' || !exp.property.name) {
      throw new LaTiaoTypeError(
        'Invalid slice call.',
        exp,
      );
    }

    const sliceKey = exp.property.name;

    validDateSlice(sliceKey);

    const op: OpToken = {
      type: 'OP',
      op: sliceKey.length === 1 ? '$__projDate' : '$__sliceDate',
      args: [targetOp, {
        type: 'JS.string',
        value: sliceKey,
      }],
      output: sliceKey.length === 1 ? 'RATH.FIELD::group' : 'RATH.FIELD_LIST',
      exports: false,
    };

    return op;
  }

  throw new LaTiaoTypeError(
    'Left value does not support slice.',
    exp,
  );
};

const resolveBinOp = (exp: BinOpExpression, context: Context, out: () => void): OpToken => {
  if (exp.left.type === 'PrivateName') {
    throw new LaTiaoSyntaxError(
      'Unexpected token.',
      exp,
    );
  }

  const left = resolveNode(exp.left, context, out);
  const right = resolveNode(exp.right, context, out);

  switch (exp.operator) {
    case '+': {
      return {
        type: 'OP',
        op: '$__add',
        args: [left, right],
        output: 'RATH.FIELD::group',
        exports: false,
      };
    }
    case '-': {
      return {
        type: 'OP',
        op: '$__minus',
        args: [left, right],
        output: 'RATH.FIELD::group',
        exports: false,
      };
    }
    case '*': {
      return {
        type: 'OP',
        op: '$__multiply',
        args: [left, right],
        output: 'RATH.FIELD::group',
        exports: false,
      };
    }
    case '/': {
      return {
        type: 'OP',
        op: '$__divide',
        args: [left, right],
        output: 'RATH.FIELD::group',
        exports: false,
      };
    }
    default: {
      throw new LaTiaoSyntaxError(
        `Invalid syntax: ${exp.operator}.`,
        exp,
      );
    }
  }
};

const resolveCall = (exp: CallExpression, context: Context, out: () => void): OpToken => {
  const opName = exp.callee.type === 'Identifier' ? exp.callee.name : null;

  if (!opName || !opName.startsWith('$')) {
    throw new LaTiaoSyntaxError(
      'Expect operator here.',
      exp,
    );
  }

  const args: Token[] = exp.arguments.map(arg => {
    return resolveNode(arg, context, out);
  });

  const op: OpToken = {
    type: 'OP',
    op: opName as `$${string}`,
    args,
    output: '' as Exclude<TokenType, 'OP'>,
    exports: false,
  };

  const opr = getOperator(op);

  op.output = opr.returns;

  return op;
};

export const resolveDependencies = (sources: string[], context: Context): string[] => {
  return sources.reduce<string[]>((list, source) => {
    const field = context.resolveFid(source);

    if (field.out !== false) {
      list.push(source);
    } else if (field.extInfo) {
      list.push(...resolveDependencies(field.extInfo.extFrom, context));
    }

    return list;
  }, []);
};

const parse = (source: string, context: Context): OpToken[] => {
  let expCount = 0;

  let res = undefined as unknown as ReturnType<typeof p>;

  try {
    res = p(translate(source));
  } catch (error) {
    throw new LaTiaoSyntaxError(
      'Failed to parse.',
    );
  }

  const body = findEntry(res);

  if (body.length === 0) {
    throw new LaTiaoSyntaxError(
      'Expect one sentence.',
      res,
    );
  }

  const root = body.map(
    t => (
      t.type === 'AssignmentExpression' ? resolveExport(
        t, context, () => expCount += 1
      ) : t.type === 'MemberExpression' ? resolveSlice(
        t, context, () => expCount += 1
      ) : t.type === 'BinaryExpression' ? resolveBinOp(
        t, context, () => expCount += 1
      ) : resolveCall(
        t, context, () => expCount += 1
      )
    )
  );

  if (expCount === 0) {
    throw new LaTiaoSyntaxError(
      'Expression should includes at least one "out" flag to export columns.',
      res,
    );
  }

  return root;
};


export default parse;
