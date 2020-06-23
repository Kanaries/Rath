import { Cube } from '../index';
import { simpleAggregate } from '../../statistics/aggregation';
import fs from 'fs';
import path from 'path';
const dataset = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../test/dataset/titanic.json')).toString())
const {
    dataSource,
    config: {
        Dimensions: dimensions,
        Measures: measures
    }
} = dataset;
test('cube', () => {
    // let t0 = new Date().getTime();
    const cube = new Cube({
        dataSource,
        dimensions,
        measures,
        ops: measures.map(() => 'sum')
    });
    let t0 = new Date().getTime()
    cube.buildBaseCuboid();
    const Aggs1 = cube.getCuboid(['PClass', 'Sex', 'Embarked']).state
    const Aggs2 = cube.getCuboid(['Sex']).state
    let t1 = new Date().getTime();
    console.log('cube', t1 - t0)
    t0 = new Date().getTime()
    simpleAggregate({
      dataSource,
      dimensions,
      measures,
      ops: measures.map(() => 'sum'),
    })
    simpleAggregate({
      dataSource,
      dimensions: ['PClass', 'Sex', 'Embarked'],
      measures,
      ops: measures.map(() => 'sum'),
    })
    simpleAggregate({
      dataSource,
      dimensions: ['Sex'],
      measures,
      ops: measures.map(() => 'sum'),
    })
    t1 = new Date().getTime()
    console.log('aggs', t1 - t0)
    expect(Aggs2.length).toBe(2);
})