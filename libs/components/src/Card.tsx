import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'rounded-lg bg-white';

  const variantStyles = {
    default: 'shadow-sm',
    bordered: 'border border-gray-200',
    elevated: 'shadow-lg',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
};

