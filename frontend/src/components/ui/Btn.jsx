/**
 * Btn — Unified Button Component
 *
 * Props:
 *   variant   'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'  (default: primary)
 *   size      'sm' | 'md' | 'lg'  (default: md)
 *   leftIcon  React node
 *   rightIcon React node
 *   fullWidth boolean
 *   disabled  boolean
 *   className  extra classes
 *   ...rest   forwarded to <button>
 */
import React from 'react';
import { useDS } from '../../hooks/useDS';

const SIZE = {
  sm: 'px-4 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3   text-sm gap-2',
};

const ICON_SIZE = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

const Btn = ({
  variant   = 'primary',
  size      = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled  = false,
  className = '',
  children,
  ...rest
}) => {
  const { isDark } = useDS();

  const base =
    'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-[#1a1a1a] text-white hover:bg-gray-700 focus-visible:ring-gray-500',
    secondary: isDark
      ? 'border border-gray-600 text-gray-200 hover:bg-gray-700 focus-visible:ring-gray-500'
      : 'border border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
    danger:
      'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
    ghost: isDark
      ? 'text-gray-300 hover:bg-gray-700 focus-visible:ring-gray-500'
      : 'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
    icon: isDark
      ? 'text-gray-400 hover:bg-gray-700 hover:text-white focus-visible:ring-gray-500'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400',
  };

  const isIcon = variant === 'icon';
  const sizeClass = isIcon ? ICON_SIZE[size] : SIZE[size];

  return (
    <button
      disabled={disabled}
      className={`
        ${base}
        ${variants[variant]}
        ${sizeClass}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim()}
      {...rest}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Btn;
