import { parse } from '@babel/parser';
import type { IRow } from 'visual-insights';
import { IMuteFieldBase } from '../../interfaces';
import { deepcopy } from '../../utils';


type DateObjectDimension = 'Y' | 'M' | 'W' | 'D';

type DateObjectSlicer = (
  | DateObjectDimension
  | `${DateObjectDimension}${DateObjectDimension}`
  | `${DateObjectDimension}${DateObjectDimension}${DateObjectDimension}`
  | `${DateObjectDimension}${DateObjectDimension}${DateObjectDimension}${DateObjectDimension}`
);

export type DateObject = {
  $: number;
} & Record<DateObjectSlicer, DateToken[]>;

const expandDateToken = async (
  token: DateToken,
  data: Readonly<IRow[]>,
  appendData: (enter: Readonly<IRow[]>) => void,
  appendFields: (fields: Readonly<IMuteFieldBase[]>) => void,
) => {
  if (token.dimensions.length === 0) {
    const fid = `${token.fid}.time`;

    appendFields([{
      fid,
      analyticType: 'dimension',
      semanticType: 'temporal',
      geoRole: 'none',
    }]);

    appendData(data.map(row => {
      const value = row[token.source];
      
      return {
        [fid]: typeof value === 'string' ? Date.parse(value) : value,
      };
    }));
  } else if (token.dimensions.length <= 4 && token.dimensions.every(d => d.match(/^[YMWD]$/))) {
    for (const member of token.dimensions) {
      const fid = `${token.fid}.${member}`;

      appendData(data.map(row => {
        const value = row[token.source];
        
        return {
          [fid]: new Date(typeof value === 'string' ? Date.parse(value) : value)[({
            Y: 'getFullYear',
            M: 'getMonth',
            W: 'getDay',
            D: 'getDate',
          } as const)[member]]() + (member === 'M' ? 1 : 0),
        };
      }));

      appendFields([{
        fid,
        analyticType: 'dimension',
        semanticType: 'ordinal',
        geoRole: 'none',
      }]);
    }
  } else {
    throw new LaTiaoParseError(`Failed to parse $Date slice: "${token.dimensions.join("")}"`);
  }
};

const createDateObject = (
  sourceFid: string,
  value: string | number | DateObject
): DateObject => {
  if (typeof value === 'object' && '$' in value) {
    return createDateObject(sourceFid, value.$);
  } else {
    const n = typeof value === 'string' ? Date.parse(value) : value;
    const d = new Date(n);

    return new Proxy<DateObject>(
      { $: n } as DateObject,
      {
        get(target, p, receiver) {
          if (typeof p === 'string' && p.match(/^[YMWD]{1,4}$/)) {
            const tokens: DateToken[] = [];

            for (const member of p) {
              switch (member as DateObjectDimension) {
                case 'Y': {

                }
              }
            }

            return tokens;
          }

          return Reflect.get(target, p, receiver);
        },
      },
    );
  }
};

export type TokenType = (
  | 'JS.string'
  | 'JS.number'
  | 'RATH.FIELD'
  | '$DATE'
);

interface IToken {
  type: TokenType;
}

interface FieldToken extends IToken {
  type: 'RATH.FIELD';
  fid: string;
}

interface StringToken extends IToken {
  type: 'JS.string';
  value: string;
}

interface DateToken extends IToken {
  type: '$DATE';
  source: string;
  fid: string;
  dimensions: DateObjectDimension[];
}

export type Token = (
  | FieldToken
  | StringToken
  | DateToken
);

export type FunctionIdentifier = {
  name: string;
  description: string;
  args: Readonly<{
    type: TokenType;
    /** @default false */
    optional?: boolean;
  }[]>;
  returns: Readonly<TokenType[]>;
  exec: (
    data: Readonly<IRow[]>,
    appendData: (enter: Readonly<IRow[]>) => void,
    appendFields: (fields: Readonly<IMuteFieldBase[]>) => void,
    ...args: Token[]
  ) => Promise<Token[]>;
};

const transformSlice = (input: string) => {
  return input.replaceAll(
    /\[(?<a>[a-z]*):(?<b>[a-z]*)(:(?<c>[a-z]*))?\]/gi, (...args) => `.slice(${JSON.parse(JSON.stringify(args[7])).a || 'undefined'},${JSON.parse(JSON.stringify(args[7])).b || 'undefined'},${JSON.parse(JSON.stringify(args[7])).c || 'undefined'})`
  );
};

export const FUNCTIONS: Readonly<Readonly<FunctionIdentifier>[]> = [
  {
    name: 'ID',
    description: 'Automatically incrementing id, starting from 1',
    args: [],
    returns: ['RATH.FIELD'],
    exec: async (data, appendData, appendFields) => {
      const fid = 'id';

      appendFields([{
        fid,
        analyticType: 'dimension',
        semanticType: 'ordinal',
        geoRole: 'none',
      }]);

      appendData(data.map((_, i) => ({ [fid]: i + 1 })));

      return [{
        type: 'RATH.FIELD',
        fid,
      }];
    },
  },
  {
    name: 'ORDER',
    description: 'Order by a field and bind the order index, starting from 1',
    args: [{
      type: 'RATH.FIELD',
    }, {
      type: 'JS.string',
      optional: true,
    }],
    returns: ['RATH.FIELD'],
    exec: async (data, appendData, appendFields, arg1, arg2) => {
      const source = (arg1 as FieldToken).fid;
      const descending = (arg2 as StringToken | undefined)?.value === 'DES';
      const d = data.map((row, i) => ({
        value: row[source],
        index: i,
      })).sort();

      const fid = 'order';

      const order = new Map<number, number>();

      d.forEach(({ index }, i) => {
        order.set(index, descending ? (d.length - i) : (i + 1));
      });

      appendFields([{
        fid,
        analyticType: 'dimension',
        semanticType: 'ordinal',
        geoRole: 'none',
      }]);
      
      appendData(data.map((_, i) => ({
        [fid]: order.get(i),
      })));

      return [{
        type: 'RATH.FIELD',
        fid,
      }];
    },
  },
  {
    name: 'DATE',
    description: 'Generates a $DATE object',
    args: [{
      type: 'RATH.FIELD',
    }],
    returns: ['$DATE'],
    exec: async (data, appendData, appendFields, arg1) => {
      const source = (arg1 as FieldToken).fid;
      const fid = `${source}.$Date`;

      return [{
        type: '$DATE',
        source,
        fid,
        dimensions: [],
      }];
    },
  },
] as const;

type ASTExpression = (ReturnType<typeof parse>['program']['body'][0] & {
  type: 'ExpressionStatement';
})['expression'];

export class LaTiaoError extends Error {

  override name = 'LaTiao Error';

}

export class LaTiaoParseError extends LaTiaoError {

  override name = 'LaTiao Parse Error';

}

export class LaTiaoRuntimeError extends LaTiaoError {

  override name = 'LaTiao Runtime Error';

}

const breakOnUnmatchedArgs = (
  func: Readonly<FunctionIdentifier>,
  input: Readonly<Token[]>,
  fields: string[],
): void => {
  func.args.forEach((arg, i) => {
    const optional = func.args.slice(i).every(a => a.optional === true);

    if (i >= input.length && !optional) {
      throw new LaTiaoParseError(`Expect ${func.args.length} arguments here, ${input.length} received.`);
    } else if (input[i] && arg.type !== input[i].type) {
      throw new LaTiaoParseError(`Expect ${arg.type} here.`);
    } else if (input[i] && input[i].type === 'RATH.FIELD' && !fields.find(f => f === (input[i] as FieldToken).fid)) {
      throw new LaTiaoParseError(`Field "${(input[i] as FieldToken).fid}" is not defined.`);
    }
  });
};

const exec = async (
  command: ASTExpression,
  cache: {
    data: IRow[];
    fields: IMuteFieldBase[];
  },
): Promise<Token[]> => {
  switch (command.type) {
    case 'CallExpression': {
      const func = command.callee.type === 'Identifier' ? command.callee.name : undefined;

      if (!func) {
        throw new LaTiaoParseError('Expect function here.');
      }

      const callee = FUNCTIONS.find(which => which.name === func);

      if (!callee) {
        throw new LaTiaoParseError(`Function ${func} is not defined.`);
      }

      const args = (await Promise.all(
        command.arguments.map<Promise<Token[]> | Token[]>(
          arg => {
            switch (arg.type) {
              case 'Identifier': {
                return [{
                  type: 'RATH.FIELD',
                  fid: arg.name,
                }];
              }
              case 'CallExpression': {
                const value = exec(arg, cache);
  
                return value;
              }
              case 'StringLiteral': {
                return [{
                  type: 'JS.string',
                  value: arg.value,
                }];
              }
              default: {
                throw new LaTiaoParseError(`???=${arg.type}`);
              }
            }
          },
        )
      )).flat();

      breakOnUnmatchedArgs(callee, args, cache.fields.map(f => f.fid));

      const res = await callee.exec(
        cache.data,
        enter => enter.forEach((row, i) => {
          Object.keys(row).forEach(fid => {
            cache.data[i][fid] = row[fid];
          });
        }),
        fields => cache.fields.push(...fields),
        ...args,
      );

      return res;
    }
    case 'MemberExpression': {
      switch (command.object.type) {
        // case 'Identifier': {
        //   return [{
        //     type: 'RATH.FIELD',
        //     fid: arg.name,
        //   }];
        // }
        case 'CallExpression': {
          const value = await exec(command.object, cache);
          const origin = value[0];

          if (value.length === 1 && origin.type === '$DATE') {
            const slicer = command.property.type === 'Identifier' ? command.property.name : '';

            if (!slicer) {
              throw new LaTiaoParseError('Expect slice statement here.');
            }

            const originDims = origin.dimensions.length === 0 ? ['Y', 'M', 'W', 'D'] as DateObjectDimension[] : origin.dimensions;
            const nextDims: DateObjectDimension[] = [];

            for (const member of slicer) {
              const key = member as DateObjectDimension;

              if (!originDims.includes(key)) {
                throw new LaTiaoParseError(`Dimension "${key}" is not accessible here.`);
              }

              nextDims.push(key);
            }

            return [{
              type: '$DATE',
              source: origin.source,
              fid: `${origin.source}.${slicer}`,
              dimensions: nextDims,
            }];
          }

          throw new LaTiaoParseError('Expect one $Date object here.');
        }
        // case 'StringLiteral': {
        //   return [{
        //     type: 'JS.string',
        //     value: arg.value,
        //   }];
        // }
        default: {
          throw new LaTiaoParseError(`!!!=${command.object.type}`);
        }
      }
    }
    default: {
      console.log(command);
      throw new LaTiaoParseError('Expect expression here.');
    }
  }
};

export type Program = (source: string) => Promise<number>;

export const createProgram = (
  data: Readonly<IRow[]>,
  appendData: (enter: Readonly<IRow[]>) => void,
  appendFields: (fields: Readonly<IMuteFieldBase[]>) => void,
): Program => {
  return async source => {
    try {
      const { program: { body } } = parse(source);

      if (body.length === 0) {
        throw new LaTiaoParseError('Expect statement.');
      } else if (body.length > 1) {
        throw new LaTiaoParseError('Expect only one statement.');
      } else if (body[0].type !== 'ExpressionStatement') {
        throw new LaTiaoParseError('Expect expression here.');
      } else {
        const command = body[0];

        const copy = deepcopy(data) as IRow[];
        const fields = Object.keys(copy[0]).map<IMuteFieldBase>(k => ({
          fid: k,
          analyticType: '?',
          semanticType: '?',
          geoRole: '?',
        }));

        const originFieldCount = fields.length;

        const cache = {
          data: copy,
          fields,
        };

        const res = await exec(
          command.expression,
          cache,
        );

        for await (const r of res) {
          if (r.type === '$DATE') {
            await expandDateToken(
              r,
              cache.data,
              enter => enter.forEach((row, i) => {
                Object.keys(row).forEach(fid => {
                  cache.data[i][fid] = row[fid];
                });
              }),
              fields => cache.fields.push(...fields),
            );
          }
        }

        cache.fields.splice(0, originFieldCount);

        // appendData(cache.data);
        // appendFields(cache.fields);

        console.log(cache);
      }

      return 0;
    } catch (error) {
      console.error(error);

      throw error;
    }
  };
};

(window as any)['createProgram'] = createProgram;


export default createProgram;
