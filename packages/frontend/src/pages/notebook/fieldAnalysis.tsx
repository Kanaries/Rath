import React, { useMemo } from 'react';
import { DetailsList, SelectionMode, IColumn, Icon, IDetailsRowProps, IDetailsRowStyles, DetailsRow, IRenderFunction } from 'office-ui-fabric-react';
import chroma, { Color } from 'chroma-js';

// todo: distribution info
interface Impurity {
  name: string;
  value: number
}
export interface FieldDescription {
  name: string;
  type: string;
  impurity: Impurity[]
}
interface FieldAnalsisProps {
  fields: FieldDescription[];
}
const basicColumns: IColumn[] = [
  {
    key: 'name',
    name: 'name',
    fieldName: 'name',
    minWidth: 70,
    maxWidth: 150
  },
  {
    key: 'type',
    name: 'type',
    fieldName: 'type',
    minWidth: 70
  }
];
function getIconNameByFieldType (type: string): string {
  switch (type) {
    case 'nominal':
      return 'TextField';
    case 'quantitative':
      return 'NumberField';
    case 'ordinal':
      return 'Breadcrumb';
    case 'temporal':
      return 'EventDate';
    default:
      return ''
  }
}

function getValueColor (value: number, range: [number, number]): string {
  return chroma.scale('YlGnBu').domain([range[1], range[0]])(value).hex()
}
const FieldAnalsis: React.FC<FieldAnalsisProps> = (props) => {
  const { fields } = props;
  const impurityList = useMemo<Impurity[]>(() => {
    return fields.length > 0 ? fields[0].impurity : []
  }, [fields]);

  const columns = useMemo<IColumn[]>(() => {
    return basicColumns.concat(impurityList.map(field => {
      return {
        key: field.name,
        isPadded: false,
        name: field.name,
        fieldName: field.name,
        minWidth: 150
      }
    }))
  }, [impurityList]);
  const items = useMemo(() => {
    return fields.map(field => {
      let record: any = {
        name: field.name,
        type: field.type,
        
      };
      field.impurity.forEach(im => {
        record[im.name] = im.value;
      });
      return record;
    })
  }, [fields])
  const impurityRange = useMemo<{[fieldName: string]: [number, number]}>(() => {
    let ans: {[fieldName: string]: [number, number]} = {};
    for (let im of impurityList) {
      let max = 0;
      let min = Infinity;
      max = Math.max(max, ...items.map(item => item[im.name]));
      min = Math.min(min, ...items.map(item => item[im.name]));
      ans[im.name] = [min, max]
    }
    return ans;
  }, [impurityList, items])
  const renderItemColumn = (item: {[key: string]: any}, index?: number, column?: IColumn) => {
    if (column !== undefined) {
      const fieldContent = item[column.fieldName!];
      switch (column.key) {
        case 'type':
          return <span>
            <Icon iconName={getIconNameByFieldType(fieldContent)} /> {fieldContent}
          </span>
        // case 'entropy':
        // case 'max_entropy':
        //   return <div style={{ backgroundColor: getValueColor(fieldContent, impurityRange[column.name])}}>{fieldContent}</div>
        default:
          return <span>{fieldContent}</span>
      }
    }
  }
  const onRenderRow: IRenderFunction<any> = (props) => {
    const customStyles: Partial<IDetailsRowStyles> = {};
    customStyles.root = { backgroundColor: getValueColor(props.item['entropy'], impurityRange['entropy']), color: '#fff' }
    return <DetailsRow {...props} styles={customStyles} />;
  };
  return <div>
    <DetailsList compact={true} columns={columns} items={items} selectionMode={SelectionMode.none} onRenderRow={onRenderRow} onRenderItemColumn={renderItemColumn} />
  </div>
}

export default FieldAnalsis;