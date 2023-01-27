import { DefaultButton, PrimaryButton, Stack, TextField } from '@fluentui/react';
import { unstable_batchedUpdates } from 'react-dom';
import { FC, useCallback, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { ITextPattern, ITextSelection } from '../../../../lib/textPattern';

export interface IFieldTextSelection extends ITextSelection {
    fid: string;
}
export interface IFieldTextPattern extends ITextPattern {
    fid: string;
}

interface TPRegexEditorProps {
    tp: IFieldTextPattern;
    onSubmit: (tp: IFieldTextPattern) => void;
    onCancel: () => void;
}
const TPRegexEditor: FC<TPRegexEditorProps> = (props) => {
    const { tp, onSubmit, onCancel } = props;
    const [ph, setPh] = useState<string>('');
    const [sl, setSl] = useState<string>('');
    const [pe, setPe] = useState<string>('');

    useEffect(() => {
        unstable_batchedUpdates(() => {
            setPh(tp.ph.source)
            setPe(tp.pe.source)
            setSl(tp.selection.source)
        })
    }, [tp])

    const submit = useCallback(() => {
        const ans: IFieldTextPattern = {
            fid: tp.fid,
            ph: new RegExp(ph),
            pe: new RegExp(pe),
            selection: new RegExp(sl),
            pattern: new RegExp(`${ph}(?<selection>${sl})${pe}`),
            selectionType: tp.selectionType,
            score: tp.score,
        }
        onSubmit(ans);
    }, [tp.fid, tp.selectionType, tp.score, ph, pe, sl, onSubmit])

    return (
        <Stack>
            <TextField
                label="before"
                value={ph}
                onChange={(e, newValue) => {
                    setPh(`${newValue}`);
                }}
            />
            <TextField
                label="selection"
                value={sl}
                onChange={(e, newValue) => {
                    setSl(`${newValue}`);
                }}
            />
            <TextField
                label="after"
                value={pe}
                onChange={(e, newValue) => {
                    setPe(`${newValue}`);
                }}
            />
            <Stack.Item>
                <Stack horizontal>
                <PrimaryButton text={intl.get('common.submit')} onClick={submit}  />
                <DefaultButton text={intl.get('common.cancel')} onClick={onCancel} />
                </Stack>
            </Stack.Item>
        </Stack>
    );
};

export default TPRegexEditor;
