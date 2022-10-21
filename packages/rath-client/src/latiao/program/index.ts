import type { IRow } from 'visual-insights';
import { LaTiaoError, LaTiaoNameError } from './error';
import parse from './parse';
import type { FieldListToken, FieldToken, FieldType } from './token';

import '../implement/$id';
import '../implement/$order';
import exec from './exec';
import { IRawField } from '../../interfaces';


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

// const expandDateToken = async (
//   token: DateToken,
//   data: Readonly<IRow[]>,
//   appendData: (enter: Readonly<IRow[]>) => void,
//   appendFields: (fields: Readonly<IMuteFieldBase[]>) => void,
// ) => {
//   if (token.dimensions.length === 0) {
//     const fid = `${token.fid}.time`;

//     appendFields([{
//       fid,
//       analyticType: 'dimension',
//       semanticType: 'temporal',
//       geoRole: 'none',
//     }]);

//     appendData(data.map(row => {
//       const value = row[token.source];
      
//       return {
//         [fid]: typeof value === 'string' ? Date.parse(value) : value,
//       };
//     }));
//   } else if (token.dimensions.length <= 4 && token.dimensions.every(d => d.match(/^[YMWD]$/))) {
//     for (const member of token.dimensions) {
//       const fid = `${token.fid}.${member}`;

//       appendData(data.map(row => {
//         const value = row[token.source];
        
//         return {
//           [fid]: new Date(typeof value === 'string' ? Date.parse(value) : value)[({
//             Y: 'getFullYear',
//             M: 'getMonth',
//             W: 'getDay',
//             D: 'getDate',
//             h: 'getHours',
//             m: 'getMinutes',
//             s: 'getSeconds',
//           } as const)[member]]() + (member === 'M' ? 1 : 0),
//         };
//       }));

//       appendFields([{
//         fid,
//         analyticType: 'dimension',
//         semanticType: 'ordinal',
//         geoRole: 'none',
//       }]);
//     }
//   } else {
//     throw new LaTiaoParseError(`Failed to parse $Date slice: "${token.dimensions.join("")}"`);
//   }
// };

// export type FunctionIdentifier = {
//   name: string;
//   description: string;
//   args: Readonly<{
//     type: TokenType;
//     /** @default false */
//     optional?: boolean;
//   }[]>;
//   returns: Readonly<TokenType[]>;
//   exec: (
//     data: Readonly<IRow[]>,
//     appendData: (enter: Readonly<IRow[]>) => void,
//     appendFields: (fields: Readonly<IMuteFieldBase[]>) => void,
//     ...args: Token[]
//   ) => Promise<Token[]>;
// };

// const transformSlice = (input: string) => {
//   return input.replaceAll(
//     /\[(?<a>[a-z]*):(?<b>[a-z]*)(:(?<c>[a-z]*))?\]/gi, (...args) => `.slice(${JSON.parse(JSON.stringify(args[7])).a || 'undefined'},${JSON.parse(JSON.stringify(args[7])).b || 'undefined'},${JSON.parse(JSON.stringify(args[7])).c || 'undefined'})`
//   );
// };

// export const FUNCTIONS: Readonly<Readonly<FunctionIdentifier>[]> = [
//   {
//     name: 'ID',
//     description: 'Automatically incrementing id, starting from 1',
//     args: [],
//     returns: ['RATH.FIELD'],
//     exec: async (data, appendData, appendFields) => {
//       const fid = 'id';

//       appendFields([{
//         fid,
//         analyticType: 'dimension',
//         semanticType: 'ordinal',
//         geoRole: 'none',
//       }]);

//       appendData(data.map((_, i) => ({ [fid]: i + 1 })));

//       return [{
//         type: 'RATH.FIELD',
//         fid,
//         mode: 'set',
//       }];
//     },
//   },
//   {
//     name: 'ORDER',
//     description: 'Order by a field and bind the order index, starting from 1',
//     args: [{
//       type: 'RATH.FIELD',
//     }, {
//       type: 'JS.string',
//       optional: true,
//     }],
//     returns: ['RATH.FIELD'],
//     exec: async (data, appendData, appendFields, arg1, arg2) => {
//       const source = (arg1 as FieldToken).fid;
//       const descending = (arg2 as StringToken | undefined)?.value === 'DES';
//       const d = data.map((row, i) => ({
//         value: row[source],
//         index: i,
//       })).sort();

//       const fid = 'order';

//       const order = new Map<number, number>();

//       d.forEach(({ index }, i) => {
//         order.set(index, descending ? (d.length - i) : (i + 1));
//       });

//       appendFields([{
//         fid,
//         analyticType: 'dimension',
//         semanticType: 'ordinal',
//         geoRole: 'none',
//       }]);
      
//       appendData(data.map((_, i) => ({
//         [fid]: order.get(i),
//       })));

//       return [{
//         type: 'RATH.FIELD',
//         fid,
//         mode: 'set',
//       }];
//     },
//   },
//   {
//     name: 'DATE',
//     description: 'Generates a $DATE object',
//     args: [{
//       type: 'RATH.FIELD',
//     }],
//     returns: ['$DATE'],
//     exec: async (data, appendData, appendFields, arg1) => {
//       const source = (arg1 as FieldToken).fid;
//       const fid = `${source}.$Date`;

//       return [{
//         type: '$DATE',
//         source,
//         fid,
//         dimensions: [],
//       }];
//     },
//   },
// ] as const;

// const exec = async (
//   command: ASTExpression,
//   cache: {
//     data: IRow[];
//     fields: IMuteFieldBase[];
//   },
// ): Promise<Token[]> => {
//   switch (command.type) {
//     case 'CallExpression': {
//       const func = command.callee.type === 'Identifier' ? command.callee.name : undefined;

//       if (!func) {
//         throw new LaTiaoParseError('Expect function here.');
//       }

//       const callee = FUNCTIONS.find(which => which.name === func);

//       if (!callee) {
//         throw new LaTiaoParseError(`Function ${func} is not defined.`);
//       }

//                 return value;
//               }
//               case 'StringLiteral': {
//                 return [{
//                   type: 'JS.string',
//                   value: arg.value,
//                 }];
//               }
//               default: {
//                 throw new LaTiaoParseError(`???=${arg.type}`);
//               }
//             }
//           },
//         )
//       )).flat();

//       breakOnUnmatchedArgs(callee, args, cache.fields.map(f => f.fid));

//       const res = await callee.exec(
//         cache.data,
//         enter => enter.forEach((row, i) => {
//           Object.keys(row).forEach(fid => {
//             cache.data[i][fid] = row[fid];
//           });
//         }),
//         fields => cache.fields.push(...fields),
//         ...args,
//       );

//       return res;
//     }
//     case 'MemberExpression': {
//       switch (command.object.type) {
//         // case 'Identifier': {
//         //   return [{
//         //     type: 'RATH.FIELD',
//         //     fid: arg.name,
//         //   }];
//         // }
//         case 'CallExpression': {
//           const value = await exec(command.object, cache);
//           const origin = value[0];

//           if (value.length === 1 && origin.type === '$DATE') {
//             const slicer = command.property.type === 'Identifier' ? command.property.name : '';

//             if (!slicer) {
//               throw new LaTiaoParseError('Expect slice statement here.');
//             }

//             const originDims = origin.dimensions.length === 0 ? ['Y', 'M', 'W', 'D'] as DateObjectDimension[] : origin.dimensions;
//             const nextDims: DateObjectDimension[] = [];

//             for (const member of slicer) {
//               const key = member as DateObjectDimension;

//               if (!originDims.includes(key)) {
//                 throw new LaTiaoParseError(`Dimension "${key}" is not accessible here.`);
//               }

//               nextDims.push(key);
//             }

//             return [{
//               type: '$DATE',
//               source: origin.source,
//               fid: `${origin.source}.${slicer}`,
//               dimensions: nextDims,
//             }];
//           }

//           throw new LaTiaoParseError('Expect one $Date object here.');
//         }
//         // case 'StringLiteral': {
//         //   return [{
//         //     type: 'JS.string',
//         //     value: arg.value,
//         //   }];
//         // }
//         default: {
//           throw new LaTiaoParseError(`!!!=${command.object.type}`);
//         }
//       }
//     }
//     default: {
//       console.log(command);
//       throw new LaTiaoParseError('Expect expression here.');
//     }
//   }
// };

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
    analyticType: token.mode === 'set' ? 'dimension' : 'measure',
    semanticType: ({
      set: 'ordinal',
      group: 'quantitative',
      collection: 'nominal',
    } as const)[token.mode],
    geoRole: 'none',
  }));
};

// (window as any)['createProgram'] = createProgram;


export default createProgram;
