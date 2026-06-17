import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'bg-white border border-grey-medium text-grey hover:bg-grey-lightest transition-colors cursor-pointer',
  white: 'bg-white text-primary font-semibold rounded-base px-4 py-2 hover:bg-white/90 transition-colors',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: '',
  lg: 'text-lg px-8 py-3',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={`${variantClasses[variant]}${sizeClasses[size] ? ` ${sizeClasses[size]}` : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = 'Button';