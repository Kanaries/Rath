import { renderToStaticMarkup } from 'react-dom/server';
import { RathIcon } from './rath-icon';

describe('RathIcon', () => {
    it('fills stateful legacy icons with the current color', () => {
        const view = renderToStaticMarkup(<RathIcon name="FavoriteStarFill" title="Collected" />);

        expect(view).toContain('fill="currentColor"');
        expect(view).toContain('aria-label="Collected"');
    });

    it('keeps outline icons unfilled', () => {
        const view = renderToStaticMarkup(<RathIcon name="FavoriteStar" />);
        const utils = renderToStaticMarkup(<RathIcon name="Pinned" />);

        expect(view).not.toContain('fill="currentColor"');
        expect(view).toContain('fill="none"');
        expect(utils).toContain('fill="none"');
    });

    it('maps the legacy blocked state to the circle-minus status icon', () => {
        const view = renderToStaticMarkup(<RathIcon name="Blocked2" />);

        expect(view).toContain('lucide-circle-minus');
    });
});
