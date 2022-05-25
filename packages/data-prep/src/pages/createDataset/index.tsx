import { PrimaryButton } from "@fluentui/react";
import { initializeIcons } from '@uifabric/icons'
initializeIcons()

import { FC } from "react";

const CreateDatasetPage: FC = () => {
    return <div className="content-container">
        <h1>create dataset</h1>
        <PrimaryButton
            text="New Dataset"
            iconProps={{ iconName: 'add' }}
        />
    </div>
}

export default CreateDatasetPage;