import { ContextualMenu, IContextualMenuItem, IContextualMenuListProps, IRenderFunction, Icon, SearchBox } from '@fluentui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../../interfaces';

export const PillPlaceholder = styled.div`
    color: #000;
    -ms-user-select: none;
    -webkit-user-select: none;
    border-color: rgb(229,231,235);
    /* border-radius: 10px; */
    border-style: dashed;
    border-radius: 10px;
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    cursor: pointer;
    font-size: 12px;
    height: 20px;
    min-width: 150px;
    padding: 0 10px;
    user-select: none;
    margin-right: 4px;
    display: flex;
    align-items: center;
    -webkit-align-items: center;
    overflow-y: hidden;
    justify-content: center;
    .cancel-icon {
        cursor: pointer;
    }
`;

export function fields2options (fields: readonly IFieldMeta[]): IContextualMenuItem[] {
    return fields.map((f) => ({
        key: f.fid,
        text: f.name || f.fid,
    }))
}

interface FieldPlaceholderProps {
    fields: readonly IFieldMeta[];
    onAdd: (fid: string) => void;
}
const FieldPlaceholder: React.FC<FieldPlaceholderProps> = (props) => {
    const { fields, onAdd } = props;
    const [showContextualMenu, setShowContextualMenu] = useState<boolean>(false);

    const container = useRef<HTMLDivElement>(null);
    const [fieldOptions, setFieldOptions] = useState<IContextualMenuItem[]>(fields2options(fields));

    useEffect(() => {
        setFieldOptions(fields2options(fields));
    }, [fields])

    const onHideContextualMenu = useCallback(() => {
        setShowContextualMenu(false);
    }, []);

    const onChange = React.useCallback((ev?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
        if (typeof ev === 'undefined' || typeof newValue === 'undefined' || newValue === '') {
            setFieldOptions(fields2options(fields))
            return;
        }
        const filteredItems = fieldOptions.filter(
          item => item.text && item.text.toLowerCase().indexOf(newValue.toLowerCase()) !== -1,
        );
    
        if (!filteredItems || !filteredItems.length) {
          filteredItems.push({
            key: 'no_results',
            onRender: (item, dismissMenu) => (
              <div key="no_results" >
                <Icon iconName="SearchIssue" title={intl.get('common.search.notFound')} />
                <span>No vars found</span>
              </div>
            ),
          });
        }
    
        setFieldOptions(filteredItems);
      }, [fieldOptions, fields]);

    const renderMenuList = React.useCallback(
        (menuListProps?: IContextualMenuListProps, defaultRender?: IRenderFunction<IContextualMenuListProps>) => {
            return (
                <div>
                    <div style={{ borderBottom: '1px solid #ccc' }}>
                        <SearchBox
                            ariaLabel={intl.get('common.search.searchFields')}
                            placeholder={intl.get('common.search.searchFields')}
                            onChange={onChange}
                            onAbort={() => {
                                setFieldOptions(fields2options(fields))
                            }}
                        />
                    </div>
                    {defaultRender && defaultRender(menuListProps)}
                </div>
            );
        },
        [onChange, fields]
    );
    return (
        <PillPlaceholder
            ref={container}
            onClick={(e) => {
                e.stopPropagation();
                setShowContextualMenu(true);
            }}
        >
            + {intl.get('common.addVar')}
            <ContextualMenu
                items={fieldOptions}
                onRenderMenuList={renderMenuList}
                hidden={!showContextualMenu}
                target={container}
                onItemClick={(ev, item) => {
                    item && onAdd(item.key);
                    onHideContextualMenu();
                }}
                onDismiss={onHideContextualMenu}
            />
        </PillPlaceholder>
    );
};

export default FieldPlaceholder;
