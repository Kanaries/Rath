import { LaTiaoTypeError } from '../program/error';
import type { DateObjectDimension, DateToken, FieldToken } from '../program/token';


export const $DateToField = (date: DateToken): FieldToken => {
  return date.source;
};

export const validDateSlice = (key: string): DateObjectDimension[] => {
  if (!key.match(/^[YMWDhms]+$/)) {
    throw new LaTiaoTypeError(`"${key}" is not a valid Date slice.`);
  }

  const set = new Set<DateObjectDimension>();
  const list: DateObjectDimension[] = [];

  for (const char of key) {
    if (set.has(char as DateObjectDimension)) {
      throw new LaTiaoTypeError(`Duplicated dimension "${char}".`);
    }

    set.add(char as DateObjectDimension);
    list.push(char as DateObjectDimension);
  }

  return list;
};
