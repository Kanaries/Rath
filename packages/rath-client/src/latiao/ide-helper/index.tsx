import { Fragment } from 'react';
import { IRawField } from '../../interfaces';
import { getOperatorList } from '../program/operator';
import { validNameRegExp } from '../program/parse';


const color = (token: string, prev: string | null, fields: readonly IRawField[]): JSX.Element => {
  if (token === 'out') {
    return (
      <span style={{ color: '#c239b3' }}>
        {token}
      </span>
    );
  } else if (token.match(/^ +$/)) {
    return (
      <Fragment>
        {new Array<0>(token.length).fill(0).map((_, i) => (
          <span
            key={i}
            style={{
              backgroundImage: 'radial-gradient(circle, #8884 12%, transparent 12%)',
              backgroundPosition: '50% 1.45em',
            }}
          >
            {' '}
          </span>
        ))}
      </Fragment>
    );
  } else if (token.match(/^('[^']*')|("[^"]*")$/)) {
    return (
      <span style={{ color: 'rgb(251,103,55)' }}>
        {token}
      </span>
    );
  } else if (['(', ')', ',', '.', ';'].includes(token)) {
    return (
      <span style={{ color: '#0f6cbd' }}>
        {token}
      </span>
    );
  } else if (/^[*+-/]$/.test(token)) {
    return (
      <span style={{ color: 'rgb(193,118,11)' }}>
        {token}
      </span>
    );
  } else if (token.startsWith('$')) {
    if (getOperatorList().find(op => op.name === token)) {
      return (
        <span style={{ color: 'rgb(237,167,15)' }}>
          {token}
        </span>
      );
    }

    return (
      <span
        style={{
          color: 'rgba(237,167,15,0.67)',
          backgroundImage: 'linear-gradient(to top, transparent 1px, red 1px, red 2px, transparent 2px)',
        }}
      >
        {token}
      </span>
    );
  } else if (prev === 'out') {
    if (validNameRegExp.test(token)) {
      return (
        <span
          style={{
            backgroundColor: '#107c1040',
            borderRadius: '0.2em',
          }}
        >
          {token}
        </span>
      );
    }

    return (
      <span
        style={{
          backgroundColor: '#107c1015',
          backgroundImage: 'linear-gradient(to top, transparent 1px, red 1px, red 2px, transparent 2px)',
          borderRadius: '0.2em',
        }}
      >
        {token}
      </span>
    );
  } else if (fields.find(f => f.fid === token)) {
    return (
      <span
        style={{
          backgroundColor: '#0f6cbd30',
          borderRadius: '0.2em',
        }}
      >
        {token}
      </span>
    );
  } else if (token.match(/\s*/)) {
    return (
      <span>
        {token}
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundImage: 'linear-gradient(to top, transparent 1px, red 1px, red 2px, transparent 2px)',
      }}
    >
      {token}
    </span>
  );
};

export const rich = (source: string, fields: readonly IRawField[]): JSX.Element => {
  const tokens: JSX.Element[] = [];

  let temp = source;
  let prev: string | null = null;

  while (temp) {
    const next = /^(\s+|('[^']*')|("[^"]*")|[*+-/]|[$\w]+|\(|\)|,|\.)/.exec(temp)?.[0];
    
    if (next) {
      tokens.push(color(next, prev, fields));
      temp = temp.slice(next.length);
      prev = next.match(/^\s+$/) ? prev : next;
    } else {
      tokens.push(color(temp, prev, fields));
      break;
    }
  }

  return (
    <>
      {tokens.map((t, i) => (
        <Fragment key={i}>
          {t}
        </Fragment>
      ))}
    </>
  );
};
