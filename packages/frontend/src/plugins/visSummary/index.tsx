import React, { useMemo, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Subspace, FieldSummary } from '../../service';
import { DefaultButton, TeachingBubble, DirectionalHint } from 'office-ui-fabric-react';

import './index.css';
import { Field } from '../../global';
import { Specification } from '../../demo/vegaBase';

interface StoryTellerProps {
  lang?: 'zh' | 'en';
  dimScores: Array<[string, number, number, Field]>;
  space: Subspace;
  spaceList: Subspace[];
  dimensions: string[];
  measures: string[];
  schema: Specification
}

const StoryTeller: React.FC<StoryTellerProps> = (props) => {
  const { space, dimensions = [], measures = [], dimScores = [], spaceList = [], schema } = props;
  const [isTeachingBubbleVisible, setIsTeachingBubbleVisible] = useState(false);
  const target = useRef<HTMLElement>();
  const sortedFieldsScores = useMemo<Array<[string, number, number, Field]>>(() => {
    return [...dimScores].sort((a, b) => a[1] - b[1]);
  }, [dimScores])
  const mostInfluencedDimension = useMemo<string | undefined>(() => {
    if (typeof space === 'undefined') return;
    for (let sp of spaceList) {
      if (sp.dimensions.some(dim => {
        return space.dimensions.includes(dim)
      })) {
        return sp.dimensions.find(dim => {
          return space.dimensions.includes(dim)
        })
      }
    }
  }, [])
  const bestMeasure = useMemo<string | undefined>(() => {
    if (typeof space === 'undefined') return;
    const measuresInView = space.measures.filter(mea => measures.includes(mea.name));
    let min = Infinity;
    let minPos = 0;
    for (let i = 0; i < measuresInView.length; i++) {
      if (measuresInView[i].value < min) {
        min = measuresInView[i].value;
        minPos = i;
      }
    }
    return measuresInView[minPos].name;
  }, [measures, space])

  const countDiffField = useMemo<string | undefined>(() => {
    let ans = sortedFieldsScores.find(dim => dimensions.includes(dim[0]));
    return ans ? ans[0] : undefined;
  }, [sortedFieldsScores, dimensions])
  const result = `
  ${ schema && schema.position ? `本图主要研究***${schema.position[0]}***与***${schema.position[1]}***之间的关系` : ''}
  ${ dimensions.length > 1 ? `+ 将数据按照***${dimensions.join(', ')}***分组，度量(指标)会表现出较强的分布差异性(规律性)` : '' }
  ${ measures.length > 1 ? `+ ***${measures.join(', ')}***具有较强的相关性` : '' }
  ${ countDiffField ? `+ 其中数量分布差异最明显的字段为***${countDiffField}***` : '' }
  ${ mostInfluencedDimension ? `+ 对聚合值造成影响最大的字段为***${mostInfluencedDimension}***` : '' }
  ${ bestMeasure ? `+ 分布差异最明显的指标为***${bestMeasure}***` : '' }
  + 其中对数据分布差异性影响最强的维度为...
  \`\`\
  `
  return (
    <div>
      <DefaultButton id="vis-summary" text="Summary" onClick={() => { setIsTeachingBubbleVisible(true) }} />
      {isTeachingBubbleVisible ? (
          <div>
            <TeachingBubble
              calloutProps={{ directionalHint: DirectionalHint.bottomCenter }}
              isWide={true}
              hasCloseIcon={true}
              closeButtonAriaLabel="Close"
              target={'#vis-summary'}
              onDismiss={() => { setIsTeachingBubbleVisible(false) }}
              headline="图表概述"
            >
              <ReactMarkdown source={result} />
            </TeachingBubble>
          </div>
        ) : null}
    </div>
  )
}

export default StoryTeller