function normalize(frequencyList) {
  let sum = 0;
  for (let f of frequencyList) {
    sum += f;
  }
  return frequencyList.map(f => f / sum);
}

function entropy(probabilityList) {
  let sum = 0;
  for (let p of probabilityList) {
    sum += p * Math.log2(p);
  }
  return -sum;
}

function gini(probabilityList) {
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