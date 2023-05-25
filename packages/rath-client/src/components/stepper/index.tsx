import { type HTMLAttributes, type FC } from "react";
import S from './components';


export interface IStepperProps {}

const Stepper: FC<IStepperProps> = ({ children }) => {
    return (
        <S.Root>
            {children}
        </S.Root>
    );
};

export interface IBoxProps {}

const Box: FC<IBoxProps> = ({ children }) => {
    return (
        <S.Box>
            {children}
        </S.Box>
    );
};

export interface IStepProps {
    completed: boolean;
    active: boolean;
}

const Step: FC<IStepProps & Omit<HTMLAttributes<HTMLDivElement>, keyof IStepProps>> = ({ completed, active, children, className = '', ...attrs }) => {
    return (
        <S.Item
            className={`${completed ? 'completed' : ''} ${active ? 'active' : ''} ${className}`}
            {...attrs}
        >
            <S.Connector className="connector">
                <span />
            </S.Connector>
            {children}
        </S.Item>
    );
};

export interface IStepLabelProps {}

const StepLabel: FC<IStepLabelProps & Omit<HTMLAttributes<HTMLSpanElement>, keyof IStepLabelProps>> = ({ children, ...attrs }) => {
    return (
        <S.Label {...attrs}>
            <span className="icon">
                <svg
                    className="completed"
                    viewBox="-1 -2.4 26 26"
                    focusable="false"
                    aria-hidden="true"
                >
                    <path
                        fill="currentColor"
                        d="M9.3 16.3l-5-5c-.4-.4-.4-1 0-1.4s1-.4 1.4 0l4.3 4.3 8.3-8.3c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-9 9c-.4.4-1 .4-1.4 0z"
                    />
                </svg>
                <div
                    className="uncompleted"
                    aria-hidden="true"
                />
            </span>
            <span className="label">
                <span>
                    {children}
                </span>
            </span>
        </S.Label>
    );
};


export default Object.assign(Stepper, {
    Box,
    Step,
    StepLabel,
});
