import { nanoid } from 'nanoid';
import { subscribeOperator } from '../program/operator';
import { resolveDependencies } from '../program/parse';
import type { FieldToken } from '../program/token';


subscribeOperator<[], 'RATH.FIELD::collection', 'RATH.FIELD::collection'>({
  name: '$concat',
  args: [],
  trailing: 'RATH.FIELD::collection',
  returns: 'RATH.FIELD::collection',
  exec: async (context, fields) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `Concat {${fields.map(f => f.name).join(',')}}`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$concat',
        extFrom: resolveDependencies(fields.map(f => f.fid), context),
        extInfo: '',
      },
      out: false,
    };

    // @ts-expect-error 这里推断有误
    const cols = await context.cols<'collection'[]>(fields as FieldToken<'collection'>[]) as string[][];

    const concat: string[] = [];

    for (let i = 0; i < context.size; i += 1) {
      const content = cols.map(col => col[i]).join(',');
      concat.push(content);
    }
    
    context.write(field, concat);

    return field;
  },
});

subscribeOperator<['JS.string'], 'RATH.FIELD::collection', 'RATH.FIELD::collection'>({
  name: '$concat',
  args: ['JS.string'],
  trailing: 'RATH.FIELD::collection',
  returns: 'RATH.FIELD::collection',
  exec: async (context, [separator, ...fields]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `Concat {${fields.map(f => f.name).join(separator.value)}}`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$concat',
        extFrom: resolveDependencies(fields.map(f => f.fid), context),
        extInfo: '',
      },
      out: false,
    };

    // @ts-expect-error 这里推断有误
    const cols = await context.cols<'collection'[]>(fields as FieldToken<'collection'>[]) as string[][];

    const concat: string[] = [];

    for (let i = 0; i < context.size; i += 1) {
      const content = cols.map(col => col[i]).join(separator.value);
      concat.push(content);
    }
    
    context.write(field, concat);

    return field;
  },
});
