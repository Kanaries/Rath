import fs from 'fs';
import path from 'path';

import { VIEngine } from '../engine';
import { DefaultIWorker } from '../workerCollection';
const dataset = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../../test/dataset/titanic.json")).toString());
const {
    dataSource,
    config: { Dimensions: dimensions, Measures: measures },
} = dataset;

test('init', () => {
    const vi = new VIEngine();
    expect(vi).toBeDefined();
})

// test("work flow", async () => {
//     const vi = new VIEngine();
//     // vi.getDataGraph()
//     vi.setDataSource(dataSource)
//         .setDimensions(dimensions)
//         .setMeasures(measures);
//     expect(vi.fields.length > 0).toBe(true);
//     expect(vi.cubePool instanceof Map).toBe(true);
//     expect(vi.workerCollection).toBeDefined();
//     vi.workerCollection.enable(DefaultIWorker.cluster, false)
//     let count = 0;
//     vi.workerCollection.each(() => {
//         count++;
//     })
//     expect(count > 0).toBe(true);
//     vi.buildGraph();
//     expect(vi.dataGraph).toBeDefined();
//     const { DClusters, MClusters } =  vi.clusterFields();
//     expect(DClusters.length > 0).toBe(true);
//     expect(MClusters.length > 0).toBe(true);
//     vi.buildCube();
//     expect(vi.cubePool.size).toBe(DClusters.length);
//     const subspaces = vi.getSubspaces();
//     expect(subspaces.length > 0).toBe(true);
//     console.log(subspaces)
//     const insightSpaces = await vi.insightExtraction(subspaces);
//     console.log(insightSpaces.length, subspaces.length);
//     expect(insightSpaces.length > 0).toBe(true)
// });
