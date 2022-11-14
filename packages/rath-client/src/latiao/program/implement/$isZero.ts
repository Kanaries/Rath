import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator({
  name: '$isZero',
  args: ['RATH.FIELD::set'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [source]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `${source.name} is Zero`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$isZero',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => d === 0 ? '1' : '0'));

    return field;
  },
});

subscribeOperator({
  name: '$isZero',
  args: ['RATH.FIELD::group'],
  returns: 'RATH.FIELD::collection',
  exec: async (context, [source]) => {
    const field: FieldToken<'collection'> = {
      type: 'RATH.FIELD::collection',
      fid: nanoid(),
      name: `${source.name} is Zero`,
      mode: 'collection',
      extInfo: {
        extOpt: 'LaTiao.$isZero',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => d === 0 ? '1' : '0'));

    return field;
  },
});
