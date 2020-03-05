import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { InsightSpace } from 'visual-insights/build/esm/insights/dev';
import { specification } from "visual-insights";
import { getInsightViewSpace } from '../../service';
import { PrimaryButton, SpinButton, Slider, ProgressIndicator } from "office-ui-fabric-react";
import PreferencePanel, {
  PreferencePanelConfig
} from "../../components/preference";
import BaseChart from "../../visBuilder/vegaBase";
import { Position } from "office-ui-fabric-react/lib/utilities/positioning";

import { useGlobalState } from "../../state";
import { useComposeState } from '../../utils';

const Tag = styled.div`
  display: inline-block;
  padding: 0.2em 0.5em;
  margin: 0.2em;
  border-radius: 3px;
  color: #fff;
  font-size: 12px;
  background-color: ${props => props.color};
`;

const ColorMap: {
  [key in InsightSpace['type']]: string
} = {
  'outlier': '#cf1322',
  'trend': '#7cb305',
  'general': '#08979c'
}

const DevPage: React.FC = props => {
  const [insightViewSpace, setInsightViewSpace] = useState<InsightSpace[]>([]);
  const [sigThreshold, setSigThreshold] = useState<number>(0.6);
  const [loading, setLoading] = useState<boolean>(false);
  const [visualConfig, setVisualConfig] = useState<PreferencePanelConfig>({
    aggregator: "sum",
    defaultAggregated: true,
    defaultStack: true
  });
  const [pageStatus, setPageStatus] = useComposeState<{ show: { configPanel: boolean }}>({
    show: {
      configPanel: false
    }
  });
  const [state, , dispatch, getters] = useGlobalState();
  const [chartIndex, setChartIndex] = useState(0);
  const {
    cookedDataSource,
    cookedDimensions,
    cookedMeasures
  } = state;
  const { dimScores } = getters;

  const viewSpaceList = useMemo(() => {
    return insightViewSpace.filter(s => s.significance >= sigThreshold);
  }, [insightViewSpace, sigThreshold])

  const dataView = useMemo(() => {
    if (viewSpaceList.length === 0) return null;
    const { dimensions, measures } = viewSpaceList[chartIndex];
    const fieldScores = dimScores.filter(field => {
      return dimensions.includes(field[0]) || measures.includes(field[0]);
    });
    let { schema } = specification(
      fieldScores,
      cookedDataSource,
      dimensions,
      measures
    );
    console.log(viewSpaceList[chartIndex].description)
    return {
      schema,
      fieldFeatures: fieldScores.map(f => f[3]),
      dimensions,
      measures
    }
  }, [viewSpaceList, chartIndex, cookedDataSource])
  useEffect(() => {
    if (dataView === null) return;
    const { schema } = dataView;
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
  }, [dataView])
  return <div className="content-container">
    <PreferencePanel
        show={pageStatus.show.configPanel}
        config={visualConfig}
        onUpdateConfig={config => {
          setVisualConfig(config);
          setPageStatus(draft => {
            draft.show.configPanel = false;
          });
        }}
        onClose={() => {
          setPageStatus(draft => {
            draft.show.configPanel = false;
          });
        }}
      />
    <div className="card">
      <PrimaryButton text="Get Insights" onClick={() => {
        setLoading(true);
        getInsightViewSpace(cookedDataSource, cookedDimensions, cookedMeasures).then(res => {
          setInsightViewSpace(res);
          setLoading(false);
        })
      }} />
      { loading && <ProgressIndicator description="generating dashboard" /> }
      <div style={{ margin: "1rem", width: '280px' }}>
        <Slider
          label="significance threshold"
          max={100}
          value={sigThreshold * 100}
          valueFormat={(value: number) => `${value}%`}
          showValue={true}
          onChange={(value: number) => {
            setSigThreshold(value / 100);
            setChartIndex(0);
          }}
        />
      </div>
      <div style={{ margin: "1rem", width: '280px' }}>
        <SpinButton
          label={"Current Index"}
          value={(chartIndex + 1).toString()}
          min={0}
          max={viewSpaceList.length}
          step={1}
          iconProps={{ iconName: "Search" }}
          labelPosition={Position.end}
          // tslint:disable:jsx-no-lambda
          onValidate={(value: string) => {
            setChartIndex((Number(value) - 1) % viewSpaceList.length);
          }}
          onIncrement={() => {
            setChartIndex((chartIndex + 1) % viewSpaceList.length);
          }}
          onDecrement={() => {
            setChartIndex(
              (chartIndex - 1 + viewSpaceList.length) %
                viewSpaceList.length
            );
          }}
          incrementButtonAriaLabel={"Increase value by 1"}
          decrementButtonAriaLabel={"Decrease value by 1"}
        />
      </div>
      <p className="state-description">
          There are {viewSpaceList.length} of views of which insight significance is no less than {(sigThreshold * 100).toFixed(2)} %
      </p>
      {
        viewSpaceList[chartIndex] && <p className="state-description">
          Dimensions are {viewSpaceList[chartIndex].dimensions}, and measures are {viewSpaceList[chartIndex].measures}. <br />
          There is a significance of {(viewSpaceList[chartIndex].significance * 100).toFixed(2)}% that there exits a {viewSpaceList[chartIndex].type} in the graph. <br />
          { JSON.stringify(viewSpaceList[chartIndex].description) }
        </p>
      }
      <div>
        {
          viewSpaceList[chartIndex] && <Tag color={ColorMap[viewSpaceList[chartIndex].type]}>{viewSpaceList[chartIndex].type}</Tag>
        }
      </div>
      {
        viewSpaceList.length > 0 && dataView !== null && <div>
          <BaseChart
            aggregator={visualConfig.aggregator}
            defaultAggregated={visualConfig.defaultAggregated}
            defaultStack={visualConfig.defaultStack}
            dimensions={dataView.dimensions}
            measures={dataView.measures}
            dataSource={cookedDataSource}
            schema={dataView.schema}
            fieldFeatures={dataView.fieldFeatures}
          />
        </div>
      }
    </div>
  </div>
}

export default DevPage;
