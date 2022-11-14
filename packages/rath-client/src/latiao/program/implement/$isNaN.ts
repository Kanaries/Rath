import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator({
  name: '$isNaN',
  args: ['RATH.FIELD::set'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [source]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `${source.name} is NaN`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$isNaN',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => Number.isNaN(d) ? '1' : '0'));

    return field;
  },
});

subscribeOperator({
  name: '$isNaN',
  args: ['RATH.FIELD::group'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [source]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `${source.name} is NaN`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$isNaN',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => Number.isNaN(d) ? '1' : '0'));

    return field;
  },
});
