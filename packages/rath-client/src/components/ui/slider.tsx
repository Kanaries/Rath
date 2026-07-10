import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from 'utils/cn';

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    thumbLabels?: string[];
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
    ({ className, value, defaultValue, thumbLabels, ...props }, ref) => {
        const thumbCount = Math.max(value?.length ?? defaultValue?.length ?? 1, 1);

        return (
            <SliderPrimitive.Root
                ref={ref}
                className={cn('relative flex w-full touch-none select-none items-center', className)}
                value={value}
                defaultValue={defaultValue}
                {...props}
            >
                <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
                    <SliderPrimitive.Range className="absolute h-full bg-primary" />
                </SliderPrimitive.Track>
                {Array.from({ length: thumbCount }, (_, index) => (
                    <SliderPrimitive.Thumb
                        key={index}
                        aria-label={thumbLabels?.[index]}
                        className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    />
                ))}
            </SliderPrimitive.Root>
        );
    }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
