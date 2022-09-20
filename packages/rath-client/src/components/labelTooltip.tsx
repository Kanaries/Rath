import React from 'react';
import { IconButton, IDropdownProps, Label, Stack, TooltipHost } from '@fluentui/react';

export function makeRenderLabelHandler (mp?: string | JSX.Element | JSX.Element[]) {
    return (props?: IDropdownProps): JSX.Element => {
        return (
          <Stack horizontal verticalAlign="center">
            <Label>{props?.label}</Label>
            <TooltipHost content={mp}>
                <IconButton
                    iconProps={{ iconName: 'Info' }}
                    styles={{ root: { marginBottom: -3 } }}
                    />
            </TooltipHost>
          </Stack>
        );
      };
}
