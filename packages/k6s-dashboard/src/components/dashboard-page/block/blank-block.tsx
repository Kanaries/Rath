import { observer } from 'mobx-react-lite';
import type { DashboardBlankBlock } from 'src/interfaces';
import BlockRoot from './root';


const BlankBlock = observer<{ data: DashboardBlankBlock }>(function BlankBlock ({ data }) {
    return (
        <BlockRoot data={data} />
    );
});


export default BlankBlock;
