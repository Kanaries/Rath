import React, { useState, useEffect, useCallback } from 'react';
import DraggableFields from './Fields';
import { Record, Filters, Field, IMutField } from './interfaces';
import ReactVega from './vis/react-vega';
import { GEMO_TYPES } from './config';
import { LiteForm } from './components/liteForm';
import { Container } from './components/container';
import ClickMenu from './components/clickMenu';
import InsightBoard from './InsightBoard';
import { useFieldsState } from './Fields/useFieldsState'
import { Button, DropdownSelect, Checkbox } from '@tableau/tableau-ui';
import Modal from './components/modal';
import DataSourceSegment from './dataSource/index';
import { useGlobalStore } from './store';
import { preAnalysis, destroyWorker } from './services'
import { observer } from 'mobx-react-lite';

export interface EditorProps {
  dataSource?: Record[];
  rawFields?: IMutField[];
}

const App: React.FC<EditorProps> = props => {
  const { dataSource = [], rawFields = [] } = props;
  const store = useGlobalStore();
  const [fields, setFields] = useState<Field[]>([]);
  const [geomType, setGeomType] = useState<string>(GEMO_TYPES[0].value);
  const [aggregated, setAggregated] = useState<boolean>(true);
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showInsight, setShowInsight] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({});
  const [insightReady, setInsightReady] = useState<boolean>(true);

  const { fstate, setFstate, viewDimensions, viewMeasures } = useFieldsState();
  const { currentDataset, datasets } = store;

  // use as an embeding module, use outside datasource from props.
  useEffect(() => {
    if (dataSource.length > 0) {
      store.addAndUseDS({
        name: 'context dataset',
        dataSource: dataSource,
        rawFields
      })
    }
  }, [dataSource, rawFields])

  // change selected dataset, update fields, ...
  useEffect(() => {
    const fs: Field[] = [];
    const ds = currentDataset;
    if (ds) {
      ds.rawFields.forEach((f) => {
        fs.push({
          id: f.key,
          name: f.key,
          type: f.analyticType === 'dimension' ? 'D' : 'M',
          aggName: f.analyticType === 'measure' ? 'sum' : undefined,
        })
      })
      setFields(fs)
    }
  }, [currentDataset]);

  // do preparation analysis work when using a new dataset
  useEffect(() => {
    const ds = currentDataset;
    if (ds && ds.dataSource.length > 0 && ds.rawFields.length > 0) {
      setInsightReady(false)
      preAnalysis({
        dataSource: ds.dataSource,
        fields: ds.rawFields
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
      <Container>
        <DraggableFields
          onStateChange={(state) => {
            setFstate(state)
          }}
          fields={fields}
        />
      </Container>
      <Container>
        <LiteForm style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="item">
            <Checkbox
              checked={aggregated}
              onChange={(e) => {
                setAggregated(e.target.checked)
              }}
            >
              聚合度量
            </Checkbox>
          </div>
          <div className="item">
            <label>标记类型</label>
            <DropdownSelect
              onChange={(e) => {
                setGeomType(e.target.value)
              }}
            >
              {GEMO_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </DropdownSelect>
          </div>
        </LiteForm>
      </Container>
      {datasets.length > 0 && (
        <Container>
          {showInsight && (
            <Modal
              onClose={() => {
                setShowInsight(false)
              }}
            >
              <InsightBoard
                dataSource={currentDataset.dataSource}
                fields={fields}
                viewDs={viewDimensions}
                viewMs={viewMeasures}
                filters={filters}
              />
            </Modal>
          )}
          {showMenu && (
            <ClickMenu x={position[0]} y={position[1]}>
              <div
                onClick={() => {
                  setShowMenu(false)
                  setShowInsight(true)
                }}
              >
                深度解读
              </div>
            </ClickMenu>
          )}

          <ReactVega
            geomType={geomType}
            defaultAggregate={aggregated}
            dataSource={currentDataset.dataSource}
            rows={fstate.rows}
            columns={fstate.columns}
            color={fstate.color[0]}
            opacity={fstate.opacity[0]}
            size={fstate.size[0]}
            onGeomClick={(values, e) => {
              setFilters(values)
              setPosition([e.pageX, e.pageY])
              setShowMenu(true)
            }}
          />
        </Container>
      )}
    </div>
  )
}

export default observer(App);
