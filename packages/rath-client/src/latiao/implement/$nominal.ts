import { nanoid } from 'nanoid';
import { subscribeOperator } from '../program/operator';
import { resolveDependencies } from '../program/parse';
import type { FieldToken } from '../program/token';


subscribeOperator({
  name: '$nominal',
  args: ['RATH.FIELD::set'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [source]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: source.name,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$nominal',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => String(d)));

    return field;
  },
});

subscribeOperator({
  name: '$nominal',
  args: ['RATH.FIELD::group'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [source]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: source.name,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$nominal',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => String(d)));

    return field;
  },
});
