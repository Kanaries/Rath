import { renderToStaticMarkup } from 'react-dom/server';
import { Slider } from './slider';

describe('Slider', () => {
    it('renders one thumb for a scalar value', () => {
        const markup = renderToStaticMarkup(<Slider value={[0.5]} thumbLabels={['value']} />);

        expect(markup.match(/role="slider"/g)).toHaveLength(1);
        expect(markup).toContain('aria-label="value"');
    });

    it('renders one accessible thumb for each range endpoint', () => {
        const markup = renderToStaticMarkup(<Slider value={[0.1, 0.9]} thumbLabels={['minimum', 'maximum']} />);

        expect(markup.match(/role="slider"/g)).toHaveLength(2);
        expect(markup).toContain('aria-label="minimum"');
        expect(markup).toContain('aria-label="maximum"');
    });
});
