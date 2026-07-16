import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<React.ComponentProps<'input'>, 'ref'> {
  ref?: React.Ref<HTMLInputElement>;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, forwardedRef) => {
    // Use the forwarded ref, falling back to any ref in props
    const ref = forwardedRef || (props as any).ref;
    const { ref: _propsRef, ...restProps } = props as any;

    return (
      <input
        type={type || 'text'}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...restProps}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
