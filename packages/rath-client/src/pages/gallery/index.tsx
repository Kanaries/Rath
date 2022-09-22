import React, { useEffect, useState, useMemo } from "react";
import intl from 'react-intl-universal';
import {
  DefaultButton,
  IconButton,
  Stack,
  ProgressIndicator,
  SpinButton,
  Pivot,
  PivotItem,
  Position
} from '@fluentui/react';
import { toJS } from "mobx";
import { observer } from 'mobx-react-lite'
import { useGlobalStore } from "../../store";
import SearchBoard from "./search/index";
import ObserverChart from "./observerChart";
import VizPreference from "./vizPreference";
import Association from "./association";


const pivotKeyList = [
  'rankList',
  'search'
];

const Gallery: React.FC = props => {
  const { galleryStore } = useGlobalStore();
  const {
    currentPage,
    showAssociation,
    vizRecommand,
    fields,
    visualConfig,
    fieldMetas
  } = galleryStore;
  const pivotList = useMemo(() => {
    return pivotKeyList.map((page, index) => {
      return { title: intl.get(`explore.${page}`), itemKey: 'pivot-' + index }
    })
  }, [])

  const [pivotIndex, setPivotIndex] = useState(pivotList[0].itemKey);

  useEffect(() => {
    // 换页的时候强制关闭联想.
    galleryStore.showAssociation = false;
  }, [currentPage, galleryStore]);

  return (
    <div className="content-container">
      <VizPreference />

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
        {galleryStore.progressTag !== 'none' && (
          <ProgressIndicator description="calculating" />
        )}
        {pivotIndex === pivotList[0].itemKey && (
          <div>
            <h2 className="state-header" style={{ marginBottom: 0 }}>
              {intl.get('explore.title')}
              <IconButton
                iconProps={{ iconName: 'Settings' }}
                title={intl.get('explore.preference')}
                ariaLabel={intl.get('explore.preference')}
                onClick={() => {
                  galleryStore.showConfigPanel = true;
                }}
              />
              <IconButton
                iconProps={{ iconName: 'Lightbulb' }}
                title={intl.get('explore.digIn')}
                ariaLabel={intl.get('explore.digIn')}
                onClick={() => {
                  galleryStore.showAssociation = true;
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
                      label={intl.get('explore.currentPage')}
                      value={(currentPage + 1).toString()}
                      min={0}
                      max={galleryStore.viewSpaces.length}
                      step={1}
                      iconProps={{ iconName: 'Search' }}
                      labelPosition={Position.end}
                      // tslint:disable:jsx-no-lambda
                      onValidate={(value: string) => {
                        galleryStore.goToPage((Number(value) - 1) % galleryStore.viewSpaces.length)
                      }}
                      onIncrement={() => {
                        galleryStore.nextPage();
                      }}
                      onDecrement={() => {
                        galleryStore.lastPage();
                      }}
                      incrementButtonAriaLabel={'Increase value by 1'}
                      decrementButtonAriaLabel={'Decrease value by 1'}
                    />
                  </div>
                  <p className="state-description">
                    Page No. {currentPage + 1} of {galleryStore.viewSpaces.length}
                  </p>
                  <Stack horizontal tokens={{ childrenGap: 20 }}>
                    <DefaultButton
                      text={intl.get('explore.last')}
                      onClick={() => {
                        galleryStore.lastPage();
                      }}
                      allowDisabledFocus
                    />
                    <DefaultButton
                      text={intl.get('explore.next')}
                      onClick={() => {
                        galleryStore.nextPage();
                      }}
                      allowDisabledFocus
                    />
                  </Stack>
                  <div style={{ margin: '10px 0px'}}>
                    <DefaultButton
                      iconProps={{
                        iconName: galleryStore.likes.has(currentPage) ? 'HeartFill' : 'Heart',
                        style: { color: '#f5222d' },
                      }}
                      text={intl.get('explore.like')}
                      onClick={() => {
                        galleryStore.likeIt(currentPage, vizRecommand.schema )
                      }}
                    />
                  </div>
                  <h3>Specification</h3>
                  <pre>{JSON.stringify(vizRecommand.schema, null, 2)}</pre>
                  {/* <VisSummary
                    dimensions={vizRecommand.dimensions}
                    measures={vizRecommand.measures}
                    dimScores={fields}
                    space={currentSpace}
                    spaceList={subspaceList}
                    schema={vizRecommand.schema}
                  /> */}
                </div>
                <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg9" style={{ overflow: 'auto' }}>
                  <ObserverChart />
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
              let pos = galleryStore.viewSpaces.findIndex((v) => v.index === index)
              if (pos > -1) {
                galleryStore.goToPage(pos)
              }
            }}
            subspaceList={galleryStore.subspaceList}
            fieldMetas={fieldMetas}
            digDimensionProps={{
              visualConfig: toJS(visualConfig),
              dataSource: galleryStore.dataSource,
              viewSpaces: galleryStore.viewSpaces,
              fieldScores: fields,
              interestedViewSpace: galleryStore.currentViewSpace,
            }}
          />
        </div>
      )}
    </div>
  )
};

export default observer(Gallery);
