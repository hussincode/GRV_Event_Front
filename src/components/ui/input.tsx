import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, forwardedRef) => {
  // Extract ref from props (React Hook Form passes it as a regular prop when spreading field)
  const { ref: fieldRef, ...restProps } = props as any;
  // Use fieldRef from props first (from React Hook Form), fall back to forwardedRef
  const inputRef = fieldRef || forwardedRef;

  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      ref={inputRef}
      {...restProps}
    />
  );
});
Input.displayName = 'Input';

export { Input };
