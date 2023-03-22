import { Callout, DefaultButton, type IButtonProps, type ICalloutProps } from "@fluentui/react";
import { useBoolean, useId } from "@fluentui/react-hooks";
import { observer } from "mobx-react-lite";
import { forwardRef, useImperativeHandle } from "react";


export interface IConfigButtonProps {
    button: Omit<IButtonProps, 'children'>;
    callout?: Omit<ICalloutProps, 'children'>;
    children?: any;
}

export interface IConfigButtonRef {
    dismiss: () => void;
}

const ConfigButton = observer(forwardRef<IConfigButtonRef, IConfigButtonProps>(function ConfigButton ({ button, callout, children }, ref) {
    const [isCalloutVisible, { toggle: toggleIsCalloutVisible, setFalse: dismiss }] = useBoolean(false);
    const buttonId = useId('config-button-trigger');

    useImperativeHandle(ref, () => ({
        dismiss,
    }));

    return (
        <>
            <DefaultButton
                {...button}
                onClick={toggleIsCalloutVisible}
                id={buttonId}
            />
            {isCalloutVisible && (
                <Callout
                    {...callout}
                    target={`#${buttonId}`}
                    role="dialog"
                    gapSpace={0}
                    onDismiss={toggleIsCalloutVisible}
                    setInitialFocus
                >
                    {children}
                </Callout>
            )}
        </>
    );
}));


export default ConfigButton;
