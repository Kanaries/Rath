import { useState } from 'react';
import { Icon } from '@fluentui/react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { PreferencesListType, PreferencesType } from '.';

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
        p {
            padding-left: 20px;
        }
    }
    > div:last-child {
        padding: 0px 10px 0 10px;
        border-left: 1px solid #ccc;
    }
    .login-info {
        /* w-full h-8 mb-2 flex items-center rounded-full py-3 px-6 cursor-pointer */
        width: 100%;
        display: flex;
        align-items: center;
        cursor: pointer;
    }
    .check {
        --tw-bg-opacity: 1;
        background-color: #0078d4;//rgb(37 99 235 / var(--tw-bg-opacity));
        color: white;
    }
    .none-check {
        color: black;
    }
    .none-check:hover {
        --tw-bg-opacity: 1;
        background-color: rgb(229 231 235 / var(--tw-bg-opacity));
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
                        key={item.key}
                        className={`${item.key === infoListKey ? 'check' : 'none-check'} login-info`}
                        onClick={() => {
                            setInfoListKey(item.key);
                        }}
                    >
                        <Icon iconName={item.icon} style={{ marginRight: '1em' }} /> {intl.get(`login.${item.name}`)}
                    </p>
                ))}
            </div>
            <div style={{ flex: 1 }}>{infoList.filter((item) => item.key === infoListKey)[0].element()}</div>
        </LoginInfoListDiv>
    );
};

export default LoginInfoList;
