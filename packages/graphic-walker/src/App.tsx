import React, { useState, useEffect, useCallback } from 'react';
import DraggableFields from './Fields';
import { Record, Filters, Field, IMutField } from './interfaces';
import ReactVega from './vis/react-vega';
import VisualSettings from './visualSettings';
import { Container, NestContainer } from './components/container';
import ClickMenu from './components/clickMenu';
import InsightBoard from './InsightBoard/index';
import PosFields from './Fields/posFields';
import AestheticFields from './Fields/AestheticFields';
import DatasetFields from './Fields/DatasetFields';
import ReactiveRenderer from './renderer/index';
import { useFieldsState } from './Fields/useFieldsState'
import Modal from './components/modal';
import DataSourceSegment from './dataSource/index';
import { useGlobalStore } from './store';
import { preAnalysis, destroyWorker } from './services'
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';

export interface EditorProps {
  dataSource?: Record[];
  rawFields?: IMutField[];
}

const App: React.FC<EditorProps> = props => {
  const { dataSource = [], rawFields = [] } = props;
  const { commonStore, vizStore } = useGlobalStore();
  // const [fields, setFields] = useState<Field[]>([]);
  // const [geomType, setGeomType] = useState<string>(GEMO_TYPES[0].value);
  // const [aggregated, setAggregated] = useState<boolean>(true);
  // const [position, setPosition] = useState<[number, number]>([0, 0]);
  // const [showMenu, setShowMenu] = useState<boolean>(false);
  // const [showInsight, setShowInsight] = useState<boolean>(false);
  // const [filters, setFilters] = useState<Filters>({});
  const [insightReady, setInsightReady] = useState<boolean>(true);

  const { currentDataset, datasets, filters, vizEmbededMenu, showInsightBoard } = commonStore;
  const { viewDimensions, viewMeasures, draggableFieldState } = vizStore

  // use as an embeding module, use outside datasource from props.
  useEffect(() => {
    if (dataSource.length > 0) {
      commonStore.addAndUseDS({
        name: 'context dataset',
        dataSource: dataSource,
        rawFields
      })
    }
  }, [dataSource, rawFields])

  // do preparation analysis work when using a new dataset
  useEffect(() => {
    const ds = currentDataset;
    if (ds && ds.dataSource.length > 0 && ds.rawFields.length > 0) {
      setInsightReady(false)
      preAnalysis({
        dataSource: ds.dataSource,
        fields: toJS(ds.rawFields)
      }).then(() => {
        setInsightReady(true);
      })
    }
    return () => {
      destroyWorker();
    }
  }, [currentDataset]);

  return (
    <div className="App">
      <DataSourceSegment preWorkDone={insightReady} />
      {/* <Container>
        <DraggableFields
          onStateChange={(state) => {
            setFstate(state)
          }}
          fields={fields}
        />
      </Container> */}
      <VisualSettings />
      <Container>
      <div className="grid grid-cols-6">
        <div className="col-span-1">
          <DatasetFields />
        </div>
        <div className="col-span-1">
          <AestheticFields />
        </div>
        <div className="col-span-4">
          <div>
            <PosFields />
          </div>
          <NestContainer style={{ minHeight: '600px', overflow: 'auto' }}>
            {datasets.length > 0 && <ReactiveRenderer />}
            <InsightBoard />
            {vizEmbededMenu.show && (
              <ClickMenu x={vizEmbededMenu.position[0]} y={vizEmbededMenu.position[1]}>
                <div
                  onClick={() => {
                    commonStore.closeEmbededMenu();
                    commonStore.setShowInsightBoard(true)
                  }}
                >
                  深度解读
                </div>
              </ClickMenu>
            )}
          </NestContainer>
        </div>
      </div>
      </Container>
    </div>
  )
}

export default observer(App);
