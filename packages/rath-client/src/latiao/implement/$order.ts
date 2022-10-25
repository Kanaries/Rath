import { nanoid } from 'nanoid';
import { subscribeOperator } from '../program/operator';
import { resolveDependencies } from '../program/parse';
import type { FieldToken } from '../program/token';


subscribeOperator<['RATH.FIELD::set']>({
  name: '$order',
  args: ['RATH.FIELD::set'],
  returns: 'RATH.FIELD::set',
  exec: async (context, [source]) => {
    const field: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: `Order of ${source.name}`,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$order',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = (await context.col(context.resolveFid(source.fid))) as number[];
    
    const sorted = col.map((d, i) => ({
      value: d,
      index: i,
    })).sort((a, b) => a.value - b.value);

    const order = new Map<number, number>();

    sorted.forEach(({ index }, i) => {
      order.set(index, i + 1);
    });
    
    context.write(field, new Array<0>(context.size).fill(0).map((_, i) => order.get(i) as number));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::group']>({
  name: '$order',
  args: ['RATH.FIELD::group'],
  returns: 'RATH.FIELD::set',
  exec: async (context, [source]) => {
    const field: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: `Order of ${source.name}`,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$order',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = (await context.col(context.resolveFid(source.fid))) as number[];
    
    const sorted = col.map((d, i) => ({
      value: d,
      index: i,
    })).sort((a, b) => a.value - b.value);

    const order = new Map<number, number>();

    sorted.forEach(({ index }, i) => {
      order.set(index, i + 1);
    });
    
    context.write(field, new Array<0>(context.size).fill(0).map((_, i) => order.get(i) as number));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::collection']>({
  name: '$dict',
  args: ['RATH.FIELD::collection'],
  returns: 'RATH.FIELD::set',
  exec: async (context, [source]) => {
    const field: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: `Order of ${source.name}`,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$order',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = (await context.col(context.resolveFid(source.fid))) as string[];
    
    const sorted = col.map((d, i) => ({
      value: d,
      index: i,
    })).sort((a, b) => a.value.localeCompare(b.value));

    const order = new Map<number, number>();

    sorted.forEach(({ index }, i) => {
      order.set(index, i + 1);
    });
    
    context.write(field, new Array<0>(context.size).fill(0).map((_, i) => order.get(i) as number));

    return field;
  },
});
