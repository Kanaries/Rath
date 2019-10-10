import React, {useEffect, useState, useMemo} from 'react';
import { DefaultButton, IconButton, Callout, Stack, ProgressIndicator, Pivot, PivotItem, CommandBar, Toggle, setFocusVisibility } from 'office-ui-fabric-react';
import PreferencePanel, { PreferencePanelConfig } from '../../components/preference';
import { FileLoader, useComposeState } from '../../utils/index';
import BaseChart, { Specification } from '../../demo/vegaBase';
import { DataSource, Record, BIField, Field, OperatorType } from '../../global';
import { specification } from 'visual-insights';
import { useGlobalState } from '../../state';
import {
  Subspace,
  clusterMeasures,
  ViewSpace,
  FieldSummary
} from '../../service';

interface PageStatus {
  show: {
    insightBoard: boolean;
    configPanel: boolean;
    fieldConfig: boolean;
    dataConfig: boolean;
  }
}
interface DataView {
  schema: Specification;
  aggData: DataSource;
  fieldFeatures: Field[];
  dimensions: string[];
  measures: string[]
}

interface GalleryProps {
  subspaceList: Subspace[];
  /**
   * dataSource here should be cookedData.
   */
  dataSource: DataSource;
  summaryData: {
    originSummary: FieldSummary[];
    groupedSummary: FieldSummary[]
  },
}

const Gallery: React.FC<GalleryProps> = (props) => {
  const { dataSource, summaryData, subspaceList } = props;
  const { originSummary, groupedSummary } = summaryData;
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageStatus, setPageStatus] = useComposeState<PageStatus>({
    show: {
      insightBoard: false,
      fieldConfig: false,
      configPanel: false,
      dataConfig: false
    }
  });
  const [visualConfig, setVisualConfig] = useState<PreferencePanelConfig>({
    aggregator: 'sum',
    defaultAggregated: true,
    defaultStack: true
  })
  const [viewSpaces, setViewSpaces] = useState<ViewSpace[]>([]);

  const [dataView, setDataView] = useState<DataView>({
    schema: {
      position: [],
      color: [],
      opacity: [],
      geomType: []
    },
    fieldFeatures: [],
    aggData: [],
    dimensions: [],
    measures: []
  });



  const gotoPage = (pageNo: number) => {
    setCurrentPage(pageNo);
  }
  
  useEffect(() => {
    setLoading(true);
    clusterMeasures(subspaceList.map(space => {
      return {
        dimensions: space.dimensions,
        measures: space.measures.map(mea => mea.name),
        matrix: space.correlationMatrix
      }
    })).then(viewSpaces => {
      setViewSpaces(viewSpaces);
      setLoading(false);
    })
  }, [subspaceList, dataSource]);
  
  const dimScores = useMemo<[string, number, number, Field][]>(() => {
    return [...originSummary, ...groupedSummary].map(field => {
      return [field.fieldName, field.entropy, field.maxEntropy, { name: field.fieldName, type: field.type }]
    });
  }, [originSummary, groupedSummary]);

  useEffect(() => {
    const viewState = viewSpaces[currentPage];
    if (viewState) {
      const { dimensions, measures } = viewState;
      try {
        // todo: find the strict confition instead of using try catch
        const fieldScores = dimScores.filter(field => {
          return dimensions.includes(field[0]) || measures.includes(field[0])
        })
        const { schema } = specification(fieldScores, dataSource, dimensions, measures)
        setDataView({
          schema,
          fieldFeatures: fieldScores.map(f => f[3]),
          aggData: dataSource,
          dimensions,
          measures
        })
      } catch (error) {
        console.log(error)
      }
    }
  }, [viewSpaces, currentPage]);
  console.log(pageStatus, pageStatus.show)
  return (
    <div className="content-container">
      <PreferencePanel show={pageStatus.show.configPanel}
        config={visualConfig}
        onUpdateConfig={(config) => {
          setVisualConfig(config)
          setPageStatus(draft => { draft.show.configPanel = false })
        }}
        onClose={() => { setPageStatus(draft => { draft.show.configPanel = false }) }} />
      {
          <div className="card">
          {
            !loading ? undefined : <ProgressIndicator description="calculating" />
          }
          <h2 style={{marginBottom: 0}}>Visual Insights <IconButton iconProps={{iconName: 'Settings'}} ariaLabel="preference" onClick={() => { setPageStatus(draft => { draft.show.configPanel = true }) }} /></h2>
          <p className="state-description">Page No. {currentPage + 1} of {viewSpaces.length}</p>
          <div className="ms-Grid" dir="ltr">
            <div className="ms-Grid-row">
            <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg3" style={{overflow: 'auto'}}>
              <Stack horizontal tokens={{ childrenGap: 20 }}>
                <DefaultButton text="Last" onClick={() => { gotoPage((currentPage - 1 + viewSpaces.length) % viewSpaces.length) }} allowDisabledFocus />
                <DefaultButton text="Next" onClick={() => { gotoPage((currentPage + 1) % viewSpaces.length) }} allowDisabledFocus />
              </Stack>
              <h3>Specification</h3>
              <pre>
                {JSON.stringify(dataView.schema, null, 2)}
              </pre>
            </div>
            <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg9" style={{overflow: 'auto'}}>
              <BaseChart
                aggregator={visualConfig.aggregator}
                defaultAggregated={visualConfig.defaultAggregated}
                defaultStack={visualConfig.defaultStack}
                dimensions={dataView.dimensions}
                measures={dataView.measures}
                dataSource={dataView.aggData}
                schema={dataView.schema}
                fieldFeatures={dataView.fieldFeatures} />
            </div>
            </div>
          </div>
        </div>
      }
    </div>
  )
}

export default Gallery;