import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Record, Field, Filters, IMeasure } from '../interfaces';
import { Insight, Utils, UnivariateSummary } from 'visual-insights';
import { baseVis, IReasonType } from './std2vegaSpec';
import embed from 'vega-embed';
import { getExplaination, IVisSpace } from '../services';
import RadioGroupButtons from './radioGroupButtons';
import { IExplaination, IMeasureWithStat } from '../insights';
import { mergeMeasures } from './utils';
import ReactJson from 'react-json-view';

const collection  = Insight.IntentionWorkerCollection.init();

const ReasonTypeNames: { [key: string]: string} = {
  'selection_dim_distribution': '维度线索',
  'selection_mea_distribution': '度量线索',
  'children_major_factor': '子节点主因',
  'children_outlier': '子节点异常'
}
collection.enable(Insight.DefaultIWorker.cluster, false);
interface SubSpace {
  dimensions: string[];
  measures: IMeasure[];
}

interface InsightMainBoardProps {
  dataSource: Record[];
  fields: Field[];
  filters?: Filters;
  viewDs: Field[];
  viewMs: Field[];
}
const InsightMainBoard: React.FC<InsightMainBoardProps> = props => {
  const { dataSource, fields, viewDs, viewMs, filters } = props;
  const [recSpaces, setRecSpaces] = useState<IExplaination[]>([]);
  const [visSpaces, setVisSpaces] = useState<IVisSpace[]>([]);
  const [visIndex, setVisIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [valueExp, setValueExp] = useState<IMeasureWithStat[]>([]);
  const container = useRef<HTMLDivElement>(null);

  const dimsWithTypes = useMemo(() => {
    const dimensions = fields
      .filter((f) => f.type === 'D')
      .map((f) => f.id)
      .filter((f) => !Utils.isFieldUnique(dataSource, f));
    return UnivariateSummary.getAllFieldTypes(dataSource, dimensions);
  }, [fields, dataSource])

  const measWithTypes = useMemo(() => {
    const measures = fields.filter((f) => f.type === 'M').map((f) => f.id);
    return measures.map((m) => ({
      name: m,
      type: 'quantitative',
    }));
  }, [fields]);

  useEffect(() => {
    if (dimsWithTypes.length > 0 && measWithTypes.length > 0 && dataSource.length > 0) {
      const measures = fields.filter((f) => f.type === 'M').map((f) => f.id);
      const dimensions = dimsWithTypes.map(d => d.name);
      const currentSpace: SubSpace = {
          dimensions: viewDs.map((f) => f.id),
          measures: viewMs.map((f) => ({
            key: f.id,
            op: f.aggName as any
          })),
      };
      setLoading(true);

      getExplaination({
        dimensions,
        measures,
        dataSource,
        currentSpace,
        filters
      }).then(({ visSpaces, explainations, valueExp }) => {
        setRecSpaces(explainations);
        setVisSpaces(visSpaces);
        setValueExp(valueExp);
        setLoading(false);
      })
    }
  }, [fields, viewDs, viewMs, measWithTypes, filters, dimsWithTypes, measWithTypes, dataSource])

  const fieldsWithType = useMemo(() => {
    return [...dimsWithTypes, ...measWithTypes];
  }, [dimsWithTypes, measWithTypes])

  useEffect(() => {
    const RecSpace = recSpaces[visIndex];
    const visSpec = visSpaces[visIndex];
    if (container.current && RecSpace && visSpec) {
      const usePredicates: boolean =
          RecSpace.type === 'selection_dim_distribution' ||
          RecSpace.type === 'selection_mea_distribution';
      const mergedMeasures = mergeMeasures(RecSpace.measures, RecSpace.extendMs);
      const _vegaSpec = baseVis(
          visSpec.schema,
          visSpec.schema.geomType && visSpec.schema.geomType[0] === 'point'
              ? dataSource
              : visSpec.dataView,
          // result.aggData,
          [...RecSpace.dimensions, ...RecSpace.extendDs],
          [...RecSpace.measures, ...RecSpace.extendMs].map(m => m.key),
          usePredicates ? RecSpace.predicates : null,
          mergedMeasures.map((m) => ({
              op: m.op,
              field: m.key,
              as: m.key,
          })),
          fieldsWithType as any,
          RecSpace.type as IReasonType,
          true,
          true
      );
      if (container.current) {
        embed(container.current, _vegaSpec);
      }
    }
  }, [visIndex, recSpaces, visSpaces, fieldsWithType, dataSource])

  const FilterDesc = useMemo<string>(() => {
    if (filters) {
      const dimValues = Object.keys(filters)
      .filter(k => filters[k].length > 0)
        .map((k) => {
          return `${k}=${filters[k]}`;
        });
      return `选中对象${dimValues.join(', ')}的数据`; 
    }
    return ''
  }, [filters])

  const valueDesc = useMemo<string>(() => {
    const meaStatus = valueExp.map(
        (mea) => `${mea.key}(${mea.op})的取值${mea.score === 1 ? '大于' : '小于'}预期`
    );
    return meaStatus.join(', ');
  }, [valueExp])

  return (
      <div style={{ maxHeight: '720px', minHeight: '200px', overflowY: 'auto', maxWidth: '880px' }}>
          <p>
              {FilterDesc}, {valueDesc}
          </p>
          {loading && (
              <div className="animate-spin inline-block mr-2 ml-2 w-16 h-16 rounded-full border-t-2 border-l-2 border-blue-500"></div>
          )}
          <div style={{ display: 'flex' }}>
              <div style={{ flexBasis: '200px', flexShrink: 0 }}>
                  <RadioGroupButtons
                      choosenIndex={visIndex}
                      options={recSpaces.map((s, i) => ({
                          value: s.type || '' + i,
                          label: `${s.type ? ReasonTypeNames[s.type] : '未识别'}: ${
                              s.score.toFixed(2)
                          }`,
                      }))}
                      onChange={(v, i) => {
                          setVisIndex(i);
                      }}
                  />
              </div>
              <div className="p-4 text-sm">
                  <div ref={container}></div>
                  {recSpaces[visIndex] && (
                      <div>
                          维度是{recSpaces[visIndex].dimensions.join(', ')}。<br />
                          度量是{recSpaces[visIndex].measures.map((m) => m.key).join(', ')}。<br />
                          此时具有
                          {recSpaces[visIndex].type
                              ? ReasonTypeNames[recSpaces[visIndex].type!]
                              : '未识别'}{' '}
                          ，评分为{recSpaces[visIndex].score}。
                          <br />
                          {recSpaces[visIndex].description &&
                              recSpaces[visIndex].description.intMeasures &&
                              FilterDesc +
                                  recSpaces[visIndex].description.intMeasures
                                      .map(
                                          (mea: any) =>
                                              `${mea.key}(${mea.op})}的取值${
                                                  mea.score === 1 ? '大于' : '小于'
                                              }预期`
                                      )
                                      .join(', ')}
                          <br />
                          <ReactJson src={recSpaces[visIndex].description} />
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}

export default InsightMainBoard;
