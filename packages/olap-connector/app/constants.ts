import path from 'path';

export const GLOBAL_VARS = {
    jwtTokenKeyName: 'ktoken',
    minEmailWaitTime: 1000 * 60
}

export const LOG_DIR = path.resolve(__dirname, '../logs')