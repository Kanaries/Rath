import { nanoid } from 'nanoid';
import { subscribeOperator } from '../program/operator';
import { resolveDependencies } from '../program/parse';
import type { FieldToken } from '../program/token';


subscribeOperator<['RATH.FIELD::group', 'JS.string'], 'RATH.FIELD::group'>({
  name: '$map',
  args: ['RATH.FIELD::group', 'JS.string'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [source, { value: projectSource }]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `${source.name} mapped by ${projectSource}`,
      mode: 'group',
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

subscribeOperator<['RATH.FIELD::collection', 'JS.string'], 'RATH.FIELD::collection'>({
  name: '$map',
  args: ['RATH.FIELD::collection', 'JS.string'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [source, { value: projectSource }]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `${source.name} mapped by ${projectSource}`,
      mode: 'collection',
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
