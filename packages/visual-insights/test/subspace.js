const fs = require("fs");
const assert = require("assert");
const path = require("path");

const { Insight } = require("../build/cjs/index");

const nodes = [0, 1, 2, 3];

const edges = [
  [0, 1, 3],
  [0, 2, 1],
  [1, 3, 2],
  [1, 2, 4],
  [2, 3, 5]
];

describe('Insight.Subspace', function () {
  it('basic', function () {
    const matrix = nodes.map(() => nodes.map(n => 0));
    for (let edge of edges) {
      matrix[edge[0]][edge[1]] = matrix[edge[1]][edge[0]] = edge[2];
    }
    const result = Insight.Subspace.getRelatedVertices(matrix, nodes, [0, 1]);
    assert.equal(result.length, 2);
    assert.equal(result[0].field, 2);
    assert.equal(result[1].field, 3);
  })

  it("params:TopK", function () {
    const matrix = nodes.map(() => nodes.map((n) => 0));
    for (let edge of edges) {
      matrix[edge[0]][edge[1]] = matrix[edge[1]][edge[0]] = edge[2];
    }
    const result = Insight.Subspace.getRelatedVertices(matrix, nodes, [0, 1], 1);
    assert.equal(result.length, 1);
    assert.equal(result[0].field, 2);
  });
})
