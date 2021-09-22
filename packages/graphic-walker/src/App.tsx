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
import { ProgressIndicator } from '@fluentui/react'
import Modal from './components/modal';
import DataSourcePanel from './dataSource/index';
import { useLocalState } from './store';
import { preAnalysis, destroyWorker } from './services'

export interface EditorProps {
  dataSource?: Record[];
  rawFields?: IMutField[];
}

const App: React.FC<EditorProps> = props => {
  const { dataSource = [], rawFields = [] } = props;
  const [GS, updateGS] = useLocalState();
  const [fields, setFields] = useState<Field[]>([]);
  const [geomType, setGeomType] = useState<string>(GEMO_TYPES[0].value);
  const [aggregated, setAggregated] = useState<boolean>(true);
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showInsight, setShowInsight] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({});
  const [showDSPanel, setShowDSPanel] = useState<boolean>(false);
  const [insightReady, setInsightReady] = useState<boolean>(true);
  const [newDBIndex, setNewDBIndex] = useState<number>(0);

  const { fstate, setFstate, viewDimensions, viewMeasures } = useFieldsState();

  useEffect(() => {
    if (dataSource.length > 0) {
      updateGS(state => {
        state.dataBase = [
          {
            id: 'default',
            name: 'context dataset',
            dataSource: dataSource,
            rawFields
          }
        ]
      })
    }
  }, [dataSource, rawFields])
  useEffect(() => {
    const fs: Field[] = [];
    const ds = GS.dataBase[GS.currentDBIndex];
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
  }, [GS.currentDBIndex, GS.dataBase]);

  useEffect(() => {
    const ds = GS.dataBase[GS.currentDBIndex];
    if (ds) {
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
  }, [GS.currentDBIndex, GS.dataBase]);

  const createDB = useCallback(() => {
    updateGS(draft => {
      const newLastIndex = draft.dataBase.length;
      draft.dataBase.push({
        id: 'ds_' + newLastIndex,
        name: '新数据源' + newLastIndex,
        dataSource: [],
        rawFields: []
      })
      setNewDBIndex(newLastIndex);
    })
  }, []);

  return (
    <div className="App">
      <Container>
        {!insightReady && <ProgressIndicator description="analyzing" />}
        <label style={{ fontSize: '12px', marginRight: '4px' }}>当前数据集</label>
        <DropdownSelect
          value={GS.dataBase[GS.currentDBIndex] ? GS.dataBase[GS.currentDBIndex].id : 'empty'}
          onChange={(e) => {
            // setDSKey(e.target.value);
            updateGS((draft) => {
              const index = draft.dataBase.findIndex((ds) => ds.id === e.target.value)
              draft.currentDBIndex = index
            })
          }}
        >
          {GS.dataBase.map((ds) => (
            <option value={ds.id} key={ds.id}>
              {ds.name}
            </option>
          ))}
        </DropdownSelect>
        <Button
          style={{ marginLeft: '8px' }}
          onClick={() => {
            createDB()
            setShowDSPanel(true)
          }}
        >
          创建数据集
        </Button>
        {showDSPanel && (
          <Modal
            title="创建数据源"
            onClose={() => {
              setShowDSPanel(false)
            }}
          >
            <DataSourcePanel
              dbIndex={newDBIndex}
              onSubmit={() => {
                setShowDSPanel(false)
              }}
            />
          </Modal>
        )}
        {insightReady && <span style={{ margin: '1em' }}>iready</span>}
      </Container>
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
      {GS.dataBase[GS.currentDBIndex] && (
        <Container>
          {showInsight && (
            <Modal
              onClose={() => {
                setShowInsight(false)
              }}
            >
              <InsightBoard
                dataSource={GS.dataBase[GS.currentDBIndex].dataSource}
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
            dataSource={GS.dataBase[GS.currentDBIndex].dataSource}
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

export default App;
