/**
 * Card — Unified card wrapper
 *
 * Props:
 *   variant  'default' | 'flat' | 'raised'  (default: 'default')
 *   padding  'none' | 'sm' | 'md' | 'lg'   (default: 'md')
 *   className extra classes
 */
import React from 'react';
import { useDS } from '../../hooks/useDS';

const PAD = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-7' };

const Card = ({ variant = 'default', padding = 'md', className = '', children, ...rest }) => {
  const { cardBg, cardRaised, cardFlat } = useDS();

  const bg = variant === 'raised' ? cardRaised
           : variant === 'flat'   ? cardFlat
           : cardBg;

  return (
    <div
      className={`rounded-2xl border ${bg} ${PAD[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
