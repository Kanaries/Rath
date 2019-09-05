function turnAdjMatrix2List(matrix) {
  // only for the special matrix here(corelational matrix)
  let edges = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      edges.push([[i, j], Math.abs(matrix[i][j])]);
    }
  }
  edges.sort((a, b) => {
    return a[1] - b[1]
  });
  return edges
}

function find (parents, n) {
  return parents[n] === n ? n : find(parents[n]);
}


function union (parents, n1, n2) {
  let p1 = find(parents, n1);
  let p2 = find(parents, n2);
  parents[p1] = p2;
}

// maxiumn spanning tree
function kruskal({ matrix, groupMaxSize = 4 }) {
  const edges = turnAdjMatrix2List(matrix);
  const parents = matrix.map((m, i) => i);

  for (let edge of edges) {
    union(parents, edge[0][0], edge[0][1]);
    let set = new Set(parents);
    if (set.size <= groupMaxSize){
      break;
    }
  }
  let groups = new Map();
  for (let i = 0; i < parents.length; i++) {
    if (!groups.has(parents[i])) {
      groups.set(parents[i], []);
    }
    groups.get(parents[i]).push(i);
  }
  return groups;
}

function cluster ({ matrix, measures ,method = 'kruskal', groupNumber }) {
  const groups = kruskal({ matrix });
  let ans = [];
  for (let meas of groups.values()) {
    ans.push(meas.map(meaIndex => measures[meaIndex]))
  }
  return ans;
}

export default cluster;