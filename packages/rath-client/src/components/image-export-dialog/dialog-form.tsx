import { CSSProperties, Dispatch, FC, RefObject, SetStateAction, useEffect, useState } from 'react';
import produce from 'immer';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import type { View } from 'vega';
import { RathIcon } from '../icons';
import { RathSelect } from '../rath-ui/rath-select';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type { ImageExportInfo } from './export-image';

const Form = styled.div`
    margin: 1.2rem 0 2rem;
    width: 100%;
    display: grid;
    grid-template-columns: max-content auto;
    overflow: hidden;
    row-gap: 1.5rem;
    column-gap: 1rem;
`;

const BackgroundField = styled.div`
    width: 100%;
    display: flex;
    --height: 32px;
    .preview {
        flex-grow: 0;
        flex-shrink: 0;
        width: var(--height);
        height: var(--height);
        border: 1px solid #8888;
        box-sizing: border-box;
        position: relative;
        cursor: pointer;
        ::before {
            display: block;
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 1;
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJUlEQVQYV2N89erVfwY0ICYmxoguxjgUFKI7GsTH5m4M3w1ChQC1/Ca8i2n1WgAAAABJRU5ErkJggg==');
        }
        ::after {
            display: block;
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 2;
            background: var(--color);
        }
    }
    output {
        line-height: var(--height);
        margin: 0 1em;
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

export interface ImageExportDialogFormProps {
    vegaViewRef: RefObject<View | undefined>;
    options: ImageExportInfo;
    setOptions: Dispatch<SetStateAction<ImageExportInfo>>;
}

const Formats: readonly ImageExportInfo['type'][] = ['PNG', 'JPEG', 'SVG'];

const QuickResizeKeywords = ['1x', '1.5x', '2x', '512w', '512h'] as const;

type QuickResizeKeyword = typeof QuickResizeKeywords[number];

const MIN_SIZE = 64;
const MAX_SIZE = 4096;
const MIN_DPI = 72;
const MAX_DPI = 600;

export const EXPORT_IMAGE_MIN_SIZE = MIN_SIZE;
export const EXPORT_IMAGE_MAX_SIZE = MAX_SIZE;

const parseBackgroundColor = (value: string | null | undefined): { hex: string; alpha: number } => {
    if (!value) {
        return { hex: '#ff0000', alpha: 1 };
    }
    const hexMatch = value.match(/^#([0-9a-f]{6})$/i);
    if (hexMatch) {
        return { hex: value, alpha: 1 };
    }
    const rgbaMatch = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);
    if (!rgbaMatch) {
        return { hex: '#ff0000', alpha: 1 };
    }
    const [, r, g, b, a] = rgbaMatch;
    const hex = [r, g, b]
        .map((channel) => Math.max(0, Math.min(255, Number(channel))).toString(16).padStart(2, '0'))
        .join('');
    return { hex: `#${hex}`, alpha: Math.max(0, Math.min(1, Number(a ?? 1))) };
};

const buildBackgroundColor = (hex: string, alpha: number, type: ImageExportInfo['type']): string => {
    if (type === 'JPEG' || alpha >= 1) {
        return hex;
    }
    const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) => parseInt(channel, 16));
    return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(2))})`;
};

const ImageExportDialogForm: FC<ImageExportDialogFormProps> = ({ vegaViewRef, options, setOptions }) => {
    const { current: vegaView } = vegaViewRef;

    const [inputWidth, setInputWidth] = useState(`${options.width}`);
    const [inputHeight, setInputHeight] = useState(`${options.height}`);
    const dpi = 'dpi' in options ? options.dpi : null;
    const [inputDPI, setInputDPI] = useState(`${dpi ?? 150}`);

    useEffect(() => {
        setInputWidth(`${options.width}`);
    }, [options.width]);

    useEffect(() => {
        setInputHeight(`${options.height}`);
    }, [options.height]);

    useEffect(() => {
        if (dpi) {
            setInputDPI(`${dpi}`);
        }
    }, [dpi]);

    const [lockAspect, setLockAspect] = useState(true);

    const [quickResizeKeyword, setQuickResizeKeyword] = useState<QuickResizeKeyword | null>('512w');

    useEffect(() => {
        if (!vegaView || !quickResizeKeyword || !lockAspect) {
            return;
        }
        const width = vegaView.width();
        const height = vegaView.height();
        if (typeof width === 'number' && typeof height === 'number') {
            switch (quickResizeKeyword) {
                case '1x': {
                    return setOptions((opt) =>
                        produce(opt, (draft) => {
                            draft.width = width;
                            draft.height = height;
                        })
                    );
                }
                case '1.5x': {
                    return setOptions((opt) =>
                        produce(opt, (draft) => {
                            draft.width = Math.floor(width * 1.5);
                            draft.height = Math.floor(height * 1.5);
                        })
                    );
                }
                case '2x': {
                    return setOptions((opt) =>
                        produce(opt, (draft) => {
                            draft.width = width * 2;
                            draft.height = height * 2;
                        })
                    );
                }
                case '512w': {
                    return setOptions((opt) =>
                        produce(opt, (draft) => {
                            draft.width = 512;
                            draft.height = Math.floor((512 / width) * height);
                        })
                    );
                }
                case '512h': {
                    return setOptions((opt) =>
                        produce(opt, (draft) => {
                            draft.width = Math.floor((512 / height) * width);
                            draft.height = 512;
                        })
                    );
                }
                default: {
                    break;
                }
            }
        }
    }, [vegaView, quickResizeKeyword, lockAspect, setOptions]);

    const inputWidthInvalid = options.width < MIN_SIZE || options.width > MAX_SIZE || Math.floor(options.width) !== options.width;
    const inputHeightInvalid = options.height < MIN_SIZE || options.height > MAX_SIZE || Math.floor(options.height) !== options.height;
    const backgroundColor = parseBackgroundColor(options.background);

    const fileNameWithoutExt = options.fileName.split('.').slice(0, -1).join('.');

    const dpiInput = (
        <div className="flex w-[8em] items-center gap-1">
            <Input
                className="h-7 border-0 shadow-none focus-visible:ring-0"
                value={inputDPI}
                disabled={!('dpi' in options)}
                onChange={(event) => {
                    setInputDPI(event.target.value);
                }}
                onKeyDown={(ev) => {
                    if (ev.key === 'Enter') {
                        (ev.target as Partial<HTMLElement>).blur?.();
                    }
                    ev.stopPropagation();
                }}
                onBlur={() => {
                    const val = Math.max(MIN_DPI, Math.min(MAX_DPI, Math.floor(Number(inputDPI))));
                    setOptions((opt) =>
                        produce(opt, (draft) => {
                            if ('dpi' in draft) {
                                draft.dpi = val;
                            }
                        })
                    );
                }}
                onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-muted-foreground">dpi</span>
        </div>
    );

    return (
        <Form>
            <Label>{intl.get('megaAuto.commandBar.export_as')}</Label>
            <div className="flex flex-row">
                <RathSelect
                    className="w-[5em] grow-0 shrink-0"
                    options={Formats.map((key) => ({ key, text: key }))}
                    selectedKey={options.type}
                    onChange={(key) => {
                        const type = Formats.find((which) => which === key);
                        switch (type) {
                            case 'PNG': {
                                return setOptions({
                                    fileName: `${fileNameWithoutExt}.png`,
                                    type: 'PNG',
                                    width: options.width,
                                    height: options.height,
                                    background: options.background,
                                    dpi: dpi ?? 150,
                                });
                            }
                            case 'JPEG': {
                                const bgColorHasAlpha = options.background?.startsWith('rgba') ?? false;
                                return setOptions({
                                    fileName: `${fileNameWithoutExt}.jpg`,
                                    type: 'JPEG',
                                    width: options.width,
                                    height: options.height,
                                    background: bgColorHasAlpha ? '#fff' : options.background ?? '#fff',
                                    dpi: dpi ?? 150,
                                });
                            }
                            case 'SVG': {
                                return setOptions({
                                    fileName: `${fileNameWithoutExt}.svg`,
                                    type: 'SVG',
                                    width: options.width,
                                    height: options.height,
                                    background: options.background,
                                });
                            }
                            default: {
                                break;
                            }
                        }
                    }}
                />
                <Input
                    className="min-w-[18em] grow shrink-0 basis-[max-content]"
                    value={options.fileName}
                    onChange={(event) => {
                        setOptions((opt) =>
                            produce(opt, (draft) => {
                                draft.fileName = event.target.value;
                            })
                        );
                    }}
                />
            </div>
            <Label>{intl.get('megaAuto.commandBar.export_size')}</Label>
            <div className="flex flex-col gap-[16px]">
                <div className="flex flex-row gap-[24px]">
                    {QuickResizeKeywords.map((key) => (
                        <label key={key} className="flex items-center gap-1 text-sm leading-none">
                            <Checkbox
                                className="h-[0.8rem] w-[0.8rem]"
                                checked={lockAspect && quickResizeKeyword === key}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setLockAspect(true);
                                        setQuickResizeKeyword(key);
                                    }
                                }}
                            />
                            {key}
                        </label>
                    ))}
                </div>
                <div className="flex flex-row">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label={intl.get('megaAuto.commandBar.lock_aspect')}
                                role="checkbox"
                                tabIndex={0}
                                aria-checked={lockAspect}
                                onClick={() => setLockAspect(!lockAspect)}
                                className="mx-[0.1em] flex h-[30px] w-[24px] items-center justify-center"
                            >
                                <RathIcon name={lockAspect ? 'Lock' : 'Unlock'} style={{ userSelect: 'none', cursor: 'pointer' }} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>{intl.get('megaAuto.commandBar.lock_aspect')}</TooltipContent>
                    </Tooltip>
                    <div className="flex flex-col gap-1">
                        <div className="flex w-[10em] items-center gap-1">
                            <Input
                                value={inputWidth}
                                onChange={(event) => {
                                    setInputWidth(event.target.value);
                                }}
                                onKeyDown={(ev) => {
                                    if (ev.key === 'Enter') {
                                        (ev.target as Partial<HTMLElement>).blur?.();
                                    }
                                }}
                                onBlur={() => {
                                    const width = Math.floor(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(inputWidth))));
                                    setInputWidth(`${width}`);
                                    setQuickResizeKeyword(null);
                                    setOptions((opt) =>
                                        produce(opt, (draft) => {
                                            if (lockAspect) {
                                                draft.height = Math.floor((draft.height / draft.width) * width);
                                            }
                                            draft.width = width;
                                        })
                                    );
                                }}
                                aria-invalid={inputWidthInvalid}
                            />
                            <span className="text-xs text-muted-foreground">w</span>
                        </div>
                        {inputWidthInvalid && (
                            <p className="max-w-[16em] text-xs text-destructive">
                                {intl.get('megaAuto.commandBar.err_msg_invalid_size', { min: MIN_SIZE, max: MAX_SIZE })}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex w-[10em] items-center gap-1">
                            <Input
                                value={inputHeight}
                                onChange={(event) => {
                                    setInputHeight(event.target.value);
                                }}
                                onKeyDown={(ev) => {
                                    if (ev.key === 'Enter') {
                                        (ev.target as Partial<HTMLElement>).blur?.();
                                    }
                                }}
                                onBlur={() => {
                                    const height = Math.floor(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(inputHeight))));
                                    setInputHeight(`${height}`);
                                    setQuickResizeKeyword(null);
                                    setOptions((opt) =>
                                        produce(opt, (draft) => {
                                            if (lockAspect) {
                                                draft.width = Math.floor((draft.width / draft.height) * height);
                                            }
                                            draft.height = height;
                                        })
                                    );
                                }}
                                aria-invalid={inputHeightInvalid}
                            />
                            <span className="text-xs text-muted-foreground">h</span>
                        </div>
                        {inputHeightInvalid && (
                            <p className="max-w-[16em] text-xs text-destructive">
                                {intl.get('megaAuto.commandBar.err_msg_invalid_size', { min: MIN_SIZE, max: MAX_SIZE })}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <Label>DPI</Label>
            <div className="flex flex-row items-center gap-2">
                {dpiInput}
                <RathSelect
                    className="w-[5em]"
                    options={[72, 150, 200, 300].map((val) => ({ key: val, text: `${val}` }))}
                    selectedKey={dpi}
                    disabled={!('dpi' in options)}
                    onChange={(val) => {
                        if (typeof val === 'number' && val >= MIN_DPI && val <= MAX_DPI) {
                            const next = Math.floor(val);
                            setInputDPI(`${next}`);
                            setOptions((opt) =>
                                produce(opt, (draft) => {
                                    if ('dpi' in draft) {
                                        draft.dpi = next;
                                    }
                                })
                            );
                        } else {
                            setInputDPI(`${dpi}`);
                        }
                    }}
                />
            </div>
            <Label>Background</Label>
            <div className="flex flex-row">
                <BackgroundField>
                    <HoverCard openDelay={0}>
                        <HoverCardTrigger asChild>
                            <button
                                type="button"
                                className="preview"
                                style={{ '--color': options.background ?? undefined } as CSSProperties}
                                aria-label="Pick background color"
                            />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 space-y-3">
                            <div className="grid gap-2">
                                <Label>Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        className="h-9 w-12 cursor-pointer p-1"
                                        value={backgroundColor.hex}
                                        onChange={(event) => {
                                            const next = buildBackgroundColor(event.target.value, backgroundColor.alpha, options.type);
                                            setOptions((opt) =>
                                                produce(opt, (draft) => {
                                                    draft.background = next;
                                                })
                                            );
                                        }}
                                    />
                                    <Input
                                        value={options.background ?? ''}
                                        placeholder="transparent"
                                        onChange={(event) => {
                                            setOptions((opt) =>
                                                produce(opt, (draft) => {
                                                    draft.background = event.target.value || (options.type === 'JPEG' ? '#fff' : null);
                                                })
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                            {options.type !== 'JPEG' && (
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Alpha</Label>
                                        <span className="text-xs text-muted-foreground">{Math.round(backgroundColor.alpha * 100)}%</span>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={[backgroundColor.alpha]}
                                        onValueChange={([alpha]) => {
                                            const next = buildBackgroundColor(backgroundColor.hex, alpha, options.type);
                                            setOptions((opt) =>
                                                produce(opt, (draft) => {
                                                    draft.background = next;
                                                })
                                            );
                                        }}
                                    />
                                </div>
                            )}
                        </HoverCardContent>
                    </HoverCard>
                    <output>{options.background}</output>
                    {options.background && options.type !== 'JPEG' && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() =>
                                setOptions((opt) =>
                                    produce(opt, (draft) => {
                                        draft.background = null;
                                    })
                                )
                            }
                        >
                            <RathIcon name="ChromeClose" className="scale-75" />
                        </Button>
                    )}
                </BackgroundField>
            </div>
        </Form>
    );
};

export default ImageExportDialogForm;
