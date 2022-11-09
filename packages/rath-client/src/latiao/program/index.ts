import type { IRow } from 'visual-insights';
import type { IRawField } from '../../interfaces';
import { LaTiaoError, LaTiaoNameError } from './error';
import parse from './parse';
import type { FieldListToken, FieldToken, FieldType } from './token';
import exec from './exec';

import '../implement/$set';
import '../implement/$group';
import '../implement/$nominal';
import '../implement/$binary';
import '../implement/$id';
import '../implement/$order';
import '../implement/$isNaN';
import '../implement/$isZero';
import '../implement/$toDate';
import '../implement/$normalize';
import '../implement/$concat';
import '../implement/$log';
import '../implement/$clean';
import '../implement/regex';
import '../implement/$partition';


export type Context = {
  originFields: FieldListToken;
  tempFields: FieldListToken;
  resolveFid: (fid: string, loc?: ConstructorParameters<typeof LaTiaoError>[1]) => FieldToken;
  size: number;
  col: <
    T extends FieldType = FieldType,
    D extends T extends 'collection' ? string[] : number[] = T extends 'collection' ? string[] : number[],
  >(field: FieldToken<T>, loc?: ConstructorParameters<typeof LaTiaoError>[1]) => Promise<D>;
  cols: <
    T extends FieldType[] = FieldType[],
    D extends {
      [index in keyof T]: T extends 'collection' ? string[] : number[]
    } = {
      [index in keyof T]: T extends 'collection' ? string[] : number[]
    },
  >(fields: { [index in keyof T]: FieldToken<T[index]> }, loc?: ConstructorParameters<typeof LaTiaoError>[1]) => Promise<D>;
  write: <
    T extends FieldType = FieldType,
    D extends T extends 'collection' ? string[] : number[] = T extends 'collection' ? string[] : number[],
  >(
    field: FieldToken<T>,
    data: D,
  ) => void;
};

export type Program = {
  run: (source: string) => Promise<number>;
  onError: (handler: (err: LaTiaoError) => void) => void;
};

export const createProgram = (
  data: Readonly<IRow[]>,
  fields: Omit<FieldToken, 'type'>[],
  load: (fields: readonly FieldToken[], data: readonly (readonly number[] | readonly string[])[]) => void,
): Program => {
  const originFields: FieldListToken = {
    type: 'RATH.FIELD_LIST',
    tuple: fields.map(f => ({
      ...f,
      type: `RATH.FIELD::${f.mode}`,
    })),
  };
  const tempFields: FieldListToken = {
    type: 'RATH.FIELD_LIST',
    tuple: [],
  };
  const originColumns = new Map<string, number[] | string[]>();

  originFields.tuple.forEach(({ fid, mode }) => {
    const col = data.map(row => (mode === 'collection' ? String : Number)(row[fid])) as number[] | string[];

    originColumns.set(fid, col);
  });

  const size = data.length;

  let errorHandler = (err: LaTiaoError): void => {
    throw err;
  };

  return {
    run: async source => {
      try {
        const columns = new Map<string, number[] | string[]>();

        const context: Context = {
          originFields,
          tempFields,
          size,
          resolveFid: (fid, loc) => {
            const fieldAsOrigin = originFields.tuple.find(f => f.fid === fid);

            if (fieldAsOrigin) {
              return fieldAsOrigin;
            }

            const fieldAsTemp = tempFields.tuple.find(f => f.fid === fid);

            if (fieldAsTemp) {
              return fieldAsTemp;
            }
            
            throw new LaTiaoNameError(`Cannot find field "${fid}"`, loc);
          },
          col: async <
            T extends FieldType = FieldType,
            D extends T extends 'collection' ? string[] : number[] = T extends 'collection' ? string[] : number[],
          >(field: FieldToken<T>, loc?: ConstructorParameters<typeof LaTiaoError>[1]) => {
            const { fid } = field;
            const fieldAsOrigin = originFields.tuple.find(f => f.fid === fid);

            if (fieldAsOrigin) {
              // TODO: async
              return originColumns.get(fid) as D;
            }

            const fieldAsTemp = tempFields.tuple.find(f => f.fid === fid);

            if (fieldAsTemp && columns.has(fid)) {
              // TODO: async
              return columns.get(fid) as D;
            }
            
            throw new LaTiaoNameError(`Cannot find field "${fid}"`, loc);
          },
          cols: async <
            T extends FieldType[] = FieldType[],
            D extends {
              [index in keyof T]: T extends 'collection' ? string[] : number[]
            } = {
              [index in keyof T]: T extends 'collection' ? string[] : number[]
            },
          >(fields: { [index in keyof T]: FieldToken<T[index]> }, loc?: ConstructorParameters<typeof LaTiaoError>[1]) => {
            const res = await Promise.all(fields.map(f => context.col(f, loc)));

            return res as D;
          },
          write: (field, data) => {
            if (originColumns.has(field.fid) || columns.has(field.fid)) {
              throw new LaTiaoNameError(`Field ${field.fid} is already defined.`);
            }
            tempFields.tuple.push(field);
            columns.set(field.fid, data);
          },
        };
        
        const ast = parse(source, context);

        const expArr = await exec(ast, context);

        const enter = expArr.map(fid => context.resolveFid(fid));
        const data = await context.cols(enter);

        load(enter, data);

        return 0;
      } catch (error) {
        if (error instanceof LaTiaoError) {
          errorHandler(error);

          return -1;
        } else {
          throw error;
        }
      }
    },
    onError: handler => errorHandler = handler,
  };
};

export const resolveFields = (tokens: readonly FieldToken[]): IRawField[] => {
  return tokens.map<IRawField>(token => ({
    fid: token.fid,
    name: token.name,
    analyticType: token.extInfo?.extOpt === 'dateTimeExpand' ? 'dimension' : token.mode === 'group' ? 'measure' : 'dimension',
    semanticType: token.extInfo?.extOpt === 'dateTimeExpand' ? (
      token.extInfo.extInfo === 'utime' ? 'temporal' : token.extInfo.extInfo === '$y' ? 'quantitative' : 'ordinal'
    ) : ({
      set: 'ordinal',
      group: 'quantitative',
      collection: 'nominal',
    } as const)[token.mode],
    geoRole: 'none',
  }));
};

// (window as any)['createProgram'] = createProgram;


export default createProgram;
