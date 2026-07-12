import React, { type JSX } from 'react';
import { RathIcon } from './icons';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface LabelRenderProps {
    label?: React.ReactNode;
}

export function makeRenderLabelHandler(mp?: string | JSX.Element | JSX.Element[]) {
    return (props?: LabelRenderProps): JSX.Element => {
        return (
            <div className="flex items-center">
                <Label>{props?.label}</Label>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="mb-[-3px]">
                            <RathIcon name="Info" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{mp}</TooltipContent>
                </Tooltip>
            </div>
        );
    };
}

interface LabelWithDescProps {
    label: string;
    description?: string | JSX.Element | JSX.Element[];
}
export const LabelWithDesc: React.FC<LabelWithDescProps> = (props) => {
    const { label, description } = props;
    return (
        <div className="inline-flex items-center gap-1.5">
            <Label>{label}</Label>
            {description && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-xs text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                            aria-label={`More information about ${label}`}
                        >
                            <RathIcon name="Info" size={14} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{description}</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};
