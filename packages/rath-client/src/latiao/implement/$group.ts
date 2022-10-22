import { nanoid } from 'nanoid';
import { subscribeOperator } from '../program/operator';
import { resolveDependencies } from '../program/parse';
import type { FieldToken } from '../program/token';


subscribeOperator({
  name: '$group',
  args: ['RATH.FIELD::collection'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: source.name,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$group',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => Number(d)));

    return field;
  },
});

subscribeOperator({
  name: '$group',
  args: ['RATH.FIELD::set'],
  returns: 'RATH.FIELD::group',
  exec: async (context, [source]) => {
    const field: FieldToken<'group'> = {
      type: 'RATH.FIELD::group',
      fid: nanoid(),
      name: source.name,
      mode: 'group',
      extInfo: {
        extOpt: 'LaTiao.$group',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source) as number[];
    
    context.write(field, [...col]);

    return field;
  },
});
