import { forwardRef, RefObject, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { DefaultButton, Dialog, DialogFooter, PrimaryButton, Spinner, SpinnerSize } from '@fluentui/react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import type { View } from 'vega';
import type { EmbedOptions } from 'vega-embed';
import type { ImageExportInfo } from './export-image';
import ImageExportDialogForm, { EXPORT_IMAGE_MAX_SIZE, EXPORT_IMAGE_MIN_SIZE } from './dialog-form';
import exportImage from './export-image';


const Header = styled.span`
    font-size: 1.05rem;
    text-transform: capitalize;
`;


export interface ImageExportDialogHandler {
    open: () => Promise<ImageExportInfo | null>;
}

export interface ImageExportDialogProps {
    vegaViewRef: RefObject<View | undefined>;
    spec: any;
    vegaOpts: EmbedOptions;
}

const ImageExportDialog = forwardRef<ImageExportDialogHandler, ImageExportDialogProps>(function ImageExportDialog ({ vegaViewRef, spec, vegaOpts }, ref) {
    const { current: vegaView } = vegaViewRef;
    const [open, setOpen] = useState(false);
    const pendingTaskResolverRef = useRef<((value: Awaited<ReturnType<ImageExportDialogHandler['open']>>) => void) | null>(null);
    const [options, setOptions] = useState<ImageExportInfo>({
        fileName: 'export.png',
        type: 'PNG',
        width: 512,
        height: 512,
        background: null,
        dpi: 100,
    });

    useEffect(() => {
        if (!open) {
            pendingTaskResolverRef.current?.(null);
            pendingTaskResolverRef.current = null;
            setBusy(false);
        }
    }, [open]);

    useImperativeHandle(ref, () => ({
        async open() {
            pendingTaskResolverRef.current?.(null);
            return new Promise<ImageExportInfo | null>(resolve => {
                pendingTaskResolverRef.current = resolve;
                setOpen(true);
            });
        },
    }));

    const [busy, setBusy] = useState(false);

    const inputWidthInvalid = options.width < EXPORT_IMAGE_MIN_SIZE || options.width > EXPORT_IMAGE_MAX_SIZE || Math.floor(options.width) !== options.width;
    const inputHeightInvalid = options.height < EXPORT_IMAGE_MIN_SIZE || options.height > EXPORT_IMAGE_MAX_SIZE || Math.floor(options.height) !== options.height;

    return (
        <Dialog
            hidden={!open}
            dialogContentProps={{
                title: <Header>{intl.get('megaAuto.commandBar.download')}</Header>,
            }}
            onDismiss={() => setOpen(false)}
            styles={{ main: { maxWidth: '40vw !important' } }}
        >
            <ImageExportDialogForm
                vegaViewRef={vegaViewRef}
                options={options}
                setOptions={setOptions}
            />
            <DialogFooter>
                <PrimaryButton
                    disabled={busy || !vegaView || inputWidthInvalid || inputHeightInvalid}
                    onClick={() => {
                        if (busy || !vegaView || inputWidthInvalid || inputHeightInvalid) {
                            return;
                        }
                        setBusy(true);
                        exportImage(spec, vegaOpts, options).then(done => {
                            if (done) {
                                setOpen(false);
                            }
                        }).finally(() => {
                            setBusy(false);
                        });
                    }}
                >
                    {busy ? <Spinner size={SpinnerSize.xSmall} /> : <span>{intl.get('megaAuto.commandBar.export')}</span>}
                </PrimaryButton>
                <DefaultButton
                    text={intl.get('common.cancel')}
                    onClick={() => setOpen(false)}
                />
            </DialogFooter>
        </Dialog>
    );
});


export default ImageExportDialog;
