import { Specification } from "visual-insights/src/commonTypes";
import { geomTypeMap, DataField } from './index';
import { inferFieldSemanticTypeWithDict, inferFieldTypeWithDict } from './utils';

export function targetVis(query: Specification, fields: DataField[]) {
  let fieldTypeDict: {[key: string]: DataField} = {};
  for (let field of fields) {
    fieldTypeDict[field.name] = field
  }

  const getFieldSemanticType = (field: string) => inferFieldSemanticTypeWithDict(field, fieldTypeDict);
  const getFieldType = (field: string) => inferFieldTypeWithDict(field, fieldTypeDict);
  
  function shouldFieldAggregate(
    field: string,
    geomType: string
  ): boolean {
    if (geomType === "point") {
      return false;
    }
    const fieldType = getFieldSemanticType(field);
    if (geomType === 'rect') {
      return fieldType !== 'quantitative'
    }
    if (fieldType === "quantitative" && getFieldType(field) === 'measure') {
      return true;
    }
    return false;
  }

  let markType =
        query.geomType![0] && geomTypeMap[query.geomType![0]]
          ? geomTypeMap[query.geomType![0]]
          : query.geomType![0];
      const xType = getFieldSemanticType(query.position![0]);
      const yType = getFieldSemanticType(query.position![1]);
      const colorType = getFieldSemanticType(query.color![0]);
      const xAgg = shouldFieldAggregate(query.position![0], markType);
      const yAgg = shouldFieldAggregate(query.position![1], markType);
      let repeat: string[] = [query.position![1]];
      if (query.highFacets) {
        repeat = repeat.concat(query.highFacets!.filter(f => getFieldSemanticType(f) === 'quantitative'))
      }
      let adjustColorField = query.color![0];
      if (markType === 'rect') {
        if (query.color![0] && colorType !== 'quantitative') {
          markType = 'point';
        } else if (query.opacity![0] && query.size![0]) {
          adjustColorField = query.size![0] || query.opacity![0];
        }
      }
      return {
        config: {
          repeat: { columns: 5 }
        },
        data: { name: "dataSource" },
        autosize: {
          type: "pad"
        },
        repeat,
        spec: {
          mark: markType,
          selection: {
            sl: {
              type: markType === "bar" ? "single" : "interval",
              encodings: markType === "bar" ? ["x"] : undefined
            }
          },
          encoding: {
            x: query.position![0] && {
              field: query.position![0],
              type: getFieldSemanticType(query.position![0]),
              bin: markType === 'rect' && xType === 'quantitative' && { maxbins: 20 },
              aggregate: markType !== 'rect' && xAgg && 'sum'
            },
            y: repeat[0] && {
              field: { repeat: 'repeat' },
              type: getFieldSemanticType(repeat[0]),
              bin: markType === 'rect' && yType === 'quantitative' && { maxbins: 20 },
              aggregate: markType !== 'rect' && yAgg && 'sum',
              // scale: mustDefineScale && !yAgg ? { domain: filedDomains[repeat[0]] } : undefined
            },
            size: query.size![0] && {
              field: query.size![0],
              type: getFieldSemanticType(query.size![0])
            },
            opacity: query.opacity![0] && {
              field: query.opacity![0],
              type: getFieldSemanticType(query.opacity![0])
            },
            shape: query.shape![0] && {
              field: query.shape![0],
              type: getFieldSemanticType(query.shape![0])
            },
            color: (adjustColorField || markType === 'rect') && {
              field: adjustColorField,
              aggregate: markType === 'rect' && getFieldSemanticType(adjustColorField) === 'quantitative' && (adjustColorField ? 'sum' : 'count'),
              type: adjustColorField && getFieldSemanticType(adjustColorField)
            }
          }
        }
      };

}