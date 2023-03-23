import { useRef, useState } from "react";
import { DefaultButton, Label, SearchBox, Spinner, Stack } from "@fluentui/react";
import styled from "styled-components";
import type { IFilter } from "@kanaries/loa";
import { observer } from "mobx-react-lite";
import { useBreakoutStore } from "../store";
import { coerceNumber } from "../utils/format";


const StackTokens = { childrenGap: 20 };

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    align-items: center;
`;

const SearchBoxContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    margin-right: 10px;
    transition: width 0.2s ease-in-out;
`;

type IFilterLike = {
    type: IFilter['type'];
    fid: IFilter['fid'];
    range?: unknown;
    values?: unknown;
    minValue?: unknown;
    maxValue?: unknown;
};

const safeFilters = (filters: IFilterLike[]): IFilter[] => {
    return filters.reduce<IFilter[]>((list, f) => {
        if (f.type === 'range') {
            if (Array.isArray(f.range)) {
                const min = coerceNumber(f.range[0]);
                const max = coerceNumber(f.range[1]);
                list.push({
                    type: 'range',
                    fid: f.fid,
                    range: [min, max],
                });
            } else if (Array.isArray(f.values)) {
                const values = f.values;
                const min = coerceNumber(values[0]);
                const max = coerceNumber(values[1]);
                list.push({
                    type: 'range',
                    fid: f.fid,
                    range: [min, max],
                });
            } else if ('minValue' in f && 'maxValue' in f) {
                const min = coerceNumber(f.minValue);
                const max = coerceNumber(f.maxValue);
                list.push({
                    type: 'range',
                    fid: f.fid,
                    range: [min, max],
                });
            }
        } else if (f.type === 'set') {
            if (Array.isArray(f.values)) {
                list.push({
                    type: 'set',
                    fid: f.fid,
                    values: f.values,
                });
            }
        }
        return list;
    }, []);
};

const AIQuery = observer(function AIQuery() {
    const context = useBreakoutStore();

    const [busy, setBusy] = useState(false);
    const taskIdRef = useRef(0);
    const [query, setQuery] = useState("");

    const onSearch = () => {
        taskIdRef.current += 1;
        const taskId = taskIdRef.current;
        setBusy(true);
        context.searchAI(query).then(res => {
            if (res && taskIdRef.current === taskId) {
                context.setMainField(res.defaultMainField ?? null);
                context.setMainFieldFilters(safeFilters(res.defaultMainFieldFilters ?? []));
                context.setComparisonFilters(safeFilters(res.defaultComparisonFilters ?? []));
            }
        }).finally(() => {
            if (taskIdRef.current === taskId) {
                setBusy(false);
            }
        });
    };

    return (
        <Stack horizontal tokens={StackTokens}>
            <Label>
                Query
            </Label>
            <Container>
                <SearchBoxContainer>
                    <SearchBox
                        value={query}
                        onChange={(_, newValue) => setQuery(newValue ?? "")}
                    />
                </SearchBoxContainer>
                <DefaultButton onClick={onSearch}>
                    Search
                </DefaultButton>
                {busy && <Spinner />}
            </Container>
        </Stack>
    );
});


export default AIQuery;
