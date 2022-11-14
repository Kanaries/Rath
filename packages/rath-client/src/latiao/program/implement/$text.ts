import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


subscribeOperator({
  name: '$nominal',
  args: ['RATH.FIELD::bool'],
  returns: 'RATH.FIELD::text',
  exec: async (context, [source]) => {
    const field: FieldToken<'text'> = {
      type: 'RATH.FIELD::text',
      fid: nanoid(),
      name: source.name,
      mode: 'text',
      extInfo: {
        extOpt: 'LaTiao.$text',
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
  args: ['RATH.FIELD::set'],
  returns: 'RATH.FIELD::text',
  exec: async (context, [source]) => {
    const field: FieldToken<'text'> = {
      type: 'RATH.FIELD::text',
      fid: nanoid(),
      name: source.name,
      mode: 'text',
      extInfo: {
        extOpt: 'LaTiao.$text',
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
  args: ['RATH.FIELD::vec'],
  returns: 'RATH.FIELD::text',
  exec: async (context, [source]) => {
    const field: FieldToken<'text'> = {
      type: 'RATH.FIELD::text',
      fid: nanoid(),
      name: source.name,
      mode: 'text',
      extInfo: {
        extOpt: 'LaTiao.$text',
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
