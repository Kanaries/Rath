export function linearMapPositive (arr: number[]): number[] {
  let min = Math.min(...arr);
  return arr.map(a => a - min + 1);
}

export function getCombination(elements: string[], start: number = 1, end: number = elements.length): string[][] {
  let ans: string[][] = [];
  const combine = (step: number, set: string[], size: number) => {
    if (set.length === size) {
      ans.push([...set]);
      return;
    }
    if (step >= elements.length) {
      return;
    }
    combine(step + 1, [...set, elements[step]], size);
    combine(step + 1, set, size);
  }
  for (let i = start; i <= end; i++) {
    combine(0, [], i);
  }
  return ans
}

export type ImpurityFC = (probabilityList: number[]) => number;

export function normalize(frequencyList: number[]): number[] {
  let sum = 0;
  for (let f of frequencyList) {
    sum += f;
  }
  return frequencyList.map(f => f / sum);
}

export const entropy: ImpurityFC = (probabilityList) => {
  let sum = 0;
  for (let p of probabilityList) {
    sum += p * Math.log2(p);
  }
  return -sum;
}

export const gini: ImpurityFC = (probabilityList) => {
  let sum = 0;
  for (let p of probabilityList) {
    sum += p * (1 - p);
  }
  return sum;
}
