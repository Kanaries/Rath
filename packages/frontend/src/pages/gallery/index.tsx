import React, { useEffect, useState, useMemo, useRef } from "react";
import intl from 'react-intl-universal';
import {
  DefaultButton,
  IconButton,
  Stack,
  ProgressIndicator,
  SpinButton,
  Pivot,
  PivotItem,
} from "office-ui-fabric-react";
import { Position } from "office-ui-fabric-react/lib/utilities/positioning";
import PreferencePanel, {
  PreferencePanelConfig
} from "../../components/preference";
import BaseChart, { Specification } from "../../visBuilder/vegaBase";
import { DataSource, Field } from "../../global";
import { specification } from "visual-insights";
import VisSummary from "../../plugins/visSummary/index";
import { useGlobalState } from "../../state";
import Association from "./association/index";
import {
  Subspace,
  clusterMeasures,
  ViewSpace,
  FieldSummary
} from "../../service";
import SearchBoard from "./search/index";
import { observer } from 'mobx-react-lite'
import { useGalleryStore } from './store';

const pivotKeyList = [
  'rankList',
  'search'
];

interface DataView {
  schema: Specification;
  aggData: DataSource;
  fieldFeatures: Field[];
  dimensions: string[];
  measures: string[];
}

interface GalleryProps {
  subspaceList: Subspace[];
  /**
   * dataSource here should be cookedData.
   */
  dataSource: DataSource;
  summary: {
    origin: FieldSummary[];
    grouped: FieldSummary[];
  };
}

const Gallery: React.FC<GalleryProps> = props => {
  const { dataSource, summary, subspaceList } = props;
  const [state, updateState] = useGlobalState();
  const store = useGalleryStore();
  const {
    currentPage,
    showAssociation,
    showConfigPanel
  } = store;
  const pivotList = useMemo(() => {
    return pivotKeyList.map((page, index) => {
      return { title: intl.get(`explore.${page}`), itemKey: 'pivot-' + index }
    })
  }, [state.lang])

  const [pivotIndex, setPivotIndex] = useState(pivotList[0].itemKey);

  const [visualConfig, setVisualConfig] = useState<PreferencePanelConfig>({
    aggregator: "sum",
    defaultAggregated: true,
    defaultStack: true
  });
  // const [viewSpaces, setViewSpaces] = useState<ViewSpace[]>([]);

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

  useEffect(() => {
    updateState(draft => {
      draft.loading.gallery = true;
    });
    // todo:
    // should group number be the same for different subspaces?
    clusterMeasures(
      state.maxGroupNumber,
      subspaceList.map(space => {
        return {
          dimensions: space.dimensions,
          measures: space.measures,
          matrix: space.correlationMatrix
        };
      }),
      state.useServer
    ).then(viewSpaces => {
      store.setViewSpaces(viewSpaces);
      updateState(draft => {
        draft.loading.gallery = false;
      });
      store.clearLikes();
    });
  }, [subspaceList, dataSource, state.maxGroupNumber, state.useServer, updateState, store]);

  const dimScores = useMemo<[string, number, number, Field][]>(() => {
    return [...summary.origin, ...summary.grouped].map(field => {
      return [
        field.fieldName,
        field.entropy,
        field.maxEntropy,
        { name: field.fieldName, type: field.type }
      ];
    });
  }, [summary.origin, summary.grouped]);

  useEffect(() => {
    const viewState = store.currentViewSpace;
    if (viewState) {
      const { dimensions, measures } = viewState;
      try {
        // todo: find the strict confition instead of using try catch
        const fieldScores = dimScores.filter(field => {
          return dimensions.includes(field[0]) || measures.includes(field[0]);
        });
        const { schema } = specification(
          fieldScores,
          dataSource,
          dimensions,
          measures
        );
        setDataView({
          schema,
          fieldFeatures: fieldScores.map(f => f[3]),
          aggData: dataSource,
          dimensions,
          measures
        });
        // ugly code
        // todo:
        // implement this in specification
        // + check geomType
        // + check geom number and aggregated geom number
        if (
          schema.geomType &&
          (schema.geomType.includes("point") ||
            schema.geomType.includes("density"))
        ) {
          setVisualConfig(config => {
            return {
              ...config,
              defaultAggregated: false
            };
          });
        } else {
          setVisualConfig(config => {
            return {
              ...config,
              defaultAggregated: true
            };
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }, [store.currentViewSpace, dataSource, dimScores]);
  const currentSpace = useMemo<Subspace>(() => {
    return subspaceList.find(subspace => {
      return subspace.dimensions.join(",") === dataView.dimensions.join(",");
    })!;
  }, [subspaceList, dataView]);

  useEffect(() => {
    store.showAssociation = false;
  }, [currentPage]);

  return (
    <div className="content-container">
      <PreferencePanel
        show={showConfigPanel}
        config={visualConfig}
        onUpdateConfig={(config) => {
          setVisualConfig(config)
          store.showConfigPanel = false;
        }}
        onClose={() => {
          store.showConfigPanel = false;
        }}
      />

      <div className="card" style={{ paddingTop: '0.2rem' }}>
        <Pivot
          selectedKey={pivotIndex}
          onLinkClick={(item) => {
            item && setPivotIndex(item.props.itemKey!)
          }}
        >
          {pivotList.map((pivot) => (
            <PivotItem headerText={pivot.title} key={pivot.itemKey} itemKey={pivot.itemKey} />
          ))}
        </Pivot>
        {(state.loading.gallery || state.loading.subspaceSearching || state.loading.univariateSummary) && (
          <ProgressIndicator description="calculating" />
        )}
        {pivotIndex === pivotList[0].itemKey && (
          <div>
            <h2 style={{ marginBottom: 0 }}>
              {intl.get('explore.title')}
              <IconButton
                iconProps={{ iconName: 'Settings' }}
                title={intl.get('explore.preference')}
                ariaLabel={intl.get('explore.preference')}
                onClick={() => {
                  store.showConfigPanel = true;
                }}
              />
              <IconButton
                iconProps={{ iconName: 'Lightbulb' }}
                title={intl.get('explore.digIn')}
                ariaLabel={intl.get('explore.digIn')}
                onClick={() => {
                  store.showAssociation = true;
                }}
              />
            </h2>
            <p className="state-description">{intl.get('explore.desc')}</p>
            <p className="state-description">{intl.get('explore.tip')}</p>
            <div className="ms-Grid" dir="ltr">
              <div className="ms-Grid-row">
                <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg3" style={{ overflow: 'auto' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <SpinButton
                      label={intl.get('expore.currentPage')}
                      value={(currentPage + 1).toString()}
                      min={0}
                      max={store.viewSpaces.length}
                      step={1}
                      iconProps={{ iconName: 'Search' }}
                      labelPosition={Position.end}
                      // tslint:disable:jsx-no-lambda
                      onValidate={(value: string) => {
                        store.goToPage((Number(value) - 1) % store.viewSpaces.length)
                      }}
                      onIncrement={() => {
                        store.nextPage();
                      }}
                      onDecrement={() => {
                        store.lastPage();
                      }}
                      incrementButtonAriaLabel={'Increase value by 1'}
                      decrementButtonAriaLabel={'Decrease value by 1'}
                    />
                  </div>
                  <p className="state-description">
                    Page No. {currentPage + 1} of {store.viewSpaces.length}
                  </p>
                  <Stack horizontal tokens={{ childrenGap: 20 }}>
                    <DefaultButton
                      text={intl.get('explore.last')}
                      onClick={() => {
                        store.lastPage();
                      }}
                      allowDisabledFocus
                    />
                    <DefaultButton
                      text={intl.get('explore.next')}
                      onClick={() => {
                        store.nextPage();
                      }}
                      allowDisabledFocus
                    />
                  </Stack>
                  <div style={{ margin: '10px 0px'}}>
                    <DefaultButton
                      iconProps={{
                        iconName: store.likes.has(currentPage) ? 'HeartFill' : 'Heart',
                        style: { color: '#f5222d' },
                      }}
                      text={intl.get('explore.like')}
                      onClick={() => {
                        store.likeIt(currentPage, dataView.schema )
                      }}
                    />
                  </div>
                  <h3>Specification</h3>
                  <pre>{JSON.stringify(dataView.schema, null, 2)}</pre>
                  <VisSummary
                    dimensions={dataView.dimensions}
                    measures={dataView.measures}
                    dimScores={dimScores}
                    space={currentSpace}
                    spaceList={subspaceList}
                    schema={dataView.schema}
                  />
                </div>
                <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg9" style={{ overflow: 'auto' }}>
                  <BaseChart
                    aggregator={visualConfig.aggregator}
                    defaultAggregated={visualConfig.defaultAggregated}
                    defaultStack={visualConfig.defaultStack}
                    dimensions={dataView.dimensions}
                    measures={dataView.measures}
                    dataSource={dataView.aggData}
                    schema={dataView.schema}
                    fieldFeatures={dataView.fieldFeatures}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {pivotIndex === pivotList[1].itemKey && <SearchBoard />}
      </div>

      {pivotIndex === pivotList[0].itemKey && showAssociation && (
        <div className="card">
          <h2> {intl.get('explore.related.title')} </h2>
          <Association
            onSelectView={(index) => {
              let pos = store.viewSpaces.findIndex((v) => v.index === index)
              if (pos > -1) {
                store.goToPage(pos)
              }
            }}
            subspaceList={subspaceList}
            digDimensionProps={{
              visualConfig,
              dataSource,
              viewSpaces: store.viewSpaces,
              fieldScores: dimScores,
              interestedViewSpace: store.currentViewSpace,
            }}
          />
        </div>
      )}
    </div>
  )
};

export default observer(Gallery);
