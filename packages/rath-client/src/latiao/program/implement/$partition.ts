/* eslint-disable no-new-func */
import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldListToken, FieldToken } from '../token';


subscribeOperator<['RATH.FIELD::group', 'JS.string'], 'RATH.FIELD_LIST'>({
  name: '$partition',
  args: ['RATH.FIELD::group', 'JS.string'],
  returns: 'RATH.FIELD_LIST',
  exec: async (context, [source, { value: predicateSource }]) => {
    const fieldTrue: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `${source.name} where ${predicateSource}`,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$partition',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          predictor: predicateSource,
          value: true,
        },
      },
      out: false,
    };

    const fieldFalse: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `${source.name} where not ${predicateSource}`,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$partition',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          predictor: predicateSource,
          value: true,
        },
      },
      out: false,
    };

    const fields: FieldListToken = {
      type: 'RATH.FIELD_LIST',
      tuple: [fieldTrue, fieldFalse],
    };

    const origin = await context.col(source) as number[];
    const predicate = new Function('d', `return ${predicateSource}`) as (d: number) => boolean;

    context.write(fieldTrue, origin.map(d => predicate(d) ? d : NaN));
    context.write(fieldFalse, origin.map(d => predicate(d) ? NaN : d));

    return fields;
  },
});

subscribeOperator<['RATH.FIELD::set', 'JS.string'], 'RATH.FIELD_LIST'>({
  name: '$partition',
  args: ['RATH.FIELD::set', 'JS.string'],
  returns: 'RATH.FIELD_LIST',
  exec: async (context, [source, { value: predicateSource }]) => {
    const fieldTrue: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: `${source.name} where ${predicateSource}`,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$partition',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          predictor: predicateSource,
          value: true,
        },
      },
      out: false,
    };

    const fieldFalse: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: `${source.name} where not ${predicateSource}`,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$partition',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          predictor: predicateSource,
          value: true,
        },
      },
      out: false,
    };

    const fields: FieldListToken = {
      type: 'RATH.FIELD_LIST',
      tuple: [fieldTrue, fieldFalse],
    };

    const origin = await context.col(source) as number[];
    const predicate = new Function('d', `return ${predicateSource}`) as (d: number) => boolean;

    context.write(fieldTrue, origin.map(d => predicate(d) ? d : NaN));
    context.write(fieldFalse, origin.map(d => predicate(d) ? NaN : d));

    return fields;
  },
});

subscribeOperator<['RATH.FIELD::collection', 'JS.string'], 'RATH.FIELD_LIST'>({
  name: '$partition',
  args: ['RATH.FIELD::collection', 'JS.string'],
  returns: 'RATH.FIELD_LIST',
  exec: async (context, [source, { value: predicateSource }]) => {
    const fieldTrue: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `${source.name} where ${predicateSource}`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$partition',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          predictor: predicateSource,
          value: true,
        },
      },
      out: false,
    };

    const fieldFalse: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `${source.name} where not ${predicateSource}`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$partition',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: {
          predictor: predicateSource,
          value: true,
        },
      },
      out: false,
    };

    const fields: FieldListToken = {
      type: 'RATH.FIELD_LIST',
      tuple: [fieldTrue, fieldFalse],
    };

    const origin = await context.col(source) as string[];
    const predicate = new Function('d', `return ${predicateSource}`) as (d: string) => boolean;

    context.write(fieldTrue, origin.map(d => predicate(d) ? d : ''));
    context.write(fieldFalse, origin.map(d => predicate(d) ? '' : d));

    return fields;
  },
});
