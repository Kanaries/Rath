import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator<[], 'RATH.FIELD::text', 'RATH.FIELD::text'>({
  name: '$concat',
  args: [],
  trailing: 'RATH.FIELD::text',
  returns: 'RATH.FIELD::text',
  exec: async (context, fields) => {
    const field: FieldToken<'text'> = {
      type: 'RATH.FIELD::text',
      fid: nanoid(),
      name: `Concat {${fields.map(f => f.name).join(',')}}`,
      mode: 'text',
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

    for (let i = 0; i < context.rowCount; i += 1) {
      const content = cols.map(col => col[i]).join(',');
      concat.push(content);
    }
    
    context.write(field, concat);

    return field;
  },
});

subscribeOperator<['JS.string'], 'RATH.FIELD::text', 'RATH.FIELD::text'>({
  name: '$concat',
  args: ['JS.string'],
  trailing: 'RATH.FIELD::text',
  returns: 'RATH.FIELD::text',
  exec: async (context, [separator, ...fields]) => {
    const field: FieldToken<'text'> = {
      type: 'RATH.FIELD::text',
      fid: nanoid(),
      name: `Concat {${fields.map(f => f.name).join(separator.value)}}`,
      mode: 'text',
      extInfo: {
        extOpt: 'LaTiao.$concat',
        extFrom: resolveDependencies(fields.map(f => f.fid), context),
        extInfo: '',
      },
      out: false,
    };

    // @ts-expect-error 这里推断有误
    const cols = await context.cols<'text'[]>(fields as FieldToken<'text'>[]) as string[][];

    const concat: string[] = [];

    for (let i = 0; i < context.rowCount; i += 1) {
      const content = cols.map(col => col[i]).join(separator.value);
      concat.push(content);
    }
    
    context.write(field, concat);

    return field;
  },
});
