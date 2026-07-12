import type { ImgHTMLAttributes } from 'react';
import { publicAssetUrl } from 'runtime-env';
import { cn } from '../../../utils/cn';

export interface DatabaseBrandIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    icon?: string | null;
    label: string;
}

export function DatabaseBrandIcon({ icon, label, className, alt, ...props }: DatabaseBrandIconProps) {
    if (!icon) {
        return null;
    }

    return (
        <img
            role={alt ? undefined : 'presentation'}
            aria-hidden={alt ? undefined : true}
            src={publicAssetUrl(`assets/icons/${icon}`)}
            alt={alt ?? label}
            className={cn('size-full object-contain', className)}
            {...props}
        />
    );
}
