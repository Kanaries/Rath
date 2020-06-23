/**
 * cite: code below are mostly from vega/datalib.
 */
import { Record, Field } from '../../commonTypes'
import { IFieldSummary, IField, FieldDictonary, IDataType, ISemanticType, IAnalyticType } from './interfaces'
import { getFieldType } from '../../univariateSummary';

const TESTS = {
  boolean (x: any) {
    return x === 'true' || x === 'false' || x === true || x === false;
  },
  integer (x: any) {
    return TESTS.number(x) && (x = +x) === ~~x
  },
  number (x: any) {
    return !isNaN(+x)
  },
  date (x: any) {
    return !isNaN(Date.parse(x))
  },
} as const;

function isValid (obj: any) {
    return obj != null && obj === obj;
}

export function inferDataType (values: any[]): IDataType {

    // types to test for, in precedence order
    const types: IDataType[] = ['boolean', 'integer', 'number', 'date']

    for (let value of values) {
      // test value against remaining types
      for (let j = 0; j < types.length; ++j) {
        if (isValid(value) && !TESTS[types[j]](value)) {
          types.splice(j, 1)
          j -= 1
        }
      }
      // if no types left, return 'string'
      if (types.length === 0) return 'string'
    }

    return types[0]
}

export function getFieldsSummary(
  fieldKeys: string[],
  dataSource: Record[]
): { fields: IFieldSummary[]; dictonary: FieldDictonary } {
    const fields: IFieldSummary[] = [];
    const dictonary: FieldDictonary = new Map();
    for (let f of fieldKeys) {
        const values = dataSource.map(r => r[f]);
        const dataType = inferDataType(values);

        const semanticType = getFieldType(dataSource, f) as ISemanticType;
        let analyticType: IAnalyticType = 'dimension';
        if (dataType === 'integer' || dataType === 'number') analyticType = 'measure';
        let field: IFieldSummary = {
            key: f,
            analyticType,
            semanticType,
            dataType,
            domain: new Set(values)
        };

        fields.push(field);
        dictonary.set(field.key, field);
    }
    return {
        fields,
        dictonary
    }
}

