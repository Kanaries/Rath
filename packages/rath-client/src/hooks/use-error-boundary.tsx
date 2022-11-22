import { FC, PureComponent, useCallback, useRef } from "react";


interface ErrorBoundaryProps<D extends any[]> {
    fallback: (error: Error | undefined, info: string) => JSX.Element;
    /** retry when any dependency changes */
    deps: Readonly<D>;
    shouldHandlerRetry?: (prevDeps: Readonly<D>, nextDeps: Readonly<D>) => boolean;
}

interface ErrorBoundaryState<D extends any[]> {
    error: Error | undefined;
    deps: Readonly<D>;
    hasError: boolean;
    info: string;
}

class ErrorBoundary<D extends any[] = any[]> extends PureComponent<ErrorBoundaryProps<D>, ErrorBoundaryState<D>> {
    
    constructor(props: ErrorBoundaryProps<D>) {
        super(props);
        this.state = {
            error: undefined,
            hasError: false,
            info: '',
            deps: props.deps,
        };
    }

    static getDerivedStateFromError<D extends any[]>(error: any): Partial<ErrorBoundaryState<D>> {
        return { hasError: true, info: `${error}`, error: error instanceof Error ? error : undefined };
    }

    static getDerivedStateFromProps<D extends any[]>(nextProps: ErrorBoundaryProps<D>, prevState: ErrorBoundaryState<D>): Partial<ErrorBoundaryState<D>> {
        if (nextProps.deps.length !== prevState.deps.length) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(new Error('Length of dependency list changed, retrial is disabled.'));
            }
            return {};
        }

        const decider = nextProps.shouldHandlerRetry ?? ((prevDeps: Readonly<D>, nextDeps: Readonly<D>) => prevDeps.some((dep, i) => dep !== nextDeps[i]));

        const shouldRetry = decider(prevState.deps, nextProps.deps);

        return shouldRetry ? {
            error: undefined,
            hasError: false,
            info: '',
            deps: nextProps.deps,
        } : {
            deps: nextProps.deps,
        };
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback(this.state.error, this.state.info);
        }

        return this.props.children;
    }
}

const useErrorBoundary = <D extends any[]>(
    fallback: ErrorBoundaryProps<D>['fallback'],
    deps: ErrorBoundaryProps<D>['deps'],
    shouldHandlerRetry?: ErrorBoundaryProps<D>['shouldHandlerRetry'],
): FC => {
    const fallbackRef = useRef(fallback);
    fallbackRef.current = fallback;
    const depsRef = useRef(deps);
    depsRef.current = deps;
    const shouldHandlerRetryRef = useRef(shouldHandlerRetry);
    shouldHandlerRetryRef.current = shouldHandlerRetry;
    return useCallback<FC>(function ErrorBoundaryRoot ({ children }) {
        return (
            <ErrorBoundary fallback={fallbackRef.current} deps={depsRef.current} shouldHandlerRetry={shouldHandlerRetryRef.current}>
                {children}
            </ErrorBoundary>
        );
    }, []);
};

export default useErrorBoundary;
