main chart
```tsx
<BaseChart
    defaultAggregated={visualConfig.defaultAggregated}
    defaultStack={visualConfig.defaultStack}
    dimensions={insightSpaces[pageIndex].dimensions}
    measures={insightSpaces[pageIndex].measures}
    dataSource={visualConfig.defaultAggregated ? spec.dataView : ltsPipeLineStore.dataSource}
    schema={spec.schema}
    fieldFeatures={fieldMetas}
    aggregator={visualConfig.aggregator}
    viewSize={visualConfig.resize === IResizeMode.auto ? 320 : visualConfig.resizeConfig.width}
    stepSize={32}
    zoom={visualConfig.zoom}
    debug={visualConfig.debug}
    sizeMode={visualConfig.resize}
    width={visualConfig.resizeConfig.width}
    height={visualConfig.resizeConfig.height}
/>
```

associate charts
```tsx
<BaseChart
    aggregator={visualConfig.aggregator}
    defaultAggregated={false}
    defaultStack={visualConfig.defaultStack}
    dimensions={view.dimensions}
    measures={view.measures}
    // dataSource={vizAggregate ? view.dataView : dataSource}
    dataSource={dataSource}
    schema={view.schema}
    fieldFeatures={fieldMetas}
/> 
```

statistics vis
```tsx
<div>
    <Stack horizontal>
        <Toggle checked={showCommonVis}
            onText={intl.get('lts.commonVis.text')}
            offText={intl.get('lts.commonVis.text')}
            onChange={(e, checked) => {
            setShowCommonVis(Boolean(checked))
        }} />
        {/* <DefaultButton
            text={intl.get('lts.subinsights')}
            style={MARGIN_LEFT}
            onClick={() => {
                getSubinsights(
                    toJS(insightSpaces[pageIndex].dimensions),
                    toJS(insightSpaces[pageIndex].measures))
            }}
        /> */}
    </Stack>
    {
        insightSpaces.length > 0 && showCommonVis && spec && <CommonVisSegment
            defaultAggregated={true}
            defaultStack={visualConfig.defaultStack}
            dimensions={insightSpaces[pageIndex].dimensions}
            measures={insightSpaces[pageIndex].measures}
            dataSource={visualConfig.defaultAggregated ? spec.dataView : ltsPipeLineStore.dataSource}
            schema={spec.schema}
            fieldFeatures={fieldMetas}
            aggregator={visualConfig.aggregator}
        />
    }
</div>
```

save buttons
```tsx
<Stack horizontal>
    <DefaultButton
        text={intl.get('function.save.title')}
        iconProps={{ iconName: 'clouddownload' }}
        disabled={dataIsEmpty}
        onClick={() => {
            exploreStore.setShowSaveModal(true);
        }}
    />
    <IconButton
        style={MARGIN_LEFT}
        text={intl.get('function.exportStorage.title')}
        iconProps={{ iconName: 'DownloadDocument' }}
        disabled={dataIsEmpty}
        onClick={downloadResults}
    />
</Stack>
```