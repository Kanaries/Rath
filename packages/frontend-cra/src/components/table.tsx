import React from 'react';
import { DetailsList, SelectionMode } from 'office-ui-fabric-react';
import { DataSource, BIField } from '../global';
export interface DataTableProps {
  dataSource: DataSource,
  fields: BIField[]
}
const DataTable: React.FC<DataTableProps> = (props) => {
  const { dataSource = [], fields = [] } = props;
  let columns = fields.map(field => {
    return {
      key: field.name,
      name: field.name,
      fieldName: field.name,
      minWidth: 70,
      maxHeight: 90
    }
  });

  return <div style={{maxHeight: 400, overflow: 'auto'}}>
    <DetailsList items={dataSource} columns={columns} selectionMode={SelectionMode.none} />
  </div>
}

export default DataTable;