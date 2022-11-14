import { Icon } from '@fluentui/react';
import React, { useState } from 'react';
import styled from 'styled-components';
import { PreferencesListType, PreferencesType } from '../../App';

const LoginInfoListDiv = styled.div`
    height: 250px;
    display: flex;
    border-top: 1px solid #ccc;
    > div:first-child {
        width: 150px;
        padding-top: 10px;
        padding-right: 5px;
        overflow-y: auto;
        .select-key {
            background-color: rgba(29, 78, 216);
        }
        .none-key {
            background-color: white;
        }
        p{
          padding-left: 20px;
        }
    }
    > div:last-child {
        padding: 10px 10px 0 10px;
        border-left: 1px solid #ccc;
    }
`;
const LoginInfoList = (props: { infoList: PreferencesListType[] }) => {
    const { infoList } = props;
    const [infoListKey, setInfoListKey] = useState<PreferencesType>(PreferencesType.Account);
    return (
        <LoginInfoListDiv>
            <div>
                {infoList.map((item) => (
                    <p
                        className={`${
                            item.key === infoListKey ? 'bg-blue-600 text-white' : 'text-black hover:bg-gray-200'
                        } w-full h-8 mb-2 flex items-center rounded-full py-3 px-6 cursor-pointer`}
                        onClick={() => {
                            setInfoListKey(item.key);
                        }}
                    >
                        <Icon iconName={item.icon} className="mr-2" /> {item.name}
                    </p>
                ))}
            </div>
            <div className="flex-1">{infoList.filter((item) => item.key === infoListKey)[0].element()}</div>
        </LoginInfoListDiv>
    );
};

export default LoginInfoList;
