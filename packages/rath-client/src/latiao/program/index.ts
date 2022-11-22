import type { IRow } from 'visual-insights';
import type { IRawField } from '../../interfaces';
import { workerService } from '../../services/base';
import { LaTiaoError } from './error';
import type { FieldToken, FieldType } from './token';
// @ts-ignore
import LTWorker from './program.worker?worker';

import type {
  CreateLaTiaoProgramProps,
  CreateLaTiaoProgramResult,
  DestroyLaTiaoProgramProps,
  ExecuteLaTiaoProgramProps,
  ExecuteLaTiaoProgramResult,
  ILaTiaoColumn,
  Static,
} from './types';


// @ts-ignore
const programWorker = new LTWorker() as Worker;

export type Program = {
  run: (source: string) => Promise<number>;
  onError: (handler: (err: LaTiaoError) => void) => void;
  destroy: () => void;
};

export const createProgram = (
  data: Readonly<IRow[]>,
  fields: Omit<FieldToken, 'type'>[],
  load: (fields: Static<FieldToken[]>, data: Static<(number[] | string[])[]>) => void,
): Program => {
  let programId: number | undefined = undefined;
  let errHandler: (err: LaTiaoError) => void = err => {
    throw err;
  };

  const program: Program = {
    run: async source => {
      if (programId === undefined) {
        throw new Error('Program is not loaded yet.');
      }
      try {
        const result = await workerService<ExecuteLaTiaoProgramResult, ExecuteLaTiaoProgramProps>(programWorker, {
          task: 'execute',
          programId,
          source,
        });
        if (result.success) {
          load(result.data.enter, result.data.columns);
          return 0;
        } else {
          throw new LaTiaoError(result.message);
        }
      } catch (error) {
        if (error instanceof LaTiaoError) {
          errHandler(error);
          return -1;
        }
        throw error;
      }
    },
    onError: handler => {
      errHandler = handler;
    },
    destroy: () => {
      if (programId === undefined) {
        throw new Error('Program is not loaded yet.');
      }
      workerService<unknown, DestroyLaTiaoProgramProps>(programWorker, {
        task: 'destroyProgram',
        programId,
      });
    },
  };

  const columns: ILaTiaoColumn<FieldType>[] = [];

  for (const f of fields) {
    const header: CreateLaTiaoProgramProps['data'][number]['info'] = {
      token: {
        ...f,
        type: `RATH.FIELD::${f.mode}`,
      },
    };
    const col = data.map(row => (f.mode === 'text' ? String : f.mode === 'bool' ? ((d: any) => d ? 1 : 0) : Number)(row[f.fid])) as number[] | string[] | (0 | 1)[];
    columns.push({
      info: header,
      data: col,
    });
  }

  try {
    workerService<CreateLaTiaoProgramResult, CreateLaTiaoProgramProps>(programWorker, {
      task: 'createProgram',
      data: columns,
    }).then(result => {
      if (result.success) {
        programId = result.data.programId;
      } else {
        throw new Error(result.message);
      }
    });
  } catch (error) {
    console.error(error);
  }

  return program;
};

export const resolveFields = (tokens: Static<FieldToken[]>): IRawField[] => {
  return tokens.map<IRawField>(token => ({
    fid: token.fid,
    name: token.name,
    analyticType: token.extInfo?.extOpt === 'dateTimeExpand' ? 'dimension' : token.mode === 'vec' ? 'measure' : 'dimension',
    semanticType: token.extInfo?.extOpt === 'dateTimeExpand' ? (
      token.extInfo.extInfo === 'utime' ? 'temporal' : token.extInfo.extInfo === '$y' ? 'quantitative' : 'ordinal'
    ) : ({
      bool: 'nominal',
      vec: 'quantitative',
      set: 'ordinal',
      text: 'nominal',
    } as const)[token.mode],
    geoRole: 'none',
  }));
};


export default createProgram;
