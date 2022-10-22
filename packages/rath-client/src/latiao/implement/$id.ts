import { nanoid } from 'nanoid';
import { subscribeOperator } from '../program/operator';
import type { FieldToken } from '../program/token';


subscribeOperator({
  name: '$id',
  args: [],
  returns: 'RATH.FIELD::set',
  exec: async context => {
    const field: FieldToken<'set'> = {
      type: 'RATH.FIELD::set',
      fid: nanoid(),
      name: 'Data ID',
      mode: 'set',
      extInfo: {
        extOpt: 'LaTiao.$id',
        extFrom: [],
        extInfo: '',
      },
      out: false,
    };
    
    context.write(field, new Array<0>(context.size).fill(0).map((_, i) => i + 1));

    return field;
  },
});
