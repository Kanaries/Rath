import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import React from 'react';
import { useGlobalStore } from '../../../store';

interface ResizeContainerProps {
    enableResize: boolean;
}
const ResizeContainer: React.FC<ResizeContainerProps> = (props) => {
    const { enableResize } = props;
    const { megaAutoStore } = useGlobalStore();
    const { visualConfig } = megaAutoStore;
    const { resizeConfig } = visualConfig;
    if (enableResize) {
        return (
            <Resizable
                size={{ width: resizeConfig.width + 24, height: resizeConfig.height + 24 }}
                onResizeStop={(e, dir, ref, d) => {
                    megaAutoStore.setVisualConig((cnf) => {
                        cnf.resizeConfig.width = cnf.resizeConfig.width + d.width;
                        cnf.resizeConfig.height = cnf.resizeConfig.height + d.height;
                    });
                }}
                style={{ border: '2px #1890ff dashed' }}
            >
                {props.children}
            </Resizable>
        );
    }
    return <div>{props.children}</div>;
};

export default observer(ResizeContainer);
