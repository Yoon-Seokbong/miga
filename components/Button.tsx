import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className,
  ...props
}) => {
  const baseStyles = 'rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900';
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  const variantStyles = {
    primary: 'bg-purple-400 text-white border border-purple-500',
    secondary: 'bg-secondary text-foreground hover:bg-yellow-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'bg-transparent border border-light-gray-border text-light-gray-text hover:bg-gray-700',
    ghost: 'bg-transparent text-foreground hover:bg-gray-700',
  };

  const fullWidthStyles = fullWidth ? 'w-full flex justify-center' : '';

  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidthStyles} ${className || ''}`;

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

export default Button;
