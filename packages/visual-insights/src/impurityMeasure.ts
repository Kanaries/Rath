export type ImpurityFC = (probabilityList: number[]) => number;

function normalize(frequencyList: number[]): number[] {
  let sum = 0;
  for (let f of frequencyList) {
    sum += f;
  }
  return frequencyList.map(f => f / sum);
}

const entropy: ImpurityFC = (probabilityList) => {
  let sum = 0;
  for (let p of probabilityList) {
    sum += p * Math.log2(p);
  }
  return -sum;
}

const gini: ImpurityFC = (probabilityList) => {
  let sum = 0;
  for (let p of probabilityList) {
    sum += p * (1 - p);
  }
  return sum;
}

export {
  normalize,
  entropy,
  gini
}