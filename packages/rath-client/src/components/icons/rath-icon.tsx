import { CircleHelp, type LucideProps } from 'lucide-react';
import { runtimeEnv } from 'runtime-env';
import { legacyIconMap, type LegacyIconName, isLegacyIconName } from './legacy-map';

export interface RathIconProps extends Omit<LucideProps, 'ref'> {
    name: LegacyIconName | (string & {});
    title?: string;
}

export function RathIcon({ name, title, size = 16, strokeWidth = 1.75, fill, ...props }: RathIconProps) {
    const Icon = isLegacyIconName(name) ? legacyIconMap[name] : CircleHelp;
    const stateFill = name === 'FavoriteStarFill' || name === 'PinSolid12' ? 'currentColor' : undefined;

    if (!runtimeEnv.isProduction && !isLegacyIconName(name)) {
        console.warn(`[RathIcon] Unmapped legacy icon: ${name}`);
    }

    return (
        <Icon
            aria-hidden={title ? undefined : true}
            aria-label={title}
            role={title ? 'img' : undefined}
            size={size}
            strokeWidth={strokeWidth}
            fill={fill ?? stateFill ?? 'none'}
            {...props}
        />
    );
}
