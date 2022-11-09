import { nanoid } from 'nanoid';
import { subscribeOperator } from '../program/operator';
import { resolveDependencies } from '../program/parse';
import type { FieldToken } from '../program/token';


subscribeOperator<['RATH.FIELD::collection', 'JS.string'], 'RATH.FIELD::collection'>({
  name: '$match',
  args: ['RATH.FIELD::collection', 'JS.string'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [f, pattern]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `Pattern matched {${f.name}}`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$match',
        extFrom: resolveDependencies([f.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(f) as string[];

    const matched = col.map(str => new RegExp(pattern.value).exec(str)?.[0] ?? '');
    
    context.write(field, matched);

    return field;
  },
});

subscribeOperator<['RATH.FIELD::collection', 'JS.string', 'JS.string'], 'RATH.FIELD::collection'>({
  name: '$replace',
  args: ['RATH.FIELD::collection', 'JS.string', 'JS.string'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [f, pattern, newStr]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `Pattern replaced {${f.name}}`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$replace',
        extFrom: resolveDependencies([f.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(f) as string[];

    const replaced = col.map(str => str.replaceAll(new RegExp(pattern.value, 'g'), newStr.value))
    
    context.write(field, replaced);

    return field;
  },
});
