import type { Context } from '.';
import { getOperator } from './operator';
import type { FieldToken, OpToken, Token } from './token';


const execOp = async (op: OpToken, context: Context, exp: (fid: string) => void): Promise<Exclude<Token, OpToken>> => {
  const opt = getOperator(op);
  const args: Exclude<Token, OpToken>[] = [];

  for await (const arg of op.args) {
    if (arg.type === 'OP') {
      args.push(await execOp(arg, context, exp));
    } else {
      args.push(arg);
    }
  }

  const res = await opt.exec(context, args);

  if (op.output.startsWith('RATH.FIELD::') && op.exports !== false) {
    if (op.exports.length) {
      (res as FieldToken).name = op.exports;
    }

    exp((res as FieldToken).fid);
  }

  return res;
};

const exec = async (ast: OpToken[], context: Context): Promise<readonly string[]> => {
  const expArr = new Set<string>();

  for await (const op of ast) {
    await execOp(op, context, fid => expArr.add(fid));
  }

  return [...expArr];
};


export default exec;
