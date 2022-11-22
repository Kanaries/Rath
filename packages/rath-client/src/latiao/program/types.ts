import type { LaTiaoError } from "./error";
import type { FieldToken, FieldType } from "./token";


export type Static<T> = T extends Record<keyof any, any> ? {
  readonly [index in keyof T]: Static<T[index]>;
} : T;

type LaTiaoJSType<T extends FieldType> = {
  bool: 0 | 1;
  vec: number;
  set: number;
  text: string;
}[T];

type LaTiaoColumnData<T extends FieldType> = Static<LaTiaoJSType<T>[]>;

export interface ILaTiaoColumnInfo<T extends FieldType> {
  token: FieldToken<T>;
}

export interface ILaTiaoColumn<T extends FieldType> {
  info: Static<ILaTiaoColumnInfo<T>>;
  data: Static<LaTiaoColumnData<T>>;
}

export type CreateLaTiaoProgramProps = {
  task: 'createProgram';
  data: Static<ILaTiaoColumn<FieldType>[]>;
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
  data: Static<ILaTiaoColumn<FieldType>[]>;
  /** @deprecated */
  enter: Static<FieldToken<FieldType>[]>;
  /** @deprecated */
  columns: Static<(number[] | string[])[]>;
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
    D extends T extends 'text' ? string[] : T extends 'bool' ? (0 | 1)[] : number[] = T extends 'text' ? string[] : T extends 'bool' ? (0 | 1)[] : number[],
  >(field: Static<FieldToken<T>>, loc?: LaTiaoErrorLocation) => Promise<Static<D>>;
  readonly cols: <
    T extends FieldType[] = FieldType[],
    D extends {
      [index in keyof T]: T extends 'text' ? string[] : T extends 'bool' ? (0 | 1)[] : number[]
    } = {
      [index in keyof T]: T extends 'text' ? string[] : T extends 'bool' ? (0 | 1)[] : number[]
    },
  >(fields: Static<{ [index in keyof T]: FieldToken<T[index]> }>, loc?: LaTiaoErrorLocation) => Promise<Static<D>>;
  readonly write: <
    T extends FieldType = FieldType,
    D extends T extends 'text' ? string[] : T extends 'bool' ? (0 | 1)[] : number[] = T extends 'text' ? string[] : T extends 'bool' ? (0 | 1)[] : number[],
  >(
    field: FieldToken<T>,
    data: D,
  ) => void;
  reportError: (err: LaTiaoError) => void;
};
