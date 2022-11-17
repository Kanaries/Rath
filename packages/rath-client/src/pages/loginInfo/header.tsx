import React from 'react';
import { Pivot, PivotItem } from '@fluentui/react';
import styled from 'styled-components';

// enum HeaderList {
//     upload = 'Upload',
//     default = 'Default',
// }

// interface FormListType {
//     key: HeaderList;
//     name: HeaderList;
// }
// const typeList: FormListType[] = [
//     { key: HeaderList.default, name: HeaderList.default },
//     { key: HeaderList.upload, name: HeaderList.upload },
// ];

const HeaderDiv = styled.div`
    margin-top: 10px;
`;

function Header() {
    return (
        <HeaderDiv>
            <Pivot>
                <PivotItem headerText="Default">default</PivotItem>
                <PivotItem headerText="Upload">upload</PivotItem>
            </Pivot>
        </HeaderDiv>
    );
}

export default Header;
