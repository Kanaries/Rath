import type { Context } from '.';
import { $DateToField } from '../implement/date-slice';
import { getOperator } from './operator';
import type { DateToken, FieldListToken, FieldToken, OpToken, Token } from './token';


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
    
    (res as FieldToken).out = (res as FieldToken).name;

    exp((res as FieldToken).fid);
  } else if (op.output === '$DATE' && op.exports !== false) {
    const field = $DateToField(res as DateToken);

    if (op.exports.length) {
      field.name = op.exports;
    }
    
    field.out = field.name;

    exp(field.fid);
  } else if (op.output === 'RATH.FIELD_LIST' && op.exports !== false) {
    const { tuple } = res as FieldListToken;

    if (op.exports.length) {
      tuple.forEach(field => field.name = `${op.exports}.${field.name}`);
    }
    
    tuple.forEach(field => {
      field.out = field.name;
      exp(field.fid);
    });
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
