import * as React from 'react'

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

    const inputVariants = cva(
        'ui-flex ui-h-10 ui-w-full ui-px-3 ui-py-2 ui-text-sm file:ui-bg-transparent file:ui-text-sm file:ui-font-medium placeholder:ui-text-muted-foreground disabled:ui-cursor-not-allowed disabled:ui-opacity-50',
        {
            variants: {
                variant: {
                    default:
                        'file:ui-border-0 ui-rounded-md ui-border ui-border-input ui-bg-background ui-ring-offset-background focus-visible:ui-outline-none focus-visible:ui-ring-2 focus-visible:ui-ring-ring focus-visible:ui-ring-offset-2',
                    outline:
                        'file:ui-border-0 ui-rounded-md ui-border ui-border-input ui-ring-offset-background focus-visible:ui-outline-none focus-visible:ui-ring-2 focus-visible:ui-ring-ring focus-visible:ui-ring-offset-2',
                    secondary:
                        'file:ui-border-0 ui-rounded-md ui-border ui-border-input ui-bg-secondary ui-ring-offset-secondary ui-text-primary focus-visible:ui-outline-none focus-visible:ui-ring-2 focus-visible:ui-ring-ring focus-visible:ui-ring-offset-2',
                    ghost: '!ui-outline-none ui-bg-transparent',
                },
            },
            defaultVariants: {
                variant: 'default',
            },
        }
    )

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement>,
        VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, variant, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(inputVariants({ variant, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = 'Input'

export { Input }
