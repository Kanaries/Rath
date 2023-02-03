import { Component, PropsWithChildren } from 'react';


class VisErrorBoundary extends Component<PropsWithChildren, { hasError: boolean }> {

    constructor(props: PropsWithChildren) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: unknown, errorInfo: unknown) {
        console.error(error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return <></>;
        }
        return this.props.children;
    }
}

export default VisErrorBoundary;
