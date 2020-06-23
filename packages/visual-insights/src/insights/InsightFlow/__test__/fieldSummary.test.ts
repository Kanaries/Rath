import { getFieldsSummary } from '../fieldSummary';
import { mockDataSet } from "../../../utils/mock";

test('basic case', () => {
    const { dataSource, dimensions, measures } = mockDataSet();
    const { fields, dictonary } = getFieldsSummary(dimensions.concat(measures), dataSource);
    expect(fields.length).toBe(dimensions.length + measures.length);
    expect(dictonary.size).toBe(fields.length);
    fields.forEach(f => {
        if (dimensions.includes(f.key)) {
            expect(f.dataType).toBe("string");
            expect(f.analyticType).toBe('dimension')
            expect(f.semanticType).toBe('nominal')
        } else if (measures.includes(f.key)) {
            expect(f.dataType).toBe("number");
            expect(f.analyticType).toBe("measure");
            expect(f.semanticType).toBe("quantitative");
        }
    })
})
