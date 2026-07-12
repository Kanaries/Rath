import { createRoot } from 'react-dom/client';
import ErrorStack from './stack';
import { IErrorInfo, getErrorStore } from './store';

const containerRef: { ref: HTMLDivElement | null } = {
    ref: null
}

export function notify (message: IErrorInfo) {
    console.warn(message)
    if (containerRef.ref === null) {
        const container = document.createElement('div');
        document.getElementsByTagName('body')[0].appendChild(container)
        createRoot(container).render(<ErrorStack />);
        containerRef.ref = container;

    }
    const errorStore = getErrorStore();
    errorStore.append(message)
}
