import { renderToStaticMarkup } from 'react-dom/server';
import { Alert, AlertDescription } from './alert';

describe('Alert', () => {
    it('renders compact semantic message variants', () => {
        const view = renderToStaticMarkup(
            <Alert variant="info" role="status">
                <AlertDescription>Dataset summary</AlertDescription>
            </Alert>
        );
        const utils = renderToStaticMarkup(<Alert variant="blocked">Analysis is blocked</Alert>);

        expect(view).toContain('role="status"');
        expect(view).toContain('bg-message-info');
        expect(view).toContain('rounded-none');
        expect(utils).toContain('role="alert"');
        expect(utils).toContain('bg-message-blocked');
    });
});
