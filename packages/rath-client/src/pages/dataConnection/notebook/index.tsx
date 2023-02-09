// Copyright (C) 2023 observedobserver
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import intl from 'react-intl-universal';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../../store';
import { LoginPanel } from '../../loginInfo/account';
import NotebookSpace from './space';

const Container = styled.div`
    > header {
        font-size: 1rem;
        font-weight: 500;
        margin: 1em 0;
    }
    > div {
        display: flex;
        flex-direction: column;
        align-items: center;
        > * {
            flex-grow: 0;
            flex-shrink: 1;
        }
    }
`;

const Notebook = observer<{ setLoadingAnimation: (on: boolean) => void }>(function Notebook({ setLoadingAnimation }) {
    const { userStore } = useGlobalStore();
    const { loggedIn } = userStore;

    return (
        <Container>
            {process.env.NODE_ENV === 'development' && (
                <label>
                    Upload File (dev)
                    <input
                        type="file"
                        onChange={(e) => {
                            const [file] = e.target.files ?? [undefined];
                            if (file) {
                                userStore.loadNotebook(file);
                            }
                        }}
                    />
                </label>
            )}
            <header>{loggedIn ? intl.get('storage.download') : intl.get('login.login')}</header>
            {loggedIn ? (
                <NotebookSpace setLoadingAnimation={setLoadingAnimation} />
            ) : (
                <div>
                    <LoginPanel />
                </div>
            )}
        </Container>
    );
});

export default Notebook;
