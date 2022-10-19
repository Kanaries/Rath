import React from 'react';

interface EBProps {

}
class ErrorBoundary extends React.Component<EBProps, {hasError: boolean}> {
    constructor(props: EBProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        // 更新 state 使下一次渲染能够显示降级后的 UI
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        // 你同样可以将错误日志上报给服务器
        console.error(error, errorInfo)
        // logErrorToMyService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // 你可以自定义降级后的 UI 并渲染
            return <div>Error occurs on rendering charts.</div>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
