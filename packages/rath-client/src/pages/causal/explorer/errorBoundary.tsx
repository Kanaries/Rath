import { Component } from "react";


class ErrorBoundary extends Component<{}, { hasError: boolean; info: string }> {
    
    constructor(props: {}) {
        super(props);
        this.state = { hasError: false, info: '' };
    }

    static getDerivedStateFromError(error: any) {
        console.error(error);
        return { hasError: true, info: `${error}` };
    }

    render() {
        if (this.state.hasError) {
            return (
                <p>
                    {this.state.info}
                </p>
            );
        }

        return this.props.children;
    }
}


export default ErrorBoundary;
