import intl from 'react-intl-universal';
import { Pivot, PivotItem } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useGlobalStore } from '../../store';
import { IResizeMode } from '../../interfaces';
import JSONEditor from './JSONEditor';
import { PreferencesSchema } from './types';


const PreferencePage = observer(function PreferencePage () {
    const {
        semiAutoStore,
        
        dashboardStore,
        causalStore,
        commonStore,
        editorStore,
        painterStore,
        megaAutoStore,
        clickHouseStore,
        collectionStore,
        ltsPipeLineStore,
    } = useGlobalStore();
    const [mode, setMode] = useState<'UI' | 'JSON'>('UI');

    const schema = useMemo<PreferencesSchema>(() => ({
        description: '',
        type: 'object',
        properties: {
            'semiAuto.vizAlgo': {
                title: intl.get('semiAuto.main.vizsys.title'),
                type: 'enum',
                description: intl.get('semiAuto.main.vizsys.title'),
                options: ["lite", "strict"],
                value: semiAutoStore.settings.vizAlgo,
                onChange: value => semiAutoStore.updateSettings('vizAlgo', value),
                required: true,
            },
            'semiAuto.featViews': {
                title: 'features',
                type: 'boolean',
                description: 'Auto Prediction: features',
                value: semiAutoStore.autoAsso.featViews,
                onChange: value => semiAutoStore.updateAutoAssoConfig('featViews', value),
                required: false,
                defaultValue: true,
            },
            'semiAuto.pattViews': {
                title: 'patterns',
                type: 'boolean',
                description: 'Auto Prediction: patterns',
                value: semiAutoStore.autoAsso.pattViews,
                onChange: value => semiAutoStore.updateAutoAssoConfig('pattViews', value),
                required: false,
                defaultValue: true,
            },
            'semiAuto.filterViews': {
                title: 'subsets',
                type: 'boolean',
                description: 'Auto Prediction: subsets',
                value: semiAutoStore.autoAsso.filterViews,
                onChange: value => semiAutoStore.updateAutoAssoConfig('filterViews', value),
                required: false,
                defaultValue: true,
            },
            'semiAuto.neighborViews': {
                title: 'neighbors',
                type: 'boolean',
                description: 'Auto Prediction: neighbors',
                value: semiAutoStore.autoAsso.neighborViews,
                onChange: value => semiAutoStore.updateAutoAssoConfig('neighborViews', value),
                required: false,
                defaultValue: true,
            },
            'visualization.excludeScaleZero': {
                title: intl.get('megaAuto.operation.excludeScaleZero'),
                type: 'boolean',
                description: intl.get('megaAuto.operation.excludeScaleZero'),
                value: semiAutoStore.mainVizSetting.excludeScaleZero,
                onChange: value => semiAutoStore.updateMainVizSettings(s => s.excludeScaleZero = value),
                required: false,
                defaultValue: false,
            },
            'visualization.debug': {
                title: intl.get('megaAuto.operation.debug'),
                type: 'boolean',
                description: intl.get('megaAuto.operation.debug'),
                value: semiAutoStore.mainVizSetting.debug,
                onChange: value => semiAutoStore.updateMainVizSettings(s => s.debug = value),
                required: false,
                defaultValue: false,
            },
            'visualization.zoom': {
                title: intl.get('megaAuto.operation.zoom'),
                type: 'boolean',
                description: intl.get('megaAuto.operation.zoom'),
                value: semiAutoStore.mainVizSetting.interactive,
                onChange: value => semiAutoStore.updateMainVizSettings(s => s.interactive = value),
                required: false,
                defaultValue: false,
            },
            'visualization.nlg': {
                title: 'NLG',
                type: 'boolean',
                description: 'NLG (beta)',
                value: semiAutoStore.mainVizSetting.nlg,
                onChange: value => semiAutoStore.updateMainVizSettings(s => s.nlg = value),
                required: false,
                defaultValue: false,
            },
            'visualization.resize': {
                type: 'object',
                description: intl.get('megaAuto.operation.resize.title'),
                properties: {
                    'visualization.resizeMode': {
                        title: intl.get('megaAuto.operation.resize'),
                        type: 'enum',
                        description: intl.get('megaAuto.operation.resize'),
                        options: [IResizeMode.auto, IResizeMode.control],
                        value: semiAutoStore.mainVizSetting.resize.mode,
                        onChange: value => semiAutoStore.updateMainVizSettings(s => s.resize.mode = value as IResizeMode),
                        required: false,
                        defaultValue: IResizeMode.auto,
                    },
                },
                // TODO: not working
                allOf: [
                    {
                        'if': {
                            properties: { 'visualization.resizeMode': { 'const': IResizeMode.control } },
                        },
                        then: {
                            properties: {
                                'visualization.resize.width': {
                                    title: 'width',
                                    type: 'number',
                                    description: 'width',
                                    value: semiAutoStore.mainVizSetting.resize.width,
                                    exclusiveMinimum: 0,
                                    onChange: (value: number) => semiAutoStore.updateMainVizSettings(s => s.resize.width = value),
                                    required: true,
                                },
                                'visualization.resize.height': {
                                    title: 'height',
                                    type: 'number',
                                    description: 'height',
                                    value: semiAutoStore.mainVizSetting.resize.height,
                                    exclusiveMinimum: 0,
                                    onChange: (value: number) => semiAutoStore.updateMainVizSettings(s => s.resize.height = value),
                                    required: true,
                                },
                            },
                        },
                    },
                ],
            },
        },
    }), [semiAutoStore]);

    return (
        <div className="card">
            <Pivot selectedKey={mode} onLinkClick={item => item?.props.itemKey && setMode(item?.props.itemKey as typeof mode)}>
                <PivotItem itemKey="UI" headerText={intl.get('preference.ui')}>

                </PivotItem>
                <PivotItem itemKey="JSON" headerText={intl.get('preference.json')}>
                    <JSONEditor schema={schema} />
                </PivotItem>
            </Pivot>
        </div>
    );
});


export default PreferencePage;
