import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator({
  name: '$bool',
  args: ['RATH.FIELD::vec'],
  returns: 'RATH.FIELD::bool',
  exec: async (context, [source]) => {
    const field: FieldToken<'bool'> = {
      type: 'RATH.FIELD::bool',
      fid: nanoid(),
      name: source.name,
      mode: 'bool',
      extInfo: {
        extOpt: 'LaTiao.$bool',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => d ? 1 : 0));

    return field;
  },
});

subscribeOperator({
  name: '$bool',
  args: ['RATH.FIELD::set'],
  returns: 'RATH.FIELD::bool',
  exec: async (context, [source]) => {
    const field: FieldToken<'bool'> = {
      type: 'RATH.FIELD::bool',
      fid: nanoid(),
      name: source.name,
      mode: 'bool',
      extInfo: {
        extOpt: 'LaTiao.$bool',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => d ? 1 : 0));

    return field;
  },
});

subscribeOperator({
  name: '$bool',
  args: ['RATH.FIELD::text'],
  returns: 'RATH.FIELD::bool',
  exec: async (context, [source]) => {
    const field: FieldToken<'bool'> = {
      type: 'RATH.FIELD::bool',
      fid: nanoid(),
      name: source.name,
      mode: 'bool',
      extInfo: {
        extOpt: 'LaTiao.$bool',
        extFrom: resolveDependencies([source.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(source);
    
    context.write(field, col.map(d => d ? 1 : 0));

    return field;
  },
});
