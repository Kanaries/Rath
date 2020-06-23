import { DataGraph } from '../dataGraph';
import { mockDataSet } from '../../../utils/mock';

test('init DG', () => {
    const { dataSource, dimensions, measures } = mockDataSet();
    const DG = new DataGraph(dataSource, dimensions, measures);
    expect(DG).toBeDefined();
    expect(DG.DG.length).toBe(dimensions.length);
    expect(DG.DG[0].length).toBe(dimensions.length);
    expect(DG.MG.length).toBe(measures.length);
    expect(DG.MG[0].length).toBe(measures.length);
    for (let i = 0; i < DG.DG.length; i++) {
        for (let j = 0; j < DG.DG[i].length; j++) {
            expect(typeof DG.DG[i][j] === 'number').toBe(true);
        }
    }
    for (let i = 0; i < DG.MG.length; i++) {
        for (let j = 0; j < DG.MG[i].length; j++) {
            expect(typeof DG.MG[i][j] === "number").toBe(true);
        }
    }
})

test("cluster", () => {
    const { dataSource, dimensions, measures } = mockDataSet();
    const DG = new DataGraph(dataSource, dimensions, measures);
    DG.clusterDGraph(dataSource);
    DG.clusterMGraph(dataSource);
    expect(DG.DClusters.length > 0).toBe(true);
    expect(DG.MClusters.length > 0).toBe(true);
});