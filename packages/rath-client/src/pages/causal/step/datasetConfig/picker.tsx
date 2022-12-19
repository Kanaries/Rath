import { Slider } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useRef } from 'react';
import styled from 'styled-components';
import FilterCreationPill from '../../../../components/fieldPill/filterCreationPill';
import { useGlobalStore } from '../../../../store';
import { FilterCell } from '../../filters';
import { getI18n } from '../../locales';


const Container = styled.div`
    margin-block: 0.8em;
    > div {
        margin-block: 1.2em;
        display: grid;
        grid-template-areas:
            "label input input input input"
            "output output output output output"
        ;
        gap: 0.2em;
    }
`;

const Label = styled.div`
    grid-area: label;
`;

const Input = styled.div`
    grid-area: input;
    > span {
        display: block;
        width: max-content;
        height: max-content;
        margin: 0 1vmax;
        padding: 0 1vmax;
    }
`;

const Output = styled.div`
    grid-area: output;
`;

const Picker: FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { cleanedData } = dataSourceStore;
    const {
        fields, allFields, filteredDataSize, sampleRate, sampleSize, filters
    } = causalStore.dataset;

    const totalFieldsRef = useRef(allFields);
    totalFieldsRef.current = allFields;

    const fieldsRef = useRef(fields);
    fieldsRef.current = fields;
    
    return (
        <Container>
            <div>
                <Label>
                    {getI18n('dataset_config.filter')}
                </Label>
                <Input>
                    <span>
                        <FilterCreationPill
                            fields={allFields}
                            onFilterSubmit={(_, filter) => causalStore.dataset.appendFilter(filter)}
                        />
                    </span>
                </Input>
                <Output>
                    {filters.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                overflow: 'auto hidden',
                                margin: '1em 0',
                            }}
                        >
                            {filters.map((filter, i) => {
                                const field = allFields.find((f) => f.fid === filter.fid);

                                return field ? (
                                    <FilterCell
                                        key={i}
                                        field={field}
                                        data={filter}
                                        remove={() => causalStore.dataset.removeFilter(i)}
                                    />
                                ) : null;
                            })}
                        </div>
                    )}
                    <small style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
                        {getI18n(`dataset_config.${filters.length ? 'filter_output' : 'filter_disabled_output'}`, {
                            origin: cleanedData.length,
                            filtered: filteredDataSize,
                        })}
                    </small>
                </Output>
            </div>
            <div>
                <Label>
                    {getI18n('dataset_config.sample')}
                </Label>
                <Input>
                    <Slider
                        min={0.01}
                        max={1}
                        step={0.01}
                        value={sampleRate}
                        showValue
                        onChange={(val) => causalStore.dataset.sampleRate = val}
                        valueFormat={(val) => `${(val * 100).toFixed(0)}%`}
                        styles={{
                            root: {
                                flexGrow: 0,
                                flexShrink: 0,
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                            },
                            container: {
                                minWidth: '160px',
                                maxWidth: '300px',
                                flexGrow: 1,
                                flexShrink: 0,
                                marginInline: '1vmax',
                            },
                        }}
                    />
                </Input>
                <Output>
                    <small style={{ padding: '0.2em 0', color: '#666', display: 'flex', alignItems: 'center' }}>
                        {getI18n('dataset_config.sample_output', { size: sampleSize })}
                    </small>
                </Output>
            </div>
        </Container>
    );
};


export default observer(Picker);
