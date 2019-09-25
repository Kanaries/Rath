import React from 'react';
import { DetailsList, SelectionMode } from 'office-ui-fabric-react';

export default function DataTable(props) {
  const { dataSource = [], dimensions = [], measures = [] } = props;
  let columns = [];
  columns = dimensions.map(field => {
    return {
      key: field,
      name: field,
      fieldName: field,
      minWidth: 70,
        maxWidth: 90,
      data: 'string'
    }
  })
  columns.concat(measures.map(field => {
    return {
      key: field,
      name: field,
      fieldName: field,
      minWidth: 70,
        maxWidth: 90,
      data: 'number'
    }
  }))
  return <div style={{maxHeight: 400, overflow: 'auto'}}>
    <DetailsList items={dataSource} columns={columns} selectionMode={SelectionMode.none} />
  </div>
}