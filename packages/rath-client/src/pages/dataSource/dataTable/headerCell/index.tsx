import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { runInAction } from 'mobx';
import { IAnalyticType, ISemanticType } from 'visual-insights';
import DistributionChart from '../../metaView/distChart';
import DropdownSelect from '../../../../components/dropDownSelect';
import { FieldExtSuggestion, IFieldMeta, IRawField } from '../../../../interfaces';
import { LiveContainer } from '../../metaView/metaList';
import FieldExtSuggestions from '../../../../components/fieldExtend/suggestions';
import { getGlobalStore } from '../../../../store';
import { PIVOT_KEYS } from '../../../../constants';
import { RathIcon } from '../../../../components/icons';
import { Button } from '../../../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip';
import StatTable from './components/liteStatTable';
import StatePlaceholder, { IColStateType } from './components/statePlaceholder';
import { HEADER_CELL_STYLE_CONFIG, HeaderCellContainer } from './styles';
import ColNameEditor from './components/colNameEditor';

function getClassName(type: 'dimension' | 'measure', disable: boolean) {
    if (disable) return 'disable';
    return type === 'dimension' ? 'dim' : 'mea';
}

interface HeaderCellProps {
    name: string;
    code: string;
    disable: boolean;
    comment: string;
    onChange?: (fid: string, propKey: keyof IRawField, value: any) => void;
    meta: IFieldMeta | null;
    extSuggestions: FieldExtSuggestion[];
    isExt: boolean;
    colType?: IColStateType;
}

interface IOption<T = string> {
    key: T;
    text: string;
}

const SEMANTIC_TYPE_OPTIONS: IOption<ISemanticType>[] = [
    { key: 'nominal', text: 'nominal' },
    { key: 'ordinal', text: 'ordinal' },
    { key: 'quantitative', text: 'quantitative' },
    { key: 'temporal', text: 'temporal' },
];

function useBIFieldTypeOptions(): IOption<IAnalyticType>[] {
    const dimensionLabel = intl.get('meta.dimension');
    const measureLabel = intl.get('meta.measure');
    const options = useMemo<IOption<IAnalyticType>[]>(() => {
        return [
            { key: 'dimension', text: dimensionLabel },
            { key: 'measure', text: measureLabel },
        ];
    }, [dimensionLabel, measureLabel]);
    return options;
}

function useFocus() {
    const [focus, setFocus] = useState<boolean>(false);
    const endFocus = useCallback(() => {
        setFocus(false);
    }, []);
    const startFocus = useCallback(() => {
        setFocus(true);
    }, []);
    const toggleFocus = useCallback<React.TouchEventHandler<HTMLDivElement>>((e) => {
        e.stopPropagation();
        setFocus((v) => !v);
    }, []);
    useEffect(() => {
        if (!focus) {
            return;
        }
        const timeout = window.setTimeout(() => setFocus(false), 5000);
        return () => window.clearTimeout(timeout);
    }, [focus]);
    return { focus, endFocus, startFocus, toggleFocus };
}

const HeaderCell: React.FC<HeaderCellProps> = (props) => {
    const { dataSourceStore, commonStore, semiAutoStore } = getGlobalStore();
    const { name, code, meta, disable, onChange, extSuggestions, isExt, colType, comment } = props;
    const [showNameEditor, setShowNameEditor] = useState<boolean>(false);
    const { focus, endFocus, startFocus, toggleFocus } = useFocus();
    const optionsOfBIFieldType = useBIFieldTypeOptions();
    const buttonId = `edit-button-${useId().replace(/:/g, '')}`;
    const canDelete = !(colType === 'preview') && isExt;
    const hasComment = comment.trim().length > 0;

    return (
        <HeaderCellContainer onMouseEnter={startFocus} onMouseLeave={endFocus} onTouchStart={toggleFocus}>
            <StatePlaceholder
                stateType={colType}
                onAcceptExtField={() => dataSourceStore.settleExtField(code)}
                onRejectExtField={() => dataSourceStore.deleteExtField(code)}
            />
            <div className="others">
                <div className={`bottom-bar ${getClassName(meta?.analyticType || 'dimension', disable)}`}></div>
                <div className="info-container">
                    <div className="header-row">
                        <h3 className="header">
                            {meta && meta.geoRole !== 'none' && <RathIcon name="globe" size={12} />}
                            {name}
                        </h3>
                        {colType === 'preview' || (
                            <>
                                <div className="edit-icon">
                                    {focus && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title={intl.get('dataSource.editName')}
                                            id={buttonId}
                                            onClick={() => {
                                                setShowNameEditor(true);
                                            }}
                                        >
                                            <RathIcon name="edit" size={12} />
                                        </Button>
                                    )}
                                    {meta && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title={intl.get('dataSource.statViewInfo.explore')}
                                            onClick={() => {
                                                runInAction(() => {
                                                    commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                                                    semiAutoStore.clearMainView();
                                                    semiAutoStore.updateMainView({
                                                        fields: [meta],
                                                        imp: meta.features.entropy,
                                                    });
                                                });
                                            }}
                                        >
                                            <RathIcon name="Lightbulb" />
                                        </Button>
                                    )}
                                </div>
                                {extSuggestions.length > 0 && (
                                    <LiveContainer style={HEADER_CELL_STYLE_CONFIG.SUGGESTION_BUTTON}>
                                        <FieldExtSuggestions fid={code} suggestions={extSuggestions} />
                                        <div className="badge">{extSuggestions.length}</div>
                                    </LiveContainer>
                                )}
                                {canDelete && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-[#c50f1f]"
                                        onClick={() => dataSourceStore.deleteExtField(code)}
                                    >
                                        <RathIcon name="Delete" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                    {hasComment ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="comment-row">{comment}</p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start">
                                {comment}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <p className="comment-row" />
                    )}
                    <ColNameEditor
                        defaultName={name}
                        setShowNameEditor={setShowNameEditor}
                        showNameEditor={showNameEditor}
                        onNameUpdate={(newName) => {
                            onChange && onChange(code, 'name', newName);
                        }}
                        defaultComment={comment}
                        onCommentUpdate={(newComment) => {
                            onChange && onChange(code, 'comment', newComment);
                        }}
                    />
                </div>
                <div className="viz-container">
                    {meta && (
                        <DistributionChart
                            label={false}
                            dataSource={meta.distribution}
                            x="memberName"
                            y="count"
                            analyticType={meta.analyticType}
                            semanticType={meta.semanticType}
                        />
                    )}
                </div>
                <div>
                    {meta && focus && (
                        <DropdownSelect
                            aria-readonly
                            value={meta.semanticType}
                            onChange={(e) => {
                                if (onChange) {
                                    onChange(code, 'semanticType', e.target.value as ISemanticType);
                                }
                            }}
                        >
                            {SEMANTIC_TYPE_OPTIONS.map((op) => (
                                <option key={op.key} value={op.key}>
                                    {intl.get(`common.semanticType.${op.key}`)}
                                </option>
                            ))}
                        </DropdownSelect>
                    )}
                    {meta && focus && (
                        <DropdownSelect
                            value={meta?.analyticType}
                            onChange={(e) => {
                                if (onChange) {
                                    // FIXME: 弱约束问题
                                    onChange(code, 'analyticType', e.target.value as IAnalyticType);
                                }
                            }}
                        >
                            {optionsOfBIFieldType.map((op) => (
                                <option key={op.key} value={op.key}>
                                    {op.text}
                                </option>
                            ))}
                        </DropdownSelect>
                    )}
                    {meta && focus && (
                        <div className="checkbox-container">
                            <label>{intl.get('dataSource.useField')}</label>
                            <input
                                checked={!disable}
                                type="checkbox"
                                onChange={(e) => {
                                    onChange && onChange(code, 'disable', !e.target.checked);
                                }}
                            />
                        </div>
                    )}
                </div>
                {meta && !focus && <StatTable features={meta.features} semanticType={meta.semanticType} />}
            </div>
        </HeaderCellContainer>
    );
};

export default HeaderCell;
