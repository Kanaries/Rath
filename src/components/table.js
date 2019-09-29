import React from 'react';
import { DetailsList, SelectionMode } from 'office-ui-fabric-react';

export default function DataTable(props) {
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
  console.log(dataSource)
  return <div style={{maxHeight: 400, overflow: 'auto'}}>
    <DetailsList items={dataSource} columns={columns} selectionMode={SelectionMode.none} />
  </div>
}