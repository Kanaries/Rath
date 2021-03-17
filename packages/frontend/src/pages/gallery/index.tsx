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
import { useComposeState } from "../../utils/index";
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

interface PageStatus {
  show: {
    insightBoard: boolean;
    configPanel: boolean;
    fieldConfig: boolean;
    dataConfig: boolean;
  };
}
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
  const pivotList = useMemo(() => {
    return pivotKeyList.map((page, index) => {
      return { title: intl.get(`explore.${page}`), itemKey: 'pivot-' + index }
    })
  }, [state.lang])

  const [currentPage, setCurrentPage] = useState(0);
  const [pivotIndex, setPivotIndex] = useState(pivotList[0].itemKey);
  const [pageStatus, setPageStatus] = useComposeState<PageStatus>({
    show: {
      insightBoard: false,
      fieldConfig: false,
      configPanel: false,
      dataConfig: false
    }
  });
  const [showAssociation, setShowAssociation] = useState(false);
  const [visualConfig, setVisualConfig] = useState<PreferencePanelConfig>({
    aggregator: "sum",
    defaultAggregated: true,
    defaultStack: true
  });
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
  };

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
      setViewSpaces(viewSpaces);
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
    const viewState = viewSpaces[currentPage];
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
  }, [viewSpaces, currentPage, dataSource, dimScores]);
  const currentSpace = useMemo<Subspace>(() => {
    return subspaceList.find(subspace => {
      return subspace.dimensions.join(",") === dataView.dimensions.join(",");
    })!;
  }, [subspaceList, dataView]);
  useEffect(() => {
    setShowAssociation(false);
  }, [currentPage]);
  return (
    <div className="content-container">
      <PreferencePanel
        show={pageStatus.show.configPanel}
        config={visualConfig}
        onUpdateConfig={(config) => {
          setVisualConfig(config)
          setPageStatus((draft) => {
            draft.show.configPanel = false
          })
        }}
        onClose={() => {
          setPageStatus((draft) => {
            draft.show.configPanel = false
          })
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
                  setPageStatus((draft) => {
                    draft.show.configPanel = true
                  })
                }}
              />
              <IconButton
                iconProps={{ iconName: 'Lightbulb' }}
                title={intl.get('explore.digIn')}
                ariaLabel={intl.get('explore.digIn')}
                onClick={() => {
                  setShowAssociation(true)
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
                      max={viewSpaces.length}
                      step={1}
                      iconProps={{ iconName: 'Search' }}
                      labelPosition={Position.end}
                      // tslint:disable:jsx-no-lambda
                      onValidate={(value: string) => {
                        gotoPage((Number(value) - 1) % viewSpaces.length)
                      }}
                      onIncrement={() => {
                        gotoPage((currentPage + 1) % viewSpaces.length)
                      }}
                      onDecrement={() => {
                        gotoPage((currentPage - 1 + viewSpaces.length) % viewSpaces.length)
                      }}
                      incrementButtonAriaLabel={'Increase value by 1'}
                      decrementButtonAriaLabel={'Decrease value by 1'}
                    />
                  </div>
                  <p className="state-description">
                    Page No. {currentPage + 1} of {viewSpaces.length}
                  </p>
                  <Stack horizontal tokens={{ childrenGap: 20 }}>
                    <DefaultButton
                      text={intl.get('explore.last')}
                      onClick={() => {
                        gotoPage((currentPage - 1 + viewSpaces.length) % viewSpaces.length)
                      }}
                      allowDisabledFocus
                    />
                    <DefaultButton
                      text={intl.get('explore.next')}
                      onClick={() => {
                        gotoPage((currentPage + 1) % viewSpaces.length)
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
                        store.likeIt(currentPage, viewSpaces.length, dataView.schema, )
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
              let pos = viewSpaces.findIndex((v) => v.index === index)
              if (pos > -1) {
                gotoPage(pos)
              }
            }}
            subspaceList={subspaceList}
            digDimensionProps={{
              visualConfig,
              dataSource,
              viewSpaces,
              fieldScores: dimScores,
              interestedViewSpace: viewSpaces[currentPage],
            }}
          />
        </div>
      )}
    </div>
  )
};

export default observer(Gallery);
