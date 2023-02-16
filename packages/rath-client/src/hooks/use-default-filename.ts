import intl from 'react-intl-universal';
import { useMemo } from "react";
import dayjs from 'dayjs';


const useDefaultFilename = (mode: string): string => {
    return useMemo(() => {
        return intl.get('storage.default_name', {
            date: dayjs().format('YYYY-MM-DD HHmm'),
            mode,
        });
    }, [mode]);
};


export default useDefaultFilename;
