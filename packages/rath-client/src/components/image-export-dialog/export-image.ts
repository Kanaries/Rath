import type { View } from "vega";
import embed, { EmbedOptions } from "vega-embed";


export type ImageExportInfo = {
    fileName: string;
    width: number;
    height: number;
} & (
    | {
        type: 'PNG';
        dpi: number;
        /** transparent if empty */
        background: string | null;
    }
    | {
        type: 'JPEG';
        dpi: number;
        background: string;
    }
    | {
        type: 'SVG';
        /** transparent if empty */
        background: string | null;
    }
);

const buildCopy = async (spec: any, vegaOpts: EmbedOptions): Promise<{ view: View; destroy: () => void }> => {
    const root = document.createElement('div');
    const { view } = await embed(root, spec, vegaOpts);
    return {
        view,
        destroy: () => {
            root.remove();
            view.finalize();
        },
    };
};

const dpr = window.devicePixelRatio;
const ratio = dpr;

const exportImage = async (spec: any, vegaOpts: EmbedOptions, options: ImageExportInfo): Promise<boolean> => {
    const dpi = 'dpi' in options ? options.dpi : null;
    const scale = dpi ? dpi / 96 : 1;     // The canvas default resolution is 96dpi
    const copy = await buildCopy({
        ...spec,
        width: options.width,
        height: options.height,
        autosize: {
            type: 'fit',
            contains: 'padding',
        },
        background: options.background || 'transparent',
    }, vegaOpts);
    const ok = await (async () => {
        switch (options.type) {
            case 'SVG': {
                const data = await copy.view.toSVG(1);
                if (data) {
                    const file = new File([data], options.fileName || 'export.svg');
                    const url = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.download = file.name;
                    a.href = url;
                    a.click();
                    requestAnimationFrame(() => {
                        URL.revokeObjectURL(url);
                        a.remove();
                    });
                    return true;
                }
                return false;
            }
            case 'PNG':
            case 'JPEG': {
                copy.view.width(options.width);
                copy.view.height(options.height);
                const canvas = await copy.view.toCanvas(ratio * scale);
                canvas.style.width = `${options.width}px`;
                canvas.style.height = `${options.height}px`;
                const data = canvas.toDataURL(options.type === 'JPEG' ? 'image/jpeg' : 'image/png', 1.0);
                if (data) {
                    const a = document.createElement('a');
                    a.download = options.fileName || `export.${options.type === 'JPEG' ? 'jpg' : 'png'}`;
                    a.href = data.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
                    a.click();
                    requestAnimationFrame(() => {
                        a.remove();
                    });
                    return true;
                }
                canvas.remove();
                return false;
            }
            default: {
                return false;
            }
        }
    })();
    copy.destroy();
    return ok;
};


export default exportImage;
