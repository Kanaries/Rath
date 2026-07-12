import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

type MonacoWorkerEnvironment = typeof globalThis & {
    MonacoEnvironment?: {
        getWorker(workerId: string, label: string): Worker;
    };
};

const workerEnvironment = globalThis as MonacoWorkerEnvironment;

workerEnvironment.MonacoEnvironment = {
    getWorker(_workerId, label) {
        return label === 'json' ? new JsonWorker() : new EditorWorker();
    },
};
