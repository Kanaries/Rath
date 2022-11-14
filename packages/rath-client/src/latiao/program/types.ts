import type { LaTiaoError } from "./error";
import type { FieldToken, FieldType } from "./token";


export type Static<T> = T extends Record<keyof any, any> ? {
  readonly [index in keyof T]: Static<T[index]>;
} : T;

export type LaTiaoDataType = 'group' | 'set' | 'text' | 'boolean';

type LaTiaoJSType<T extends LaTiaoDataType> = {
  group: number;
  set: number;
  text: string;
  boolean: 0 | 1;
}[T];

type LaTiaoColumnData<T extends LaTiaoDataType> = Static<LaTiaoJSType<T>[]>;

export interface ILaTiaoColumnInfo<T extends LaTiaoDataType> {
  token: FieldToken<T extends 'boolean' | 'text' ? 'collection' : T>;
}

export interface ILaTiaoColumn<T extends LaTiaoDataType> {
  info: Static<ILaTiaoColumnInfo<T>>;
  data: Static<LaTiaoColumnData<T>>;
}

export type CreateLaTiaoProgramProps = {
  task: 'createProgram';
  data: Static<ILaTiaoColumn<LaTiaoDataType>[]>;
};

export type ExecuteLaTiaoProgramProps = {
  task: 'execute';
  programId: number;
  source: string;
};

export type DestroyLaTiaoProgramProps = {
  task: 'destroyProgram';
  programId: number;
};

export type LaTiaoProgramProps = (
  | CreateLaTiaoProgramProps
  | ExecuteLaTiaoProgramProps
  | DestroyLaTiaoProgramProps
);

export interface CreateLaTiaoProgramResult {
  programId: number;
}

export interface ExecuteLaTiaoProgramResult {
  data: Static<ILaTiaoColumn<LaTiaoDataType>[]>;
  /** @deprecated */
  enter: FieldToken<FieldType>[];
  /** @deprecated */
  columns: readonly (number[] | string[])[];
}

export type LaTiaoErrorLocation = ConstructorParameters<typeof LaTiaoError>[1];

export type LaTiaoProgramContext = {
  readonly programId: number;
  readonly originData: CreateLaTiaoProgramProps['data'];
  tempData: CreateLaTiaoProgramProps['data'];
  readonly rowCount: number;
  readonly resolveColId: (colId: string, loc?: LaTiaoErrorLocation) => Static<FieldToken>;
  readonly col: <
    T extends FieldType = FieldType,
    D extends T extends 'collection' ? string[] : number[] = T extends 'collection' ? string[] : number[],
  >(field: FieldToken<T>, loc?: LaTiaoErrorLocation) => Promise<Static<D>>;
  readonly cols: <
    T extends FieldType[] = FieldType[],
    D extends {
      [index in keyof T]: T extends 'collection' ? string[] : number[]
    } = {
      [index in keyof T]: T extends 'collection' ? string[] : number[]
    },
  >(fields: { [index in keyof T]: FieldToken<T[index]> }, loc?: LaTiaoErrorLocation) => Promise<Static<D>>;
  readonly write: <
    T extends FieldType = FieldType,
    D extends T extends 'collection' ? string[] : number[] = T extends 'collection' ? string[] : number[],
  >(
    field: FieldToken<T>,
    data: D,
  ) => void;
  reportError: (err: LaTiaoError) => void;
};
