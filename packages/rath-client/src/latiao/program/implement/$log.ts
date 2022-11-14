import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator({
  name: '$log',
  args: ['RATH.FIELD::group'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `log(${source.name})`,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$log',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    
    context.write(field, col.map(d => Math.log(d || NaN)));

    return field;
  },
});

subscribeOperator({
  name: '$log1p',
  args: ['RATH.FIELD::group'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `log1p(${source.name})`,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$log',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    
    context.write(field, col.map(d => Math.log((1 + d) || NaN)));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::group', 'JS.number'], 'RATH.FIELD::group'>({
  name: '$log',
  args: ['RATH.FIELD::group', 'JS.number'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [source, { value: base }]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `log ${base} (${source.name})`,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$log',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    
    context.write(field, col.map(d => Math.log(d) / Math.log(base || NaN)));

    return field;
  },
});

subscribeOperator({
  name: '$log2',
  args: ['RATH.FIELD::group'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `log2(${source.name})`,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$log2',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    
    context.write(field, col.map(d => Math.log2(d || NaN)));

    return field;
  },
});

subscribeOperator({
  name: '$log10',
  args: ['RATH.FIELD::group'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `log10(${source.name})`,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$log10',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    
    context.write(field, col.map(d => Math.log10(d || NaN)));

    return field;
  },
});
