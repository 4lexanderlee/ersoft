/**
 * Input — Unified form input / textarea / date field
 *
 * Props:
 *   as        'input' | 'textarea'  (default: 'input')
 *   label     string (optional floating-style label above)
 *   error     string (optional error message)
 *   leftIcon  React node
 *   size      'sm' | 'md'  (default: 'md')
 *   filled    boolean — use filled (bg) variant instead of transparent
 *   ...rest   forwarded to the underlying element
 */
import React from 'react';
import { useDS } from '../../hooks/useDS';

const SIZE_CLS = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

const Input = ({
  as = 'input',
  label,
  error,
  leftIcon,
  size = 'md',
  filled = false,
  className = '',
  ...rest
}) => {
  const { inputCls, inputDarkFilled, muted, text } = useDS();
  const Tag = as;
  const base = `w-full border rounded-xl outline-none transition-colors ${filled ? inputDarkFilled : inputCls} ${SIZE_CLS[size]} ${className}`;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>{label}</label>}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className={`absolute left-3 pointer-events-none ${muted}`}>{leftIcon}</span>
        )}
        <Tag
          className={`${base} ${leftIcon ? 'pl-9' : ''}`}
          {...rest}
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
};

export default Input;
