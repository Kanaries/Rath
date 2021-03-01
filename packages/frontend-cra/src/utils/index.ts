import * as FileLoader from './fileParser';
import * as Transform from './transform';
import useComposeState from './useComposeState';
import deepcopy from './deepcopy';

export function isASCII(str: string) {
  return /^[\x00-\x7F]*$/.test(str)
}


export {
  FileLoader,
  useComposeState,
  deepcopy,
  Transform
}