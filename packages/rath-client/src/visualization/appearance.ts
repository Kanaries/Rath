import type { ResolvedAppearance } from '../appearance';
import type { VegaGlobalConfig } from '../queries/themes/config';

const PALETTES = {
    light: {
        foreground: '#323130',
        mutedForeground: '#666462',
        border: '#dedbd8',
        grid: '#ece9e6',
    },
    dark: {
        foreground: '#e0e0e0',
        mutedForeground: '#b8b8b8',
        border: '#525252',
        grid: '#303030',
    },
} as const;

export function getVegaAppearanceConfig(resolvedAppearance: ResolvedAppearance): VegaGlobalConfig {
    const colors = PALETTES[resolvedAppearance];
    const axis = {
        domainColor: colors.border,
        gridColor: colors.grid,
        labelColor: colors.mutedForeground,
        tickColor: colors.border,
        titleColor: colors.foreground,
    };

    return {
        background: 'transparent',
        axis,
        header: {
            labelColor: colors.mutedForeground,
            titleColor: colors.foreground,
        },
        legend: {
            labelColor: colors.mutedForeground,
            titleColor: colors.foreground,
        },
        title: {
            color: colors.foreground,
            subtitleColor: colors.mutedForeground,
        },
        view: {
            stroke: colors.border,
        },
        style: {
            'guide-label': { fill: colors.mutedForeground },
            'guide-title': { fill: colors.foreground },
        },
    } as VegaGlobalConfig;
}

function mergeRecord(base: unknown, appearance: unknown): Record<string, unknown> {
    return { ...((base ?? {}) as Record<string, unknown>), ...((appearance ?? {}) as Record<string, unknown>) };
}

/** Keep visualization palettes/fonts while making neutral chart chrome follow the app appearance. */
export function mergeVegaAppearanceConfig(
    config: VegaGlobalConfig | undefined,
    resolvedAppearance: ResolvedAppearance
): VegaGlobalConfig {
    const appearance = getVegaAppearanceConfig(resolvedAppearance) as Record<string, unknown>;
    const current = (config ?? {}) as Record<string, unknown>;
    const mergedStyle = { ...((current.style ?? {}) as Record<string, unknown>) };
    for (const [key, value] of Object.entries((appearance.style ?? {}) as Record<string, unknown>)) {
        mergedStyle[key] = mergeRecord(mergedStyle[key], value);
    }

    return {
        ...current,
        ...appearance,
        axis: mergeRecord(current.axis, appearance.axis),
        axisX: mergeRecord(current.axisX, appearance.axis),
        axisY: mergeRecord(current.axisY, appearance.axis),
        header: mergeRecord(current.header, appearance.header),
        legend: mergeRecord(current.legend, appearance.legend),
        title: mergeRecord(current.title, appearance.title),
        view: mergeRecord(current.view, appearance.view),
        style: mergedStyle,
    } as VegaGlobalConfig;
}
