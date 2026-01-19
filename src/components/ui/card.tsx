import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        className={`flex flex-col space-y-1.5 p-6 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <h3
        className={`text-lg font-semibold leading-none tracking-tight ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', ...props }, ref) => {
    return <div className={`p-6 pt-0 ${className}`} ref={ref} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps };
