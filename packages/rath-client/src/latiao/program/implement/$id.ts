import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import type { FieldToken } from '../token';


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
    
    context.write(field, new Array<0>(context.rowCount).fill(0).map((_, i) => i + 1));

    return field;
  },
});
