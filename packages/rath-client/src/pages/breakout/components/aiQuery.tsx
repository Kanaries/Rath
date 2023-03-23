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

const safeFilters = (filters: IFilter[]): IFilter[] => {
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
            } else if (Array.isArray((f as unknown as IFilter & { type: 'set' }).values)) {
                const values = (f as unknown as IFilter & { type: 'set' }).values;
                const min = coerceNumber(values[0]);
                const max = coerceNumber(values[1]);
                list.push({
                    type: 'range',
                    fid: f.fid,
                    range: [min, max],
                });
            }
        } else if (f.type === 'set') {
            if (Array.isArray(f.values)) {
                list.push(f);
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
