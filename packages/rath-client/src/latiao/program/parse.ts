import { parse as p } from '@babel/parser';
import { exec } from 'child_process';
import { IRow, IMuteFieldBase } from 'visual-insights';
import type { Context } from '.';
import { LaTiaoParseError, LaTiaoSyntaxError, LaTiaoTypeError } from './error';
import { getOperator } from './operator';
import type { Token } from './token';


export type ASTExpression = (ReturnType<typeof p>['program']['body'][0] & {
  type: 'ExpressionStatement';
})['expression'];

export type ASTNode = {};

const prefix = `"use strict";
/* LaTiao */

function main() {
  `;

const suffix = `
}
`;

const translate = (source: string): string => {
  return `${prefix}${source}${suffix}`;
};

const findEntry = (res: ReturnType<typeof p>) => {
  const body = res.program.body[0];

  return (
    body.type === 'FunctionDeclaration' && body.id?.name === 'main' && body.body.body.length === 1
    && body.body.body[0].type === 'ExpressionStatement' && body.body.body[0].expression.type === 'CallExpression'
  ) ? body.body.body[0].expression : null;
};

export type Statement = ReturnType<typeof p>['program']['body'][0];
export type CallExpression = NonNullable<ReturnType<typeof findEntry>>;

const resolveCall = (exp: CallExpression, context: Context) => {
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

      }
      default: {
        throw new LaTiaoTypeError(
          'Invalid argument.',
          arg,
        );
      }
    }
  });

  const op: Token = {
    type: 'OP',
    op: opName as `$${string}`,
    args,
  };

  getOperator(op);

  return op;
};

const parse = (source: string, context: Context): Token => {
  console.log(translate(source));
  const res = p(
    translate(source)
  );
  const body = findEntry(res);

  if (!body) {
    throw new LaTiaoSyntaxError(
      'Expect one sentence.',
      res,
    );
  }

  const root = resolveCall(body, context);

  return root;
};


export default parse;
