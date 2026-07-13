import MonacoEditor from 'react-monaco-editor';
import { useAppearance } from '../appearance';

type MonacoEditorProps = React.ComponentProps<typeof MonacoEditor>;

export default function ThemedMonacoEditor({ theme, ...props }: MonacoEditorProps) {
    const { resolvedAppearance } = useAppearance();
    const followsAppearance = theme === undefined || theme === 'vs' || theme === 'vs-dark';
    return <MonacoEditor {...props} theme={followsAppearance ? (resolvedAppearance === 'dark' ? 'vs-dark' : 'vs') : theme} />;
}
