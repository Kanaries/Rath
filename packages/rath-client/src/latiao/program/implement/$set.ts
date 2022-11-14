import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator({
  name: '$set',
  args: ['RATH.FIELD::bool'],
  returns: 'RATH.FIELD::set',
  exec: async (context, [source]) => {
    const field: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: source.name,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$set',
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
  name: '$set',
  args: ['RATH.FIELD::text'],
  returns: 'RATH.FIELD::set',
  exec: async (context, [source]) => {
    const field: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: source.name,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$set',
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
  name: '$set',
  args: ['RATH.FIELD::vec'],
  returns: 'RATH.FIELD::set',
  exec: async (context, [source]) => {
    const field: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: source.name,
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$set',
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
