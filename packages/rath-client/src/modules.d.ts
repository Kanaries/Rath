declare module 'datalib' {
  type statFunc<T> = (values: any[], accessor?: any) => T
  export const count: statFunc<{[key: string]: number}>;
  export const sum: statFunc<number>;
  export const mean: statFunc<number>;
  export const max: statFunc<number>;
  export const min: statFunc<number>;
}