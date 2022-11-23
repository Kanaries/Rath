/* eslint-disable no-new-func */
import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator<['RATH.FIELD::vec', 'JS.string'], 'RATH.FIELD::bool'>({
  name: '$test',
  args: ['RATH.FIELD::vec', 'JS.string'],
  returns: 'RATH.FIELD::bool',
  exec: async (context, [source, { value: projectSource }]) => {
    const field: FieldToken<'bool'> = {
      type: 'RATH.FIELD::bool',
      fid: nanoid(),
      name: `${source.name} tested by ${projectSource}`,
      mode: 'bool',
      extInfo: {
        extOpt: 'LaTiao.$test',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          projector: projectSource,
        },
      },
      out: false,
    };

    const origin = await context.col(source) as number[];
    const project = new Function('d', 'i', `return Boolean(${projectSource}) ? 1 : 0`) as (d: number, i: number) => 0 | 1;

    context.write(field, origin.map((d, i) => {
      return project(d, i);
    }));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::set', 'JS.string'], 'RATH.FIELD::bool'>({
  name: '$test',
  args: ['RATH.FIELD::set', 'JS.string'],
  returns: 'RATH.FIELD::bool',
  exec: async (context, [source, { value: projectSource }]) => {
    const field: FieldToken<'bool'> = {
      type: 'RATH.FIELD::bool',
      fid: nanoid(),
      name: `${source.name} tested by ${projectSource}`,
      mode: 'bool',
      extInfo: {
        extOpt: 'LaTiao.$test',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          projector: projectSource,
        },
      },
      out: false,
    };

    const origin = await context.col(source) as number[];
    const project = new Function('d', 'i', `return Boolean(${projectSource}) ? 1 : 0`) as (d: number, i: number) => 0 | 1;

    context.write(field, origin.map((d, i) => {
      return project(d, i);
    }));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::text', 'JS.string'], 'RATH.FIELD::bool'>({
  name: '$test',
  args: ['RATH.FIELD::text', 'JS.string'],
  returns: 'RATH.FIELD::bool',
  exec: async (context, [source, { value: projectSource }]) => {
    const field: FieldToken<'bool'> = {
      type: 'RATH.FIELD::bool',
      fid: nanoid(),
      name: `${source.name} tested by ${projectSource}`,
      mode: 'bool',
      extInfo: {
        extOpt: 'LaTiao.$test',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          projector: projectSource,
        },
      },
      out: false,
    };

    const origin = await context.col(source) as string[];
    const project = new Function('d', 'i', `return Boolean(${projectSource}) ? 1 : 0`) as (d: string, i: number) => 0 | 1;

    context.write(field, origin.map((d, i) => {
      return project(d, i);
    }));

    return field;
  },
});
