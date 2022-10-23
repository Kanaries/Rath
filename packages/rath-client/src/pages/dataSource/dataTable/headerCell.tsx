import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { IAnalyticType, ISemanticType } from 'visual-insights';
import { Callout, IconButton, TextField } from '@fluentui/react';
import { useId } from '@fluentui/react-hooks';
import DistributionChart from '../metaView/distChart';
import DropdownSelect from '../../../components/dropDownSelect'
import { FieldExtSuggestion, IFieldMeta, IRawField } from '../../../interfaces';
import { LiveContainer } from '../metaView/metaList';
import FieldExtSuggestions from '../../../components/fieldExtend/suggestions';
import { getGlobalStore } from '../../../store';


const HeaderCellContainer = styled.div<{ isPreview: boolean }>`
    .bottom-bar {
        position: absolute;
        display: flex;
        justify-content: space-between;
        height: ${({ isPreview }) => isPreview ? '2.4em' : '4px'};
        font-size: 0.9rem;
        line-height: 2.4em;
        border-radius: ${({ isPreview }) => isPreview ? '0' : '0px 0px 2px 2px'};
        left: 0px;
        right: 0px;
        top: 0px;
        margin: 0px ${({ isPreview }) => isPreview ? '0px' : '1px'};
        padding: 0 0.8em;
        color: #fff;
        font-weight: 600;

        > div {
            display: flex;
            align-items: center;
        }
    }
    padding-top: ${({ isPreview }) => isPreview ? '2.2em' : '0'};
    .info-container{
        min-height: 50px;
    }
    .viz-container{

    }
    .dim {
        background-color: #1890ff;
    }
    .mea {
        background-color: #13c2c2;
    }
    .disable {
        background-color: #9e9e9e;
    }
    .preview {
        background-color: #eaa300;
    }
    .header-row{
        display: flex;
        flex-wrap: nowrap;
        .header{
            margin-top: 0px;
            margin-bottom: 0px;
            font-size: 18px;
            font-weight: 500;
            line-height: 36px;
            flex-grow: 1;
            max-width: 160px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        .edit-icon{
            flex-shrink: 0;
            flex-grow: 0;
        }
    }
    .checkbox-container{
        display: flex;
        align-items: center;
        margin-top: 2px;
        label{
            margin-right: 6px;
        }
    }
`;

function getClassName(type: 'dimension' | 'measure', disable: boolean) {
    if (disable) return 'disable'
    return type === "dimension" ? "dim" : "mea"
}

interface HeaderCellProps {
    name: string;
    code: string;
    disable: boolean;
    onChange?: (fid: string, propKey: keyof IRawField, value: any) => void
    meta: IFieldMeta | null;
    extSuggestions: FieldExtSuggestion[];
    isExt: boolean;
    isPreview: boolean;
}

interface IOption<T = string> { key: T; text: string }

const DataTypeOptions: IOption<ISemanticType>[] = [
    { key: 'nominal', text: 'nominal' },
    { key: 'ordinal', text: 'ordinal' },
    { key: 'quantitative', text: 'quantitative' },
    { key: 'temporal', text: 'temporal' }
]

function useBIFieldTypeOptions(): IOption<IAnalyticType>[] {
    const dimensionLabel = intl.get('meta.dimension');
    const measureLabel = intl.get('meta.measure');
    const options = useMemo<IOption<IAnalyticType>[]>(() => {
        return [
            { key: 'dimension', text: dimensionLabel },
            { key: 'measure', text: measureLabel }
        ]
    }, [dimensionLabel, measureLabel]);
    return options;
}

const HeaderCell: React.FC<HeaderCellProps> = props => {
    const { dataSourceStore } = getGlobalStore();
    const { name, code, meta, disable, isPreview, onChange, extSuggestions, isExt } = props;
    const [showNameEditor, setShowNameEditor] = useState<boolean>(false);
    const optionsOfBIFieldType = useBIFieldTypeOptions();
    const buttonId = useId('edit-button');
    const canDelete = !isPreview && isExt;

    return (
        <HeaderCellContainer isPreview={isPreview}>
            <div className="info-container">
                <div className="header-row">
                    <h3 className="header">
                    {
                            meta && meta.geoRole !== 'none' && <IconButton iconProps={{ iconName: 'globe', style: { fontSize: '12px' } }} />
                        }
                        {name}
                    </h3>
                    {isPreview || (
                        <>
                            <div className="edit-icon">
                            <IconButton id={buttonId}
                                    iconProps={{ iconName: 'edit', style: { fontSize: '12px' } }}
                                    onClick={() => {
                                        setShowNameEditor(true)
                                    }}
                                />
                            </div>
                            {extSuggestions.length > 0 && (
                                <LiveContainer
                                    style={{
                                        transform: 'scale(0.75)',
                                        margin: '-4px -18px',
                                        flexShrink: 0,
                                    }}
                                >
                                    <FieldExtSuggestions fid={code} suggestions={extSuggestions} />
                                    <div className="badge">
                                        {extSuggestions.length}
                                    </div>
                                </LiveContainer>
                            )}
                            {canDelete && (
                                <IconButton
                                    iconProps={{
                                        iconName: 'Delete',
                                        style: {
                                            color: '#c50f1f',
                                        },
                                    }}
                                    onClick={() => dataSourceStore.deleteExtField(code)}
                                />
                            )}
                        </>
                    )}
                </div>
                {
                    showNameEditor && <Callout
                        target={`#${buttonId}`}
                        onDismiss={() => { setShowNameEditor(false); }}
                    >
                        <div className="p-4">
                            <h1 className="text-xl">{intl.get('dataSource.table.edit')}</h1>
                            <div className="p-4">
                                <TextField label={intl.get('dataSource.table.fieldName')} value={name} onChange={(e, val) => {
                                    onChange && onChange(code, 'name', `${val}`)
                                }} />
                            </div>
                        </div>
                    </Callout>
                }
                {meta && (
                    <DropdownSelect aria-readonly value={meta.semanticType} onChange={e => {
                        if (onChange) {
                            onChange(code, 'semanticType', e.target.value as ISemanticType)
                        }
                    }}>
                        {DataTypeOptions.map((op) => (
                            <option key={op.key} value={op.key}>
                                {intl.get(`common.semanticType.${op.key}`)}
                            </option>
                        ))}
                    </DropdownSelect>
                )}
                {
                    <DropdownSelect value={meta?.analyticType} onChange={(e) => {
                        if (onChange) {
                            // FIXME: 弱约束问题
                            onChange(code, 'analyticType', e.target.value as IAnalyticType);
                        }
                    }}>
                        {
                            optionsOfBIFieldType.map(op => <option key={op.key} value={op.key}>{op.text}</option>)
                        }
                    </DropdownSelect>
                }
                <div className="checkbox-container">
                    <label>{intl.get('dataSource.useField')}</label>
                    <input checked={!disable} type="checkbox" onChange={e => {
                        onChange && onChange(code, 'disable', !e.target.checked)
                    }} />
                </div>
            </div>
            <div className="viz-container">
                {meta && <DistributionChart
                    dataSource={meta.distribution}
                    x="memberName"
                    y="count"
                    analyticType={meta.analyticType}
                    semanticType={meta.semanticType}
                />}
            </div>
            {/* <Checkbox label="use" checked={!disable} onChange={(e, isChecked) => {
                onChange && onChange(code, 'disable', !isChecked)
            }} /> */}
            {/* {meta && <DistributionMiniChart dataSource={meta ? meta.distribution : []} x="memberName" y="count" fieldType={meta?.semanticType || 'nominal'} />} */}
            
            <div className={`bottom-bar ${isPreview ? 'preview' : getClassName(meta?.analyticType || 'dimension', disable)}`}>
                {isPreview ? (
                    <>
                        <span>preview</span>
                        <div>
                            <IconButton
                                onClick={() => dataSourceStore.settleExtField(code)}
                                iconProps={{
                                    iconName: 'CompletedSolid',
                                    style: {
                                        color: '#0027b4',
                                    },
                                }}
                            />
                            <IconButton
                                onClick={() => dataSourceStore.deleteExtField(code)}
                                iconProps={{
                                    iconName: 'Delete',
                                    style: {
                                        color: '#c50f1f',
                                    },
                                }}
                            />
                        </div>
                    </>
                ) : ''}
            </div>
        </HeaderCellContainer>
    );
}

export default HeaderCell;
