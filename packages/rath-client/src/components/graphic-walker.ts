import { GraphicWalker as GraphicWalkerPackage } from '@kanaries/graphic-walker';
import type { ILocalVizAppProps, IRemoteVizAppProps } from '@kanaries/graphic-walker/dist/root';
import type { ReactElement } from 'react';

// Graphic Walker 0.5.1 is implemented as a React 19 component, but its
// published overload returns ReactNode. TypeScript's JSX component check
// requires an element-like return for this callable overload shape. Keep the
// package props intact while narrowing only the runtime component return.
export const GraphicWalker = GraphicWalkerPackage as unknown as {
    (props: ILocalVizAppProps): ReactElement | null;
    (props: IRemoteVizAppProps): ReactElement | null;
};
