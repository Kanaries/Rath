import React, { useMemo, useState, useEffect, useCallback } from 'react';
import intl from 'react-intl-universal';
import { DataSource, Field } from '../../global';
import FieldAnalysisBoard from './fieldAnalysis';
import Subspaces from './subspaces';
import { FieldSummary, Subspace, combineFieldsService } from '../../service';
import ClusterBoard from './cluster';
import { specification } from 'visual-insights';
import { ProgressIndicator, Toggle, Slider } from 'office-ui-fabric-react';
import { useGlobalState } from '../../state';
import VegaBase from '../../visBuilder/vegaBase';
import './index.css';
const maxMeasureInView = 4;
interface NoteBookProps {
  dataSource: DataSource;
  // dimScores: [string, number, number, Field][],
  summary: {
    origin: FieldSummary[];
    grouped: FieldSummary[]
  };
  subspaceList: Subspace[]
}
interface ClusterState {
  measures: string[];
  dimensions: string[];
  matrix: number[][];
}
const NoteBook: React.FC<NoteBookProps> = (props) => {
  const { summary, subspaceList, dataSource } = props;
  const [state, updateState] = useGlobalState();
  const [isAggregated, setIsAggregated] = useState(true);
  
  const [clusterState, setClusterState] = useState<ClusterState>({
    measures: [],
    dimensions: [],
    matrix: []
  })

  const [measuresInView, setMeasuresInView] = useState<string[]>([]);


  // todo:
  // should be updated after designing new specification api
  const dimScores = useMemo<[string, number, number, Field][]>(() => {
    return [...summary.origin, ...summary.grouped].map(field => {
      return [field.fieldName, field.entropy, field.maxEntropy, { name: field.fieldName, type: field.type }]
    });
  }, [summary.origin, summary.grouped])

  const spec = useMemo(() => {
    const { dimensions } = clusterState;
    // todo
    // this condition is not strict enough. dimScores should share same elements with dimensions and measures.
    // maybe use try catch in future
    try {
      /**
       * fieldScores is the scores info for the dims and meas in current view.
       * dimensions should get the grouped new field.
       * measures shall never use the grouped field.
       */
      const fieldScores = dimScores.filter(field => {
        return dimensions.includes(field[0]) || measuresInView.includes(field[0])
      })
      const { schema } = specification(fieldScores, dataSource, dimensions, measuresInView)
      return schema;
    } catch (error) {
      console.log(error)
      return {
        position: []
      }
    }

  }, [dimScores, clusterState, dataSource, measuresInView])

  const usedSubspaceList = useMemo<Subspace[]>(() => {
    return subspaceList.slice(0, Math.round(subspaceList.length * state.topK.subspacePercentSize))
  }, [subspaceList, state.topK.subspacePercentSize]);
  useEffect(() => {
    updateState(draft => {
      draft.maxGroupNumber = Math.round(state.cookedMeasures.length / maxMeasureInView)
    })
  }, [state.cookedMeasures, updateState])

  const onSpaceChange = useCallback((dimensions, measures, matrix) => {
    setClusterState({
      dimensions,
      measures,
      matrix
    });
  }, [setClusterState])

  const onFocusGroup = useCallback(measInView => {
    setMeasuresInView(measInView);
  }, [])
  return (
    <div>
      <h3 className="notebook header">{intl.get('noteBook.univariate.title')}</h3>
      <p className="state-description">{intl.get('noteBook.univariate.desc')}</p>
      {state.loading.univariateSummary && <ProgressIndicator description="analyzing" />}
      <div className="notebook content container">
        <FieldAnalysisBoard originSummary={summary.origin} groupedSummary={summary.grouped} />
      </div>

      <h3 className="notebook header">{intl.get('noteBook.subspace.title')}</h3>
      <p className="state-description">{intl.get('noteBook.subspace.desc')}</p>
      {state.loading.subspaceSearching && <ProgressIndicator description="analyzing" />}
      {!state.loading.univariateSummary && (
        <Slider
          disabled={state.loading.subspaceSearching}
          value={state.topK.dimensionSize * 100}
          label={intl.get('noteBook.subspace.topKDimension')}
          max={100}
          valueFormat={(value: number) => `${value}%`}
          showValue={true}
          onChange={(value: number) => {
            updateState((draft) => {
              draft.topK.dimensionSize = value / 100
              draft.loading.subspaceSearching = true
            })
            const selectedDimensions = state.cookedDimensions.slice(
              0,
              Math.round((state.cookedDimensions.length * value) / 100)
            )
            combineFieldsService(dataSource, selectedDimensions, state.cookedMeasures, 'sum', state.useServer).then(
              (subspaces) => {
                if (subspaces) {
                  updateState((draft) => {
                    draft.subspaceList = subspaces
                    draft.loading.subspaceSearching = false
                  })
                }
              }
            )
          }}
        />
      )}
      {!state.loading.univariateSummary && (
        <Slider
          disabled={state.loading.subspaceSearching}
          value={state.topK.subspacePercentSize * 100}
          label={intl.get('noteBook.subspace.topKSubspace')}
          max={100}
          valueFormat={(value: number) => `${value}%`}
          showValue={true}
          onChange={(value: number) => {
            updateState((draft) => {
              draft.topK.subspacePercentSize = value / 100
            })
          }}
        />
      )}
      <div className="notebook content center container">
        <Subspaces subspaceList={usedSubspaceList} onSpaceChange={onSpaceChange} />
      </div>

      <h3 className="notebook header">{intl.get('noteBook.clustering.title')}</h3>
      <p className="state-description">{intl.get('noteBook.clustering.desc')}</p>
      <Slider
        label={intl.get('noteBook.clustering.maxGroupNum')}
        min={1}
        max={state.cookedMeasures.length || 4}
        step={1}
        // defaultValue={clusterState.measures.length / 4}
        value={state.maxGroupNumber}
        showValue={true}
        onChange={(value: number) => {
          updateState((draft) => {
            draft.maxGroupNumber = value
          })
        }}
      />
      <div className="notebook content center container">
        <ClusterBoard adjMatrix={clusterState.matrix} measures={clusterState.measures} onFocusGroup={onFocusGroup} />
      </div>

      <h3 className="notebook header">{intl.get('noteBook.vis.title')}</h3>
      <p className="state-description">{intl.get('noteBook.vis.desc')}</p>
      <Toggle
        checked={isAggregated}
        label={intl.get('noteBook.vis.aggMea')}
        defaultChecked
        onText="On"
        offText="Off"
        onChange={(e, checked: boolean | undefined) => {
          setIsAggregated(!!checked)
        }}
      />
      <div className="notebook content center container">
        <VegaBase
          defaultAggregated={isAggregated}
          defaultStack={true}
          aggregator={'sum'}
          schema={spec}
          fieldFeatures={dimScores.map((dim) => dim[3])}
          dataSource={dataSource}
          dimensions={clusterState.dimensions}
          measures={measuresInView}
        />
      </div>
    </div>
  )
}

export default NoteBook;