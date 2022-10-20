import { ActionButton } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import type { FC } from "react";
import intl from 'react-intl-universal';
import { useGlobalStore } from "../../store";


export interface FieldExpandProps {
  fid: string;
}

const FieldExpand: FC<FieldExpandProps> = ({ fid }) => {
  const { dataSourceStore } = useGlobalStore();

  return (
    <div>
      <ActionButton
        style={{
          animation: 'live-polite 4s infinite',
        }}
        iconProps={{
          iconName: 'AppIconDefaultAdd',
        }}
        text={intl.get('dataSource.extend.title')}
        onClick={() => dataSourceStore.expandSingleDateTime(fid)}
      />
    </div>
  );
};


export default observer(FieldExpand);
