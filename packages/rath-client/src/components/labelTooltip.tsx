import React from 'react';
import { Icon, IconButton, IDropdownProps, Label, Stack, TooltipHost } from '@fluentui/react';

export function makeRenderLabelHandler(mp?: string | JSX.Element | JSX.Element[]) {
    return (props?: IDropdownProps): JSX.Element => {
        return (
            <Stack horizontal verticalAlign="center">
                <Label>{props?.label}</Label>
                <TooltipHost content={mp}>
                    <IconButton iconProps={{ iconName: 'Info' }} styles={{ root: { marginBottom: -3 } }} />
                </TooltipHost>
            </Stack>
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
        <div>
            <Label style={{ display: 'inline-block', textAlign: 'center'}}>{label}{description && (
                <TooltipHost content={description}>
                    <Icon style={{ marginLeft: '6px', cursor: 'pointer'}} iconName="Info"/>
                </TooltipHost>
            )}</Label>
            
        </div>
    );
};
