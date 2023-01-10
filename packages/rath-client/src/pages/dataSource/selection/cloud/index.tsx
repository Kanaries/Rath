import intl from 'react-intl-universal';
import styled from 'styled-components';
import { observer } from "mobx-react-lite";
import { useGlobalStore } from "../../../../store";
import { LoginPanel } from "../../../loginInfo/account";
import { KanariesDatasetPackCloudExtension } from '../../../../constants';
import KanariesCloudSpace from './space';


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

const KanariesCloud = observer<{ setLoadingAnimation: (on: boolean) => void }>(function KanariesCloud ({ setLoadingAnimation }) {
    const { userStore } = useGlobalStore();
    const { loggedIn } = userStore;
    
    return (
        <Container>
            {process.env.NODE_ENV === 'development' && (
                <label>
                    Upload File (dev)
                    <input
                        type="file"
                        onChange={e => {
                            const [file] = e.target.files ?? [undefined];
                            if (file?.name.endsWith('.krf')) {
                                userStore.loadNotebook(file);
                            } else if (file?.name.endsWith(`.${KanariesDatasetPackCloudExtension}`)) {
                                userStore.loadDataset(file, -1, -1, -1);
                            }
                        }}
                    />
                </label>
            )}
            <header>{loggedIn ? intl.get('storage.download') : intl.get('login.login')}</header>
            {loggedIn ? (
                <KanariesCloudSpace setLoadingAnimation={setLoadingAnimation} />
            ) : (
                <div>
                    <LoginPanel />
                </div>
            )}
        </Container>
    );
});


export default KanariesCloud;
