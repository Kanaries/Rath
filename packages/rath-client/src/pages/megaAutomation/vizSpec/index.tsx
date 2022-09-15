import React, { useMemo } from 'react';
import { IconButton, Dropdown, IDropdownOption, Stack } from '@fluentui/react';
import { ISpec } from 'visual-insights';
import { IFieldMeta } from '../../../interfaces';
import { GEMO_TYPES } from './config';

interface VizSpecProps {
    schema: ISpec;
    fields: IFieldMeta[];
    onSchemaChange: (schemaKey: keyof ISpec, pos: number, val: string | null) => void
}
const VizSpec: React.FC<VizSpecProps> = props => {
    const { schema, fields, onSchemaChange } = props;
    const markOptions = useMemo<IDropdownOption[]>(() => {
        return GEMO_TYPES.map((geo) => ({
            key: geo.value,
            text: geo.label
        }))
    }, [])
    // const dimOptions = useMemo()
    const fieldOptions = useMemo<IDropdownOption[]>(() => {
        return fields.map(f => {
            return {
                key: f.fid,
                text: f.name || f.fid
            }
        })
    }, [fields])
    const geom = schema.geomType ? schema.geomType[0] : null;
    const xField = schema.position ? schema.position[0] : null;
    const yField = schema.position ? schema.position[1] : null;
    const rowField = schema.facets ? schema.facets[0] : null;
    const colField = schema.facets ? schema.facets[1] : null;
    const colorField = schema.color ? schema.color[0] : null;
    const opacityField = schema.opacity ? schema.opacity[0] : null;
    const sizeField = schema.size ? schema.size[0] : null;
    const formItems: Array<{label: string; key: keyof ISpec; val: string | null; pos: number}> = [
        {
            label: 'Mark',
            key: 'geomType',
            pos: 0,
            val: geom
        },
        {
            label: 'X-Axis',
            key: 'position',
            pos: 0,
            val: xField
        },
        {
            label: 'Y-Axis',
            key: 'position',
            pos: 1,
            val: yField
        },
        {
            label: 'Rows',
            key: 'facets',
            pos: 0,
            val: rowField
        },
        {
            label: 'Columns',
            key: 'facets',
            pos: 1,
            val: colField
        },
        {
            label: 'Color',
            key: 'color',
            pos: 0,
            val: colorField
        },
        {
            label: 'Opacity',
            key: 'opacity',
            pos: 0,
            val: opacityField
        },
        {
            label: 'Size',
            key: 'size',
            pos: 0,
            val: sizeField
        }
    ]
    return <div style={{ backgroundColor: 'f2eecb' }}>
        <Stack>
            {
                formItems.map(f => <Stack.Item key={`${f.key}-${f.pos}`}>
                    <Stack horizontal verticalAlign='end'>
                        <Dropdown style={{ width: '120px' }} label={f.label}
                            options={f.key === 'geomType' ? markOptions : fieldOptions}
                            selectedKey={f.val}
                            onChange={(e, op) => {
                                op && onSchemaChange && onSchemaChange(f.key, f.pos, op.key as string)
                            }}
                        />
                        <IconButton iconProps={{ iconName: 'Delete'}} onClick={() => {
                            onSchemaChange(f.key, f.pos, null)
                        }} />
                    </Stack>
                </Stack.Item>)
            }
        </Stack>
        {/* <Dropdown label='mark' options={markOptions} selectedKey={geom}
            onChange={(e, op) => {
                op && onSchemaChange && onSchemaChange('geomType', 0, op.key as string)
            }}
        />
        <Dropdown label='X-Axis' options={fieldOptions} selectedKey={xField}
            onChange={(e, op) => {
                op && onSchemaChange && onSchemaChange('position', 0, op.key as string)
            }}
        />
        <Dropdown label='Y-Axis' options={fieldOptions} selectedKey={yField}
            onChange={(e, op) => {
                op && onSchemaChange && onSchemaChange('position', 1, op.key as string)
            }}
        />
        <Dropdown label='Rows' options={fieldOptions} selectedKey={rowField}
            onChange={(e, op) => {
                op && onSchemaChange && onSchemaChange('facets', 0, op.key as string)
            }}
        />
        <Dropdown label='Columns' options={fieldOptions} selectedKey={colField}
            onChange={(e, op) => {
                op && onSchemaChange && onSchemaChange('facets', 1, op.key as string)
            }}
        />
        <Dropdown label='Color' options={fieldOptions} selectedKey={colorField}
            onChange={(e, op) => {
                op && onSchemaChange && onSchemaChange('color', 0, op.key as string)
            }}
        />
        <Dropdown label='Opacity' options={fieldOptions} selectedKey={opacityField}
            onChange={(e, op) => {
                op && onSchemaChange && onSchemaChange('opacity', 0, op.key as string)
            }}
        />
        <Dropdown label='Size' options={fieldOptions} selectedKey={sizeField}
            onChange={(e, op) => {
                op && onSchemaChange && onSchemaChange('size', 0, op.key as string)
            }}
        /> */}
    </div>
}

export default VizSpec;
