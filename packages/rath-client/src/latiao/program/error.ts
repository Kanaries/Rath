import { prefix } from "./parse";


export const loc = (location: Record<'start' | 'end', { line: number; column: number; }> | undefined): (
  [[number, number], [number, number]] | undefined
) => {
  if (location) {
    const l: [[number, number], [number, number]] = [
      [location.start.line - (prefix.split('\n').length - 1), location.start.column],
      [location.end.line - (prefix.split('\n').length - 1), location.end.column],
    ];

    if (l.flat().some(d => d < 0)) {
      return undefined;
    }

    return l;
  }

  return undefined;
};

export class LaTiaoError extends Error {

  override name = 'LaTiao Error';

  loc: [[number, number], [number, number]] | undefined;

  constructor(msg: string, source?: { loc?: Record<'start' | 'end', { line: number; column: number }> | null }) {
    const location = loc(source?.loc ?? undefined);
    super(
      `${msg}${
        location ? `
  at ${location[0][0]},${location[0][1]}:${location[1][0]},${location[1][1]}` : ''
      }`
    );
    this.loc = loc(source?.loc ?? undefined);
  }

}

export class LaTiaoParseError extends LaTiaoError {

  override name = 'LaTiao Parse Error';

}

export class LaTiaoSyntaxError extends LaTiaoError {

  override name = 'LaTiao Syntax Error';

}

export class LaTiaoNameError extends LaTiaoError {

  override name = 'LaTiao Name Error';

}

export class LaTiaoTypeError extends LaTiaoError {

  override name = 'LaTiao Type Error';

}

export class LaTiaoRuntimeError extends LaTiaoError {

  override name = 'LaTiao Runtime Error';

}
