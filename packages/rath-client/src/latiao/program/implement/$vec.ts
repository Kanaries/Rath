import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator({
  name: '$vec',
  args: ['RATH.FIELD::bool'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: source.name,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$vec',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => d));

    return field;
  },
});

subscribeOperator({
  name: '$vec',
  args: ['RATH.FIELD::text'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: source.name,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$vec',
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
  name: '$vec',
  args: ['RATH.FIELD::set'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [source]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: source.name,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$vec',
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
