import { GraphicWalker as GraphicWalkerPackage } from '@kanaries/graphic-walker';
import type { ILocalVizAppProps, IRemoteVizAppProps } from '@kanaries/graphic-walker/dist/root';
import type { ReactElement } from 'react';

// Graphic Walker 0.5.2 is React 19 compatible, but its published overloaded
// callable still returns ReactNode. TypeScript 5.9 rejects that overload shape
// as JSX because ReactNode includes undefined. Preserve the package props while
// narrowing only the runtime component return until the declaration is fixed.
export const GraphicWalker = GraphicWalkerPackage as unknown as {
    (props: ILocalVizAppProps): ReactElement | null;
    (props: IRemoteVizAppProps): ReactElement | null;
};
