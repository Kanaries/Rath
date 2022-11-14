import { nanoid } from 'nanoid';
import { subscribeOperator } from '../operator';
import { resolveDependencies } from '../parse';
import type { FieldToken } from '../token';


// ADD +

subscribeOperator({
  name: '$__add',
  secret: true,
  args: ['RATH.FIELD::vec', 'RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [a, b]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} + ${b.name || b.fid}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$add',
        extFrom: resolveDependencies([a.fid, b.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const [col1, col2] = await context.cols([a, b]);
    
    context.write(field, new Array<0>(context.rowCount).fill(0).map((_, i) => col1[i] + col2[i]));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::vec', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$__add',
  secret: true,
  args: ['RATH.FIELD::vec', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [a, { value: num }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} + ${num}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$add',
        extFrom: resolveDependencies([a.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(a) as number[];
    
    context.write(field, col.map(d => d + num));

    return field;
  },
});

subscribeOperator<['JS.number', 'RATH.FIELD::vec'], 'RATH.FIELD::vec'>({
  name: '$__add',
  secret: true,
  args: ['JS.number', 'RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [{ value: num }, a]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} + ${num}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$add',
        extFrom: resolveDependencies([a.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(a) as number[];
    
    context.write(field, col.map(d => d + num));

    return field;
  },
});

subscribeOperator<['JS.number', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$__add',
  secret: true,
  args: ['JS.number', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [{ value: a }, { value: b }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a} + ${b}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$add',
        extFrom: [],
        extInfo: '',
      },
      out: false,
    };

    context.write(field, new Array<0>(context.rowCount).fill(0).map(_ => a + b));

    return field;
  },
});

// MINUS -

subscribeOperator({
  name: '$__minus',
  secret: true,
  args: ['RATH.FIELD::vec', 'RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [a, b]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} - ${b.name || b.fid}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$minus',
        extFrom: resolveDependencies([a.fid, b.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const [col1, col2] = await context.cols([a, b]);
    
    context.write(field, new Array<0>(context.rowCount).fill(0).map((_, i) => col1[i] - col2[i]));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::vec', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$__minus',
  secret: true,
  args: ['RATH.FIELD::vec', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [a, { value: num }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} - ${num}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$minus',
        extFrom: resolveDependencies([a.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(a) as number[];
    
    context.write(field, col.map(d => d - num));

    return field;
  },
});

subscribeOperator<['JS.number', 'RATH.FIELD::vec'], 'RATH.FIELD::vec'>({
  name: '$__minus',
  secret: true,
  args: ['JS.number', 'RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [{ value: num }, a]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} - ${num}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$minus',
        extFrom: resolveDependencies([a.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(a) as number[];
    
    context.write(field, col.map(d => d - num));

    return field;
  },
});

subscribeOperator<['JS.number', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$__minus',
  secret: true,
  args: ['JS.number', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [{ value: a }, { value: b }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a} - ${b}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$minus',
        extFrom: [],
        extInfo: '',
      },
      out: false,
    };

    context.write(field, new Array<0>(context.rowCount).fill(0).map(_ => a - b));

    return field;
  },
});

// MULTIPLY *

subscribeOperator({
  name: '$__multiply',
  secret: true,
  args: ['RATH.FIELD::vec', 'RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [a, b]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} * ${b.name || b.fid}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$multiply',
        extFrom: resolveDependencies([a.fid, b.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const [col1, col2] = await context.cols([a, b]);
    
    context.write(field, new Array<0>(context.rowCount).fill(0).map((_, i) => col1[i] * col2[i]));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::vec', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$__multiply',
  secret: true,
  args: ['RATH.FIELD::vec', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [a, { value: num }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} * ${num}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$multiply',
        extFrom: resolveDependencies([a.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(a) as number[];
    
    context.write(field, col.map(d => d * num));

    return field;
  },
});

subscribeOperator<['JS.number', 'RATH.FIELD::vec'], 'RATH.FIELD::vec'>({
  name: '$__multiply',
  secret: true,
  args: ['JS.number', 'RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [{ value: num }, a]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} * ${num}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$multiply',
        extFrom: resolveDependencies([a.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(a) as number[];
    
    context.write(field, col.map(d => d * num));

    return field;
  },
});

subscribeOperator<['JS.number', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$__multiply',
  secret: true,
  args: ['JS.number', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [{ value: a }, { value: b }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a} * ${b}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$multiply',
        extFrom: [],
        extInfo: '',
      },
      out: false,
    };

    context.write(field, new Array<0>(context.rowCount).fill(0).map(_ => a * b));

    return field;
  },
});

// DIVIDE /

subscribeOperator({
  name: '$__divide',
  secret: true,
  args: ['RATH.FIELD::vec', 'RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [a, b]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} / ${b.name || b.fid}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$divide',
        extFrom: resolveDependencies([a.fid, b.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const [col1, col2] = await context.cols([a, b]);
    
    context.write(field, new Array<0>(context.rowCount).fill(0).map((_, i) => col1[i] / col2[i]));

    return field;
  },
});

subscribeOperator<['RATH.FIELD::vec', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$__divide',
  secret: true,
  args: ['RATH.FIELD::vec', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [a, { value: num }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} / ${num}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$divide',
        extFrom: resolveDependencies([a.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(a) as number[];
    
    context.write(field, col.map(d => d / num));

    return field;
  },
});

subscribeOperator<['JS.number', 'RATH.FIELD::vec'], 'RATH.FIELD::vec'>({
  name: '$__divide',
  secret: true,
  args: ['JS.number', 'RATH.FIELD::vec'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [{ value: num }, a]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a.name || a.fid} / ${num}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$divide',
        extFrom: resolveDependencies([a.fid], context),
        extInfo: '',
      },
      out: false,
    };

    const col = await context.col(a) as number[];
    
    context.write(field, col.map(d => d / num));

    return field;
  },
});

subscribeOperator<['JS.number', 'JS.number'], 'RATH.FIELD::vec'>({
  name: '$__divide',
  secret: true,
  args: ['JS.number', 'JS.number'],
  returns: 'RATH.FIELD::vec',
  exec: async (context, [{ value: a }, { value: b }]) => {
    const field: FieldToken<'vec'> = {
      type: 'RATH.FIELD::vec',
      fid: nanoid(),
      name: `${a} / ${b}`,
      mode: 'vec',
      extInfo: {
        extOpt: 'LaTiao.$divide',
        extFrom: [],
        extInfo: '',
      },
      out: false,
    };

    context.write(field, new Array<0>(context.rowCount).fill(0).map(_ => a / b));

    return field;
  },
});
