import { Cuboid } from '../cuboid';

test('cuboid init', () => {
    const cuboid = new Cuboid({
        dimensions: ['dim'],
        measures: ['value'],
        ops: ['sum']
    });
    expect(cuboid).toBeDefined();
})
