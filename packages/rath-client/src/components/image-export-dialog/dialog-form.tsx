import { Dispatch, FC, RefObject, SetStateAction, useEffect, useState } from 'react';
import { Checkbox, ColorPicker, Dropdown, HoverCard, HoverCardType, Icon, IconButton, Label, Stack, TextField, TooltipHost } from '@fluentui/react';
import produce from 'immer';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import type { View } from 'vega';
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
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 1;
            background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJUlEQVQYV2N89erVfwY0ICYmxoguxjgUFKI7GsTH5m4M3w1ChQC1/Ca8i2n1WgAAAABJRU5ErkJggg==");
        }
        ::after {
            display: block;
            content: "";
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

type QuickResizeKeyword = (typeof QuickResizeKeywords)[number];

const MIN_SIZE = 64;
const MAX_SIZE = 4096;
const MIN_DPI = 72;
const MAX_DPI = 600;

export const EXPORT_IMAGE_MIN_SIZE = MIN_SIZE;
export const EXPORT_IMAGE_MAX_SIZE = MAX_SIZE;

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
                    return setOptions(opt => produce(opt, draft => {
                        draft.width = width;
                        draft.height = height;
                    }));
                }
                case '1.5x': {
                    return setOptions(opt => produce(opt, draft => {
                        draft.width = Math.floor(width * 1.5);
                        draft.height = Math.floor(height * 1.5);
                    }));
                }
                case '2x': {
                    return setOptions(opt => produce(opt, draft => {
                        draft.width = width * 2;
                        draft.height = height * 2;
                    }));
                }
                case '512w': {
                    return setOptions(opt => produce(opt, draft => {
                        draft.width = 512;
                        draft.height = Math.floor(512 / width * height);
                    }));
                }
                case '512h': {
                    return setOptions(opt => produce(opt, draft => {
                        draft.width = Math.floor(512 / height * width);
                        draft.height = 512;
                    }));
                }
                default: {
                    break;
                }
            }
        }
    }, [vegaView, quickResizeKeyword, lockAspect, setOptions]);

    const inputWidthInvalid = options.width < MIN_SIZE || options.width > MAX_SIZE || Math.floor(options.width) !== options.width;
    const inputHeightInvalid = options.height < MIN_SIZE || options.height > MAX_SIZE || Math.floor(options.height) !== options.height;

    const fileNameWithoutExt = options.fileName.split('.').slice(0, -1).join('.');

    const dpiInput = (
        <TextField
            value={inputDPI}
            suffix="dpi"
            disabled={!('dpi' in options)}
            onChange={(_, input) => {
                setInputDPI(input ?? '');
            }}
            onKeyDown={ev => {
                if (ev.key === 'Enter') {
                    (ev.target as Partial<HTMLElement>).blur?.();
                }
                ev.stopPropagation();
            }}
            onBlur={() => {
                const val = Math.max(MIN_DPI, Math.min(MAX_DPI, Math.floor(Number(inputDPI))));
                setOptions(opt => produce(opt, draft => {
                    if ('dpi' in draft) {
                        draft.dpi = val;
                    }
                }));
            }}
            onClick={e => e.stopPropagation()}
            styles={{ fieldGroup: { border: 'none' }, root: { margin: '-1px 0', width: '8em' } }}
        />
    );

    return (
        <Form>
            <Label>
                {intl.get('megaAuto.commandBar.export_as')}
            </Label>
            <Stack horizontal>
                <Dropdown
                    options={Formats.map(key => ({ key, text: key }))}
                    selectedKey={options.type}
                    onChange={(_, option) => {
                        const type = Formats.find(which => which === option?.key);
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
                    styles={{ root: { flexGrow: 0, flexShrink: 0, width: '5em' } }}
                />
                <TextField
                    value={options.fileName}
                    onChange={(_, val) => {
                        if (val !== undefined) {
                            setOptions(opt => produce(opt, draft => {
                                draft.fileName = val;
                            }));
                        }
                    }}
                    styles={{ root: { flexGrow: 1, flexShrink: 0, flexBasis: 'max-content', minWidth: '18em' } }}
                />
            </Stack>
            <Label>
                {intl.get('megaAuto.commandBar.export_size')}
            </Label>
            <Stack tokens={{ childrenGap: 16 }}>
                <Stack horizontal tokens={{ childrenGap: 24 }}>
                    {QuickResizeKeywords.map(key => (
                        <Checkbox
                            key={key}
                            label={key}
                            checked={lockAspect && quickResizeKeyword === key}
                            onChange={(_, checked) => {
                                if (checked) {
                                    setLockAspect(true);
                                    setQuickResizeKeyword(key);
                                }
                            }}
                            styles={{ label: { alignItems: 'center' }, checkbox: { width: '0.8rem', height: '0.8rem' }, checkmark: { display: 'inline-block', fontSize: '0.6rem', lineHeight: '0.8rem', width: '0.8rem', height: '0.8rem' }, text: { fontSize: '0.9rem', marginLeft: 0, lineHeight: '1em' } }}
                        />
                    ))}
                </Stack>
                <Stack horizontal>
                    <TooltipHost content={intl.get('megaAuto.commandBar.lock_aspect')} styles={{ root: { width: '24px', height: '30px', display: 'flex', alignItems: 'center', marginInline: '0.1em' } }}>
                        <Icon
                            iconName={lockAspect ? 'Lock' : 'Unlock'}
                            aria-label={intl.get('megaAuto.commandBar.lock_aspect')}
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={lockAspect}
                            onClick={() => setLockAspect(!lockAspect)}
                            style={{ userSelect: 'none', cursor: 'pointer' }}
                        />
                    </TooltipHost>
                    <TextField
                        value={inputWidth}
                        suffix="w"
                        onChange={(_, input) => {
                            setInputWidth(input ?? '');
                        }}
                        onKeyDown={ev => {
                            if (ev.key === 'Enter') {
                                (ev.target as Partial<HTMLElement>).blur?.();
                            }
                        }}
                        onBlur={() => {
                            const width = Math.floor(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(inputWidth))));
                            setInputWidth(`${width}`);
                            setQuickResizeKeyword(null);
                            setOptions(opt => produce(opt, draft => {
                                if (lockAspect) {
                                    draft.height = Math.floor(draft.height / draft.width * width);
                                }
                                draft.width = width;
                            }));
                        }}
                        errorMessage={inputWidthInvalid ? intl.get('megaAuto.commandBar.err_msg_invalid_size', { min: MIN_SIZE, max: MAX_SIZE }) : undefined}
                        styles={{ root: { width: '10em' } }}
                    />
                    <TextField
                        value={inputHeight}
                        suffix="h"
                        onChange={(_, input) => {
                            setInputHeight(input ?? '');
                        }}
                        onKeyDown={ev => {
                            if (ev.key === 'Enter') {
                                (ev.target as Partial<HTMLElement>).blur?.();
                            }
                        }}
                        onBlur={() => {
                            const height = Math.floor(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(inputHeight))));
                            setInputHeight(`${height}`);
                            setQuickResizeKeyword(null);
                            setOptions(opt => produce(opt, draft => {
                                if (lockAspect) {
                                    draft.width = Math.floor(draft.width / draft.height * height);
                                }
                                draft.height = height;
                            }));
                        }}
                        errorMessage={inputHeightInvalid ? intl.get('megaAuto.commandBar.err_msg_invalid_size', { min: MIN_SIZE, max: MAX_SIZE }) : undefined}
                        styles={{ root: { width: '10em' } }}
                    />
                </Stack>
            </Stack>
            <Label>DPI</Label>
            <Stack horizontal>
                <Dropdown
                    options={[72, 150, 200, 300].map(val => ({ key: val, text: `${val}` }))}
                    selectedKey={dpi}
                    disabled={!('dpi' in options)}
                    onChange={(_, opt) => {
                        const val = opt?.key;
                        if (typeof val === 'number' && val >= MIN_DPI && val <= MAX_DPI) {
                            const next = Math.floor(val);
                            setInputDPI(`${next}`);
                            setOptions(opt => produce(opt, draft => {
                                if ('dpi' in draft) {
                                    draft.dpi = next;
                                }
                            }));
                        } else {
                            setInputDPI(`${dpi}`);
                        }
                    }}
                    onRenderPlaceholder={() => dpiInput}
                    onRenderTitle={() => dpiInput}
                    styles={{ title: { paddingLeft: 0 } }}
                />
            </Stack>
            <Label>Background</Label>
            <Stack horizontal>
                <BackgroundField>
                    <HoverCard
                        type={HoverCardType.plain}
                        cardOpenDelay={0}
                        plainCardProps={{
                            onRenderPlainCard() {
                                return (
                                    <ColorPicker
                                        color={options.background ?? '#ff0000'}
                                        onChange={(_, color) => setOptions(opt => produce(opt, draft => {
                                            draft.background = color.str;
                                        }))}
                                        showPreview
                                        alphaType={options.type === 'JPEG' ? 'none' : 'alpha'}
                                    />
                                );
                            }
                        }}
                    >
                        {/* @ts-expect-error */}
                        <div className="preview" style={{ '--color': options.background ?? undefined }}/>
                    </HoverCard>
                    <output>{options.background}</output>
                    {options.background && options.type !== 'JPEG' && (
                        <IconButton
                            iconProps={{
                                iconName: 'ChromeClose',
                                style: {
                                    color: 'red',
                                    transform: 'scale(0.7)',
                                },
                            }}
                            onClick={() => setOptions(opt => produce(opt, draft => {
                                draft.background = null;
                            }))}
                        />
                    )}
                </BackgroundField>
            </Stack>
        </Form>
    );
};


export default ImageExportDialogForm;
