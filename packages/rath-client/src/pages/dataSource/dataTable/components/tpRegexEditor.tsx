import { unstable_batchedUpdates } from 'react-dom';
import { FC, useCallback, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { ITextPattern, ITextSelection } from '../../../../lib/textPattern';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';

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
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`tp-regex-before-${tp.fid}`}>before</Label>
                <Input
                    id={`tp-regex-before-${tp.fid}`}
                    value={ph}
                    onChange={(e) => {
                        setPh(e.target.value);
                        setError(null);
                    }}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`tp-regex-selection-${tp.fid}`}>selection</Label>
                <Input
                    id={`tp-regex-selection-${tp.fid}`}
                    value={sl}
                    onChange={(e) => {
                        setSl(e.target.value);
                        setError(null);
                    }}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`tp-regex-after-${tp.fid}`}>after</Label>
                <Input
                    id={`tp-regex-after-${tp.fid}`}
                    value={pe}
                    onChange={(e) => {
                        setPe(e.target.value);
                        setError(null);
                    }}
                />
            </div>
            {error !== null && (
                <span style={{ color: '#a4262c', fontSize: 12, margin: '4px 0' }}>{error}</span>
            )}
            <div className="flex gap-2">
                <Button type="button" onClick={submit}>{intl.get('common.submit')}</Button>
                <Button type="button" variant="outline" onClick={onCancel}>{intl.get('common.cancel')}</Button>
            </div>
        </div>
    );
};

export default TPRegexEditor;
