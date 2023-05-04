declare global {

    namespace NodeJS {
    
        interface ProcessEnv {
            REACT_APP_VERCEL_ENV: 'preview' | 'production';
            SERVER_ORIGIN?: string;
            HOME_ORIGIN?: string;
        }
    
    }

    type ApiResult<T> = (
        | {
            success: true;
            data: T;
        }
        | {
            success: false;
            message: string;
            error?: {
                code: `ERR_${Uppercase<string>}`;
                options?: Record<string, string>;
            };
        }
    );

}

// mark this file as an external module
export {};
