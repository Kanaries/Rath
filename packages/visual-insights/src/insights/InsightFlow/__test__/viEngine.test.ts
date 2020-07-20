import { VIEngine } from '../engine';
import { mockDataSet } from "../../../utils/mock";
import fs from 'fs';
import path from 'path';
import { DefaultIWorker } from '../workerCollection';

const dataset = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../../test/dataset/titanic.json")).toString()
);
const {
    dataSource,
    config: { Dimensions: dimensions, Measures: measures },
} = dataset;
const vie = new VIEngine();
test("init fields", () => {
    console.time('initFields')
    vie.setDataSource(dataSource)
        .setFieldKeys([...dimensions, ...measures])
        .buildfieldsSummary()
        .setDimensions(dimensions)
        .setMeasures(measures);
    expect(vie.dimensions).toEqual(dimensions);
    expect(vie.measures).toEqual(measures);
    expect(vie.dataSource).toEqual(dataSource);
    for (let field of vie.fields) {
        if (field.analyticType === "dimension") {
            expect(dimensions.includes(field.key)).toBeDefined();
        } else {
            expect(measures.includes(field.key)).toBeDefined();
        }
    }
    console.timeEnd("initFields");
});

test("worker collection", () => {
    let count = 0;
    vie.workerCollection.each(() => {
        count++;
    });
    expect(count).toBe(Object.keys(DefaultIWorker).length);
});

test("data graph & clsuters", () => {
    console.time('graph_cluster')
    vie.buildGraph();
    expect(vie.dataGraph).toBeDefined();
    vie.clusterFields();
    expect(vie.dataGraph.DClusters.length > 0).toBe(true);
    expect(vie.dataGraph.MClusters.length > 0).toBe(true);
    console.timeEnd("graph_cluster");
});

test("cube", () => {
    console.time('cubeInit')
    vie.buildCube();
    expect(vie.cube).not.toBe(null);
    console.timeEnd("cubeInit");
});

test("subspaces", () => {
    console.time('subspaces')
    const subspaces = vie.buildSubspaces().subSpaces;
    expect(subspaces.length > 0).toBe(true);
    console.timeEnd('subspaces')
});

test("insight spaces", async () => {
    console.time('insights')
    await vie.insightExtraction();
    const insightSpaces = vie.insightSpaces;
    console.log(insightSpaces.length, vie.subSpaces.length);
    expect(insightSpaces.length > 0).toBe(true);
    console.timeEnd("insights");
    vie.setInsightScores();
    vie.insightSpaces.forEach(space => {
        expect(typeof space.score).toBe('number')
    })
});

test("vis specification", async () => {
    if (vie.insightSpaces === null || vie.insightSpaces.length === 0) {
        await vie.insightExtraction();
        vie.setInsightScores();
    }
    const insightSpaces = vie.insightSpaces;
    expect(insightSpaces.length > 0).toBe(true);
    insightSpaces.sort((a, b) => a.score - b.score);
    console.log(insightSpaces[0])
    const spec = vie.specification(insightSpaces[0]);
    console.log(spec);
});