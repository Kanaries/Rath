import { parse as p } from '@babel/parser';
import { exec } from 'child_process';
import { IRow, IMuteFieldBase } from 'visual-insights';
import type { Context } from '.';
import { LaTiaoParseError, LaTiaoSyntaxError, LaTiaoTypeError } from './error';
import { getOperator } from './operator';
import type { OpToken, Token, TokenType } from './token';


export type ASTExpression = (ReturnType<typeof p>['program']['body'][0] & {
  type: 'ExpressionStatement';
})['expression'];

export type ASTNode = {};

const prefix = `/* LaTiao 100 */

function main() {
  `;

const suffix = `
}
`;

const validNameRegExp = /^[^$\s,\.;:'"`\+\-~!?<>@#%^&*/\\|]+$/;

const translate = (source: string): string => {
  return `${prefix}${
    source.replaceAll(
      /\b(out)\b(\s+(?<id>[^$\s,\.;:'"`\+\-~!?<>@#%^&*/\\|]+))?/g,
      (_a0, _a1, _a2, _a3, _a4, _a5, { id }: { id: string | undefined }) => {
        if (id && !validNameRegExp.test(id)) {
          throw new LaTiaoSyntaxError(`"${id}" is not a valid field id.`);
        }

        return `$${id ?? ''} = `;
      }
    )
  }${suffix}`;
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
      case 'AssignmentExpression': {
        return [expression];
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

const resolveExport = (exp: ExportExpression, context: Context, out: () => void): OpToken => {
  if (exp.operator !== '=' || exp.left.type !== 'Identifier' || !exp.left.name.startsWith('$')) {
    throw new LaTiaoSyntaxError('Failed to parse', exp);
  }

  const name = exp.left.name.replace(/^\$/, '');

  if (name && !validNameRegExp.test(name)) {
    throw new LaTiaoSyntaxError(`"${name}" is not a valid field id.`);
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

const resolveCall = (exp: CallExpression, context: Context, out: () => void): OpToken => {
  const opName = exp.callee.type === 'Identifier' ? exp.callee.name : null;

  if (!opName || !opName.startsWith('$')) {
    throw new LaTiaoSyntaxError(
      'Expect operator here.',
      exp,
    );
  }

  const args: Token[] = exp.arguments.map(arg => {
    switch (arg.type) {
      case 'Identifier': {
        const { name } = arg;
        const field = context.resolveFid(name);
        
        return field;
      }
      case 'CallExpression': {
        return resolveCall(arg, context, out);
      }
      case 'AssignmentExpression': {
        return resolveExport(arg, context, out);
      }
      default: {
        throw new LaTiaoTypeError(
          'Invalid argument.',
          arg,
        );
      }
    }
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

const parse = (source: string, context: Context): OpToken[] => {
  let expCount = 0;
  const res = p(
    translate(source)
  );
  const body = findEntry(res);

  if (body.length === 0) {
    throw new LaTiaoSyntaxError(
      'Expect one sentence.',
      res,
    );
  }

  const root = body.map(
    t => t.type === 'AssignmentExpression' ? resolveExport(
      t, context, () => expCount += 1
    ) : resolveCall(
      t, context, () => expCount += 1
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
