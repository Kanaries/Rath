import { ContextualMenu, IContextualMenuItem } from '@fluentui/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../interfaces';


export const PillPlaceholder = styled.div`
    color: #000;
    -ms-user-select: none;
    -webkit-align-items: center;
    -webkit-user-select: none;
    align-items: center;
    /* border-radius: 10px; */
    border-style: dashed;
    border-radius: 10px;
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    cursor: pointer;
    display: -webkit-flex;
    display: flex;
    font-size: 12px;
    height: 20px;
    min-width: 150px;
    overflow-y: hidden;
    padding: 0 10px;
    user-select: none;
    margin-right: 4px;
    justify-content: center;
    .cancel-icon{
        cursor: pointer;
    }
`
 
interface FieldPlaceholderProps {
    fields: readonly IFieldMeta[];
    onAdd: (fid: string) => void;
}
const  FieldPlaceholder: React.FC<FieldPlaceholderProps> = props => {
    const { fields, onAdd } = props;
    const [showContextualMenu, setShowContextualMenu] = useState<boolean>(false);
    const container = useRef<HTMLDivElement>(null);
    const fieldOptions = useMemo<IContextualMenuItem[]>(() => {
        return fields.map(f => ({
            key: f.fid,
            text: f.name || f.fid
        }))
    }, [fields])
    const onHideContextualMenu = useCallback(() => {
        setShowContextualMenu(false);
    }, [])
    return <PillPlaceholder ref={container} onClick={() => {
        setShowContextualMenu(true)
    }}>
        + {intl.get('common.addVar')}
        <ContextualMenu
            items={fieldOptions}
            hidden={!showContextualMenu}
            target={container}
            onItemClick={(ev, item) => {
                item && onAdd(item.key)
                onHideContextualMenu();
            }}
            onDismiss={onHideContextualMenu}
      />
    </PillPlaceholder>
}

export default FieldPlaceholder;