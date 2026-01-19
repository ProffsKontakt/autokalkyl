import { forwardRef, LabelHTMLAttributes } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <label
        className={`text-sm font-medium text-gray-700 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label };
export type { LabelProps };
