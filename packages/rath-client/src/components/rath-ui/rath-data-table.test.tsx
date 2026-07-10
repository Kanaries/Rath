import { renderToStaticMarkup } from 'react-dom/server';
import { RathDataTable, type RathColumn } from './rath-data-table';

interface Item {
    id: string;
    name: string;
    description: string;
}

const items: Item[] = [{ id: '1', name: 'Rath', description: 'Analytics' }];
const columns: RathColumn<Item>[] = [
    { key: 'name', name: 'Name', fieldName: 'name', isSortable: true, isResizable: true },
    { key: 'description', name: 'Description', fieldName: 'description' },
];

describe('RathDataTable', () => {
    it('only makes explicitly sortable headers interactive and exposes resizers', () => {
        const view = renderToStaticMarkup(<RathDataTable items={items} columns={columns} onColumnHeaderClick={() => undefined} />);

        expect(view.match(/<button/g)).toHaveLength(2);
        expect(view).toContain('Resize Name column');
        expect(view).not.toContain('Resize Description column');
    });

    it('makes selectable rows keyboard reachable', () => {
        const view = renderToStaticMarkup(
            <RathDataTable
                items={items}
                columns={columns}
                selection={{ mode: 'single', selectedKeys: [], onChange: () => undefined, getKey: (item) => item.id }}
            />
        );

        expect(view).toMatch(/<tr[^>]+tabindex="0"/);
        expect(view).toContain('aria-label="Select row"');
    });

    it('keeps headers and cells on one line by default', () => {
        const view = renderToStaticMarkup(<RathDataTable items={items} columns={columns} />);

        expect(view).toContain('overflow-hidden whitespace-nowrap');
        expect(view).toContain('truncate whitespace-nowrap');
        expect(view).toContain('title="Rath"');
    });

    it('enables windowed rendering for constrained large datasets', () => {
        const manyItems = Array.from({ length: 101 }, (_, index) => ({
            id: String(index),
            name: `Item ${index}`,
            description: 'Analytics',
        }));
        const view = renderToStaticMarkup(
            <RathDataTable items={manyItems} columns={columns} maxHeight={200} virtualizationThreshold={40} />
        );

        expect(view).toContain('data-virtualized="true"');
        expect(view).toContain('max-height:200px');
    });
});
