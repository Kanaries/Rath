import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator<['RATH.FIELD::text', 'JS.string'], 'RATH.FIELD::text'>({
  name: '$match',
  args: ['RATH.FIELD::text', 'JS.string'],
  returns: 'RATH.FIELD::text',
  exec: async (context, [f, pattern]) => {
    const field: FieldToken<'text'> = {
      type: 'RATH.FIELD::text',
      fid: nanoid(),
      name: `Pattern matched {${f.name}}`,
      mode: 'text',
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

subscribeOperator<['RATH.FIELD::text', 'JS.string', 'JS.string'], 'RATH.FIELD::text'>({
  name: '$replace',
  args: ['RATH.FIELD::text', 'JS.string', 'JS.string'],
  returns: 'RATH.FIELD::text',
  exec: async (context, [f, pattern, newStr]) => {
    const field: FieldToken<'text'> = {
      type: 'RATH.FIELD::text',
      fid: nanoid(),
      name: `Pattern replaced {${f.name}}`,
      mode: 'text',
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
