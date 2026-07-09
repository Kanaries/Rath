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
    /** return an error message to block the submit, or null to accept */
    validate?: (tp: IFieldTextPattern) => string | null;
}
const TPRegexEditor: FC<TPRegexEditorProps> = (props) => {
    const { tp, onSubmit, onCancel, validate } = props;
    const [ph, setPh] = useState<string>('');
    const [sl, setSl] = useState<string>('');
    const [pe, setPe] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        unstable_batchedUpdates(() => {
            setPh(tp.ph.source)
            setPe(tp.pe.source)
            setSl(tp.selection.source)
            setError(null)
        })
    }, [tp])

    const submit = useCallback(() => {
        let ans: IFieldTextPattern;
        try {
            ans = {
                fid: tp.fid,
                ph: new RegExp(ph),
                pe: new RegExp(pe),
                selection: new RegExp(sl),
                pattern: new RegExp(`(?:${ph})(?<selection>${sl})(?:${pe})`),
                selectionType: tp.selectionType,
                score: tp.score,
            };
        } catch (err) {
            setError(intl.get('dataSource.textPattern.invalidRegex'));
            return;
        }
        const validationError = validate ? validate(ans) : null;
        if (validationError !== null) {
            setError(validationError);
            return;
        }
        setError(null);
        onSubmit(ans);
    }, [tp.fid, tp.selectionType, tp.score, ph, pe, sl, onSubmit, validate])

    return (
        <Stack>
            <TextField
                label="before"
                value={ph}
                onChange={(e, newValue) => {
                    setPh(`${newValue}`);
                    setError(null);
                }}
            />
            <TextField
                label="selection"
                value={sl}
                onChange={(e, newValue) => {
                    setSl(`${newValue}`);
                    setError(null);
                }}
            />
            <TextField
                label="after"
                value={pe}
                onChange={(e, newValue) => {
                    setPe(`${newValue}`);
                    setError(null);
                }}
            />
            {error !== null && (
                <span style={{ color: '#a4262c', fontSize: 12, margin: '4px 0' }}>{error}</span>
            )}
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
