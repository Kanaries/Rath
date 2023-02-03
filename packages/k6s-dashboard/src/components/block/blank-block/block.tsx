import { observer } from 'mobx-react-lite';
import BlockRoot from '../root';
import type { DashboardBlankBlock } from 'src/interfaces';


const BlankBlock = observer<{ data: DashboardBlankBlock }>(function BlankBlock ({ data }) {
    return (
        <BlockRoot data={data} />
    );
});


export default BlankBlock;
