import { nanoid } from 'nanoid';
import { expandDateTimeService } from '../../dev/services';
import type { IRow } from '../../interfaces';
import { resolveFields } from '../program';
import { subscribeOperator } from '../program/operator';
import { resolveDependencies } from '../program/parse';
import type { DateObjectDimension, DateToken, FieldListToken, FieldToken } from '../program/token';
import { $DateToField } from './date-slice';


const parseDateTime = async (field: FieldToken, col: string[] | number[]): Promise<number[]> => {
  const data: IRow[] = [];
  const f = resolveFields([field])[0];

  for (const d of col) {
    data.push({ [f.fid]: d });
  }

  const res = await expandDateTimeService({
    dataSource: data,
    fields: [f],
  });

  const which = res.fields.find(f => f.extInfo?.extOpt === 'dateTimeExpand' && f.extInfo?.extInfo === 'utime')?.fid;

  const utime = which ? res.dataSource.map(row => row[which] as number) : col.map(_ => NaN);

  return utime;
};

subscribeOperator({
  name: '$toDate',
  args: ['RATH.FIELD::set'],
  returns: '$DATE',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `DateTime (${source.fid})`,
      mode: 'group',
      out: false,
      extInfo: {
        extOpt: 'dateTimeExpand',
        extFrom: [source.fid],
        extInfo: 'utime',
      },
    };

    const col = await context.col(source);

    const utime = await parseDateTime(field, col);

    context.write(field, utime);

    const date: DateToken = {
      type: '$DATE',
      source: field,
      dimensions: 'all',
      exports: false,
    };

    return date;
  },
});

subscribeOperator({
  name: '$toDate',
  args: ['RATH.FIELD::group'],
  returns: '$DATE',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `DateTime (${source.fid})`,
      mode: 'group',
      out: false,
      extInfo: {
        extOpt: 'dateTimeExpand',
        extFrom: [source.fid],
        extInfo: 'utime',
      },
    };

    const col = await context.col(source);

    const utime = await parseDateTime(field, col);

    context.write(field, utime);

    const date: DateToken = {
      type: '$DATE',
      source: field,
      dimensions: 'all',
      exports: false,
    };

    return date;
  },
});

subscribeOperator({
  name: '$toDate',
  args: ['RATH.FIELD::collection'],
  returns: '$DATE',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `DateTime (${source.fid})`,
      mode: 'group',
      out: false,
      extInfo: {
        extOpt: 'dateTimeExpand',
        extFrom: [source.fid],
        extInfo: 'utime',
      },
    };

    const col = await context.col(source);

    const utime = await parseDateTime(field, col);

    context.write(field, utime);

    const date: DateToken = {
      type: '$DATE',
      source: field,
      dimensions: 'all',
      exports: false,
    };

    return date;
  },
});

subscribeOperator({
  name: '$toDate',
  args: ['$DATE'],
  returns: '$DATE',
  exec: async (context, [source]) => {
    const base = source.source;

    const date: DateToken = {
      type: '$DATE',
      source: base,
      dimensions: 'all',
      exports: false,
    };

    return date;
  },
});

subscribeOperator({
  name: '$isValidDate',
  args: ['$DATE'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [date]) => {
    const data = $DateToField(date);

    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `${(date.exports ?? date.source.name) || (date.source.name || date.source.fid)} is Valid Date`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$isValidDate',
        extFrom: resolveDependencies([data.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(data);

    await parseDateTime(field, col);
    
    context.write(field, col.map(d => new Date(d).getTime() >= 0 ? '0' : '1'));

    return field;
  },
});

subscribeOperator<['$DATE', 'JS.string'], 'RATH.FIELD_LIST'>({
  name: '$__sliceDate',
  secret: true,
  args: ['$DATE', 'JS.string'],
  returns: 'RATH.FIELD_LIST',
  exec: async (context, [date, slicer]) => {
    const source = $DateToField(date);
    const utime = await context.col(source);
    const dims = slicer.value.split('') as DateObjectDimension[];

    const fields: FieldListToken = {
      type: 'RATH.FIELD_LIST',
      tuple: [],
    };

    for await (const dim of dims) {
      const field: FieldToken<'group'> = {
        type: 'RATH.FIELD::group',
        fid: nanoid(),
        name: `${dim} | ${source.name}`,
        mode: 'group',
        extInfo: {
          extOpt: 'LaTiao.$isValidDate',
          extFrom: resolveDependencies([source.fid], context),
          extInfo: '',
        },
        out: false,
      };
    
      context.write(field, utime.map(d => new Date(d)[({
        Y: 'getFullYear',
        M: 'getMonth',
        W: 'getDay',
        D: 'getDate',
        h: 'getHours',
        m: 'getMinutes',
        s: 'getSeconds',
      } as const)[dim]]() + (dim === 'M' ? 1 : 0)));

      fields.tuple.push(field);
    }

    return fields;
  },
});

subscribeOperator<['$DATE', 'JS.string'], 'RATH.FIELD::group'>({
  name: '$__projDate',
  secret: true,
  args: ['$DATE', 'JS.string'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [date, slicer]) => {
    const source = $DateToField(date);
    const utime = await context.col(source);
    const [dim] = slicer.value.split('') as DateObjectDimension[];

    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: `${dim} | ${source.name}`,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$isValidDate',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };
    
    context.write(field, utime.map(d => new Date(d)[({
      Y: 'getFullYear',
      M: 'getMonth',
      W: 'getDay',
      D: 'getDate',
      h: 'getHours',
      m: 'getMinutes',
      s: 'getSeconds',
    } as const)[dim]]() + (dim === 'M' ? 1 : 0)));

    return field;
  },
});