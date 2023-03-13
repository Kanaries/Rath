import React, { useEffect, useRef } from 'react';
import {
    ActionButton,
    ChoiceGroup,
    IChoiceGroupOption,
    IconButton,
    Separator,
    Stack,
    Toggle,
} from '@fluentui/react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { runInAction } from 'mobx';
import { IAnalyticType, ISemanticType } from 'visual-insights';
import { FieldExtSuggestion, IFieldMetaWithExtSuggestions, IRawField, IRow } from '../../../interfaces';
import FieldFilter from '../../../components/fieldFilter/index';
import { ANALYTIC_TYPE_CHOICES, SEMANTIC_TYPE_CHOICES } from '../config';
import FieldExtSuggestions from '../../../components/fieldExtend/suggestions';
import { getGlobalStore } from '../../../store';
import { PIVOT_KEYS } from '../../../constants';
import { RATH_THEME_CONFIG } from '../../../theme';
import ColNameEditor from '../dataTable/headerCell/components/colNameEditor';
import DistributionChart from './distChart';

const MetaContainer = styled.div`
    overflow: auto;
    /* Make sure the box-shadow won't be hidden */
    margin-inline: -6px;
    padding-inline: 6px;
`;
const MetaItemContainer = styled.div<{ focus: boolean; isPreview: boolean }>`
    overflow: hidden;
    position: relative;
    color: #333;
    .bottom-bar {
        position: absolute;
        display: flex;
        justify-content: space-between;
        height: ${({ isPreview }) => (isPreview ? '2.4em' : '4px')};
        font-size: 0.9rem;
        line-height: 2.4em;
        border-radius: 0px 0px 2px 2px;
        left: 0px;
        right: 0px;
        top: 0px;
        margin: 0px ${({ isPreview }) => (isPreview ? '0px' : '1px')};
        padding: 0 0.8em;
        color: #fff;
        font-weight: 600;

        > div {
            display: flex;
            align-items: center;
        }
    }
    .dimension {
        background-color: ${RATH_THEME_CONFIG.dimensionColor};
    }
    .measure {
        background-color: ${RATH_THEME_CONFIG.measureColor};
    }
    .disable {
        background-color: ${RATH_THEME_CONFIG.disableColor};
    }
    .preview {
        background-color: ${RATH_THEME_CONFIG.previewColor}
    }
    h1 {
        font-weight: 500;
        font-size: 26px;
        color: #333;
    }
    .fid {
        font-size: 12px;
        font-weight: 400;
        color: rgb(89, 89, 89);
    }
    .comment {
        font-size: 12px;
        font-weight: 400;
        color: rgb(68, 68, 68);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.5em;
        height: 1.5em;
        margin-block: 0.4em;
    }
    padding: 1em;
    padding-top: ${({ isPreview }) => (isPreview ? '2.2em' : '1em')};
    margin: 1em 0em;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    border-radius: 8px;
    .flex-container {
        display: flex;
    }
    .operation-column {
        margin-left: 1em;
        padding: 0em 1em;
        border-left: 1px solid rgb(229, 231, 235);
    }
    .dist-graphics {
        flex-grow: 0;
    }

    animation: ${({ focus }) => (focus ? 'outline 2s linear' : '')};

    @keyframes outline {
        from {
            background-color: transparent;
        }
        5% {
            background-color: rgb(255, 244, 206);
        }
        20% {
            background-color: rgb(255, 244, 206);
        }
        to {
            background-color: transparent;
        }
    }

    .remove {
        position: absolute;
        right: 0;
        top: 0;
        transform: scale(1.4);

        & * {
            background: none;
            color: #c50f1f;
        }
    }
    .col-name-container {
        display: flex;
        align-items: center;
    }
`;

const IndicatorCard = styled.div`
    padding: 0em 1em;
    margin-left: 1em;
    .ind-title {
        padding: 5px 0;
        font-family: 'Segoe UI', 'Segoe UI Web (West European)', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto,
            'Helvetica Neue', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: rgb(50, 49, 48);
        box-sizing: border-box;
    }
    .ind-value {
        font-size: 3em;
        font-weight: 500;
    }
`;

export const LiveContainer = styled.div({
    position: 'relative',

    '> .badge': {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: 'rgb(223, 246, 221)',
        color: 'rgb(16, 124, 16)',
        width: '16px',
        height: '16px',
        fontSize: '12px',
        borderRadius: '50%',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translate(33%, -33%)',
    },

    '@keyframes live-polite': {
        from: {
            backgroundColor: 'transparent',
        },
        '48%': {
            backgroundColor: '#1890ff40',
        },
        '52%': {
            backgroundColor: '#1890ff40',
        },
        to: {
            backgroundColor: 'transparent',
        },
    },
});

interface MetaItemProps {
    focus: boolean;
    colKey: string;
    colName: string;
    colComment: string;
    semanticType: ISemanticType;
    analyticType: IAnalyticType;
    extSuggestions: FieldExtSuggestion[];
    dist: IRow[];
    isPreview: boolean;
    isExt: boolean;
    disable?: boolean;
    onChange?: (fid: string, propKey: keyof IRawField, value: any) => void;
}

const MetaItem: React.FC<MetaItemProps> = (props) => {
    const {
        colKey,
        colName,
        colComment,
        semanticType,
        analyticType,
        dist,
        disable,
        onChange,
        focus,
        extSuggestions,
        isPreview,
        isExt,
    } = props;
    const { dataSourceStore, semiAutoStore, commonStore } = getGlobalStore();
    const [editing, setEditing] = React.useState(false);

    const ANALYTIC_TYPE_CHOICES_LANG: IChoiceGroupOption[] = ANALYTIC_TYPE_CHOICES.map((ch) => ({
        ...ch,
        text: intl.get(`common.analyticType.${ch.key}`),
    }));

    const SEMANTIC_TYPE_CHOICES_LANG: IChoiceGroupOption[] = SEMANTIC_TYPE_CHOICES.map((ch) => ({
        ...ch,
        text: intl.get(`common.semanticType.${ch.key}`),
    }));

    const containerRef = useRef<HTMLDivElement>(null);
    const expandBtnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (focus) {
            expandBtnRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [focus]);

    useEffect(() => {
        if (isPreview) {
            containerRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [isPreview]);

    const canDelete = !isPreview && isExt;

    return (
        <MetaItemContainer className="ms-depth-4" focus={focus} isPreview={isPreview} ref={containerRef}>
            <div className={`${isPreview ? 'preview' : analyticType} bottom-bar`}>
                {isPreview && (
                    <>
                        <span>{intl.get('dataSource.preview')}</span>
                        <div>
                            <IconButton
                                onClick={() => dataSourceStore.settleExtField(colKey)}
                                iconProps={{
                                    iconName: 'CompletedSolid',
                                    style: {
                                        color: '#003a8c',
                                    },
                                }}
                            />
                            <IconButton
                                onClick={() => dataSourceStore.deleteExtField(colKey)}
                                iconProps={{
                                    iconName: 'Delete',
                                    style: {
                                        color: '#c50f1f',
                                    },
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
            <div style={{ float: 'right' }}>
                <Stack horizontal tokens={{ childrenGap: 2 }}>
                    <FieldFilter fid={colKey} />
                    <ActionButton
                        text={intl.get('dataSource.statViewInfo.explore')}
                        iconProps={{ iconName: 'Lightbulb' }}
                        onClick={() => {
                            runInAction(() => {
                                commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                                semiAutoStore.initMainViewWithSingleField(colKey);
                            });
                        }}
                    />
                    {extSuggestions.length > 0 && (
                        <LiveContainer ref={expandBtnRef}>
                            <FieldExtSuggestions fid={colKey} suggestions={extSuggestions} />
                            <div className="badge">{extSuggestions.length}</div>
                        </LiveContainer>
                    )}
                </Stack>
            </div>
            <div className="col-name-container">
                <h1>{colName}</h1>
                <IconButton
                    title={intl.get('dataSource.editName')}
                    iconProps={{ iconName: 'edit', style: { fontSize: '12px' } }}
                    onClick={() => {
                        setEditing(true);
                    }}
                />
                <ColNameEditor
                    defaultName={colName}
                    setShowNameEditor={setEditing}
                    showNameEditor={editing}
                    onNameUpdate={(newName) => {
                        onChange && onChange(colKey, 'name', newName);
                    }}
                    defaultComment={colComment}
                    onCommentUpdate={(newComment) => {
                        onChange && onChange(colKey, 'comment', newComment);
                    }}
                />
            </div>
            <div className="fid">Column ID: {colKey}</div>
            {colComment.match(/[^\s]/) && (
                // contains any non-empty character
                <p className="comment">{colComment}</p>
            )}
            <Separator />
            <div className="flex-container">
                <DistributionChart
                    dataSource={dist}
                    x="memberName"
                    y="count"
                    analyticType={analyticType}
                    semanticType={semanticType}
                />
                <IndicatorCard>
                    <div className="ind-title ms-Label root-130">{intl.get('dataSource.meta.uniqueValue')}</div>
                    <div className="ind-value">{dist.length}</div>
                </IndicatorCard>
                <div className="operation-column">
                    <ChoiceGroup
                        label={intl.get('dataSource.meta.analyticType')}
                        options={ANALYTIC_TYPE_CHOICES_LANG}
                        selectedKey={analyticType}
                        onChange={(ev, option) => {
                            onChange && option && onChange(colKey, 'analyticType', option.key);
                        }}
                    />
                </div>
                <div className="operation-column">
                    <ChoiceGroup
                        label={intl.get('dataSource.meta.semanticType')}
                        options={SEMANTIC_TYPE_CHOICES_LANG}
                        selectedKey={semanticType}
                        onChange={(ev, option) => {
                            onChange && option && onChange(colKey, 'semanticType', option.key);
                        }}
                    />
                </div>
                <div className="operation-column">
                    <Toggle
                        label={intl.get('dataSource.meta.disable.title')}
                        checked={!disable}
                        onText={intl.get('dataSource.meta.disable.on')}
                        offText={intl.get('dataSource.meta.disable.off')}
                        onChange={(ev, checked) => {
                            onChange && onChange(colKey, 'disable', !checked);
                        }}
                    />
                </div>
                <div className="operation-column">
                </div>
            </div>
            {canDelete && (
                <div className="remove">
                    <IconButton
                        iconProps={{
                            iconName: 'Delete',
                        }}
                        onClick={() => dataSourceStore.deleteExtField(colKey)}
                    />
                </div>
            )}
        </MetaItemContainer>
    );
};

interface MetaListProps {
    metas: IFieldMetaWithExtSuggestions[];
    onlyExt: boolean;
    focusIdx: number;
    onChange?: (fid: string, propKey: keyof IRawField, value: any) => void;
}
const MetaList: React.FC<MetaListProps> = (props) => {
    const { metas, onChange, focusIdx, onlyExt } = props;
    return (
        <MetaContainer>
            {metas.map((m, i) =>
                !onlyExt || m.extSuggestions.length > 0 ? (
                    <MetaItem
                        focus={i === focusIdx}
                        key={m.fid}
                        colKey={m.fid}
                        colName={`${m.name}`}
                        colComment={m.comment ?? ''}
                        semanticType={m.semanticType}
                        analyticType={m.analyticType}
                        dist={m.distribution}
                        disable={m.disable}
                        extSuggestions={m.extSuggestions}
                        onChange={onChange}
                        isExt={Boolean(m.extInfo)}
                        isPreview={m.stage === 'preview'}
                    />
                ) : null
            )}
        </MetaContainer>
    );
};

export default MetaList;
