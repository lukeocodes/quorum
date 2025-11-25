import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'unstyled';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-2 focus:ring-success-500 focus:ring-offset-2',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-2 focus:ring-warning-500 focus:ring-offset-2',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-2 focus:ring-danger-500 focus:ring-offset-2',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    unstyled: '', // No default styles - fully customizable via className
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'w-8 h-8 p-0 flex items-center justify-center', // Square with centered icon
  };

  return (
    <button
      ref={ref}
      className={clsx(
        variant !== 'unstyled' && baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

