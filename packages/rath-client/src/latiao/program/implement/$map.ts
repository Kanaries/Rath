/* eslint-disable no-new-func */
import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator<['RATH.FIELD::vec', 'JS.string'], 'RATH.FIELD::vec'>({
  name: '$map',
  args: ['RATH.FIELD::vec', 'JS.string'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source, { value: projectSource }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${source.name} mapped by ${projectSource}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$map',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          projector: projectSource,
        },
      },
      out: false,
    };

    const origin = await context.col(source) as number[];
    const project = new Function('d', 'i', `return ${projectSource}`) as (d: number, i: number) => any;

    context.write(field, origin.map((d, i) => {
      const t = project(d, i);
      return typeof t === 'number' ? t : NaN;
    }));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::set', 'JS.string'], 'RATH.FIELD::set'>({
  name: '$map',
  args: ['RATH.FIELD::set', 'JS.string'],
  returns: 'RATH.FIELD::set',
  exec: async (context, [source, { value: projectSource }]) => {
    const field: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: `${source.name} mapped by ${projectSource}`,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$map',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          projector: projectSource,
        },
      },
      out: false,
    };

    const origin = await context.col(source) as number[];
    const project = new Function('d', 'i', `return ${projectSource}`) as (d: number, i: number) => any;

    context.write(field, origin.map((d, i) => {
      const t = project(d, i);
      return typeof t === 'number' ? t : NaN;
    }));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::text', 'JS.string'], 'RATH.FIELD::text'>({
  name: '$map',
  args: ['RATH.FIELD::text', 'JS.string'],
  returns: 'RATH.FIELD::text',
  exec: async (context, [source, { value: projectSource }]) => {
    const field: FieldToken<'text'> = {
      type: 'RATH.FIELD::text',
      fid: nanoid(),
      name: `${source.name} mapped by ${projectSource}`,
      mode: 'text',
      extInfo: {
        extOpt: 'LaTiao.$map',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          projector: projectSource,
        },
      },
      out: false,
    };

    const origin = await context.col(source) as string[];
    const project = new Function('d', 'i', `return ${projectSource}`) as (d: string, i: number) => any;

    context.write(field, origin.map((d, i) => {
      const t = project(d, i);
      return typeof t === 'string' ? t : '';
    }));

    return field;
  },
});
