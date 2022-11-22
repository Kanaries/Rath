import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import type { IFieldExtInfoBaseDateTime } from '../../../interfaces';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { DateObjectDimension, DateToken, FieldListToken, FieldToken } from '../token';
import { $DateToField } from './date-slice';


const parseDateTime = (col: readonly string[] | readonly number[]): number[] => {
  return col.map(d => dayjs(d).toDate().getTime());
};

subscribeOperator({
  name: '$toDate',
  args: ['RATH.FIELD::set'],
  returns: '$DATE',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `DateTime (${source.fid})`,
      mode: 'vec',
      out: false,
      extInfo: {
        extOpt: 'dateTimeExpand',
        extFrom: [source.fid],
        extInfo: 'utime',
      },
    };

    const col = await context.col(source);

    const utime = parseDateTime(col);

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
  args: ['RATH.FIELD::vec'],
  returns: '$DATE',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `DateTime (${source.fid})`,
      mode: 'vec',
      out: false,
      extInfo: {
        extOpt: 'dateTimeExpand',
        extFrom: [source.fid],
        extInfo: 'utime',
      },
    };

    const col = await context.col(source);

    const utime = parseDateTime(col);

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
  args: ['RATH.FIELD::text'],
  returns: '$DATE',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `DateTime (${source.fid})`,
      mode: 'vec',
      out: false,
      extInfo: {
        extOpt: 'dateTimeExpand',
        extFrom: [source.fid],
        extInfo: 'utime',
      },
    };

    const col = await context.col(source);

    const utime = parseDateTime(col);

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
  returns: 'RATH.FIELD::bool',
  exec: async (context, [date]) => {
    const data = $DateToField(date);

    const field: FieldToken<'bool'> = {
      type: 'RATH.FIELD::bool',
      fid: nanoid(),
      name: `${(date.exports ?? date.source.name) || (date.source.name || date.source.fid)} is Valid Date`,
      mode: 'bool',
      extInfo: {
        extOpt: 'LaTiao.$isValidDate',
        extFrom: resolveDependencies([data.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(data);

    const dt = parseDateTime(col);
    
    context.write(field, dt.map(d => Number.isFinite(d) && d >= 0 ? 1 : 0));

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
      const field: FieldToken<'vec'> = {
        type: 'RATH.FIELD::vec',
        fid: nanoid(),
        name: `${dim} | ${source.name}`,
        mode: 'vec',
        extInfo: {
          extOpt: 'dateTimeExpand',
          extFrom: resolveDependencies([source.fid], context),
          extInfo: ({
            Y: '$y',
            M: '$M',
            W: '$W',
            D: '$D',
            h: '$H',
            m: '$m',
            s: '$s',
          } as const)[dim],
        } as IFieldExtInfoBaseDateTime,
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

subscribeOperator<['$DATE', 'JS.string'], 'RATH.FIELD::vec'>({
  name: '$__projDate',
  secret: true,
  args: ['$DATE', 'JS.string'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [date, slicer]) => {
    const source = $DateToField(date);
    const utime = await context.col(source);
    const [dim] = slicer.value.split('') as DateObjectDimension[];

    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${dim} | ${source.name}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'dateTimeExpand',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: ({
          Y: '$y',
          M: '$M',
          W: '$W',
          D: '$D',
          h: '$H',
          m: '$m',
          s: '$s',
        } as const)[dim],
      } as IFieldExtInfoBaseDateTime,
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
