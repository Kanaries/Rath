import { observer } from 'mobx-react-lite';
import { FC, useState } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import type { FieldExtSuggestion } from '../../interfaces';
import { RathIcon } from '../icons';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export interface FieldExtSuggestionsProps {
    fid: string;
    suggestions: FieldExtSuggestion[];
}

const Container = styled.div({
    padding: '0.5rem',
    width: 'min(32rem, calc(100vw - 2rem))',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',

    '> *': {
        flexGrow: 0,
        flexShrink: 0,
        width: '100%',

        '& small': {
            display: 'block',
        },
    },
});

const FieldExtSuggestions: FC<FieldExtSuggestionsProps> = ({ fid, suggestions }) => {
    const [open, setOpen] = useState(false);

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-auto px-2"
                        style={{
                            animation: 'live-polite 4s infinite',
                        }}
                    >
                        <RathIcon name="AppIconDefaultAdd" className="mr-1" />
                        {intl.get('dataSource.extend.auto')}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" collisionPadding={16} className="w-auto max-w-[calc(100vw-2rem)] p-0">
                    <Container onClick={() => setOpen(false)}>
                        {suggestions.map((sug) => {
                            const [title, desc] = intl.get(`dataSource.extend.suggestion.${sug.type}`).split('|');

                            return (
                                <Button
                                    key={sug.type}
                                    variant="ghost"
                                    className="h-auto w-full items-start justify-start whitespace-normal px-2 py-2 text-left hover:bg-accent"
                                    onClick={() => sug.apply(fid)}
                                >
                                    <RathIcon name="AutoEnhanceOn" className="mr-3 mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <span className="block font-medium leading-5">{title}</span>
                                        {desc && <small className="mt-1 block break-words leading-5 text-muted-foreground">{desc}</small>}
                                    </div>
                                </Button>
                            );
                        })}
                    </Container>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default observer(FieldExtSuggestions);
