import React from 'react';
import { useGlobalStore } from '../../store';
import DropdownSelect from '../../components/dropDownSelect';
import { IDropdownOption } from '@fluentui/react';
import { SUPPORT_LANG } from '../../locales';
import styled from 'styled-components';

const langOptions: IDropdownOption[] = SUPPORT_LANG.map((lang) => ({
    key: lang.value,
    text: lang.name,
}));

const SetUpDiv = styled.div`
    > div {
        width: 100%;
        height: 30px;
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        padding-left: 10px;
        padding-top: 10px;
        > span:first-child {
            display: inline-block;
            width: 80px;
        }
        > span:last-child {
            display: inline-block;
            flex: 1;
        }
    }
`;

function Setup() {
    const { langStore, commonStore } = useGlobalStore();
    const { navMode } = commonStore;
    return (
        <SetUpDiv>
            {navMode === 'text' && (
                <div className="lang">
                    <span className="label">Language:</span>
                    <span className="element">
                        <DropdownSelect
                            border
                            value={langStore.lang}
                            onChange={(e) => {
                                langStore.changeLocalesAndReload(e.target.value);
                            }}
                        >
                            {langOptions.map((lang) => (
                                <option key={lang.key} value={lang.key}>
                                    {lang.text}
                                </option>
                            ))}
                        </DropdownSelect>
                    </span>
                </div>
            )}
            <div></div>
        </SetUpDiv>
    );
}

export default Setup;
