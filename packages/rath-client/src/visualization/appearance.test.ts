import { getVegaAppearanceConfig, mergeVegaAppearanceConfig } from './appearance';

describe('Vega appearance config', () => {
    it('uses readable neutral colors for each appearance', () => {
        expect((getVegaAppearanceConfig('light') as any).axis.labelColor).toBe('#666462');
        expect((getVegaAppearanceConfig('dark') as any).axis.labelColor).toBe('#b8b8b8');
        expect((getVegaAppearanceConfig('dark') as any).background).toBe('transparent');
    });

    it('preserves chart styling while applying appearance chrome', () => {
        const merged = mergeVegaAppearanceConfig(
            {
                axis: { labelFontSize: 14, labelColor: 'black' },
                bar: { fill: '#3371d7' },
            },
            'dark'
        ) as any;

        expect(merged.axis.labelFontSize).toBe(14);
        expect(merged.axis.labelColor).toBe('#b8b8b8');
        expect(merged.bar.fill).toBe('#3371d7');
    });
});
