/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_EXPAND_ENV?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
