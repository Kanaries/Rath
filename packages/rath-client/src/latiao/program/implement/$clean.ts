import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator({
  name: '$zeroFill',
  args: ['RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `Cleaned ${source.name} (zero fill)`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$zeroFill',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    
    context.write(field, col.map(d => Number.isFinite(d) ? d : 0));

    return field;
  },
});

subscribeOperator({
  name: '$meanFill',
  args: ['RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `Cleaned ${source.name} (mean fill)`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$meanFill',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    const validNum = col.filter(d => Number.isFinite(d));
    const mean = validNum.reduce<number>((sum, d) => sum + d, 0) / validNum.length;
    
    context.write(field, col.map(d => Number.isFinite(d) ? d : mean));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::vec', 'JS.number', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$nearestClip',
  args: ['RATH.FIELD::vec', 'JS.number', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source, { value: min }, { value: max }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `Cleaned ${source.name} (${min} ~ ${max} nearest)`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$nearestClip',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    
    context.write(field, col.map(d => Number.isFinite(d) ? (
      Math.max(min, Math.min(max, d))
    ) : d));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::vec', 'JS.number', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$meanClip',
  args: ['RATH.FIELD::vec', 'JS.number', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source, { value: min }, { value: max }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `Cleaned ${source.name} (${min} ~ ${max} mean)`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$meanClip',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    const validNum = col.filter(d => Number.isFinite(d));
    const mean = validNum.reduce<number>((sum, d) => sum + d, 0) / validNum.length;
    
    context.write(field, col.map(d => Number.isFinite(d) ? (
      d >= min && d <= max ? d : mean
    ) : d));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::vec'], 'RATH.FIELD::vec'>({
  name: '$boxClip',
  args: ['RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `Cleaned ${source.name} (boxClip)`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$boxClip',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    const validNum = col.filter(d => Number.isFinite(d));

    const ranks: number[] = [];
    
    validNum.map((d, i) => ({
      value: d,
      index: i,
    })).sort((a, b) => a.value - b.value).forEach(((d, i) => {
      ranks[i] = validNum[d.index];
    }));

    const validCount = validNum.length;

    const Q1l = ranks[Math.floor(validCount / 4)];
    const Q1r = ranks[Math.ceil(validCount / 4)];
    const Q1 = Q1l * 0.75 + Q1r * 0.25;
    const Q3l = ranks[Math.floor(validCount * 3 / 4)];
    const Q3r = ranks[Math.ceil(validCount * 3 / 4)];
    const Q3 = Q3l * 0.25 + Q3r * 0.75;
    const IQR = Q3 - Q1;
    const min = Q1 - 1.5 * IQR;
    const max = Q3 + 1.5 * IQR;

    context.write(field, col.map(d => Number.isFinite(d) ? (
      Math.max(min, Math.min(max, d))
    ) : d));

    return field;
  },
});
