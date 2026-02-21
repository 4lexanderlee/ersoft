/**
 * Badge — Status / label pill
 *
 * Props:
 *   color  'green' | 'amber' | 'red' | 'blue' | 'teal' | 'gray' | 'indigo'
 *   size   'sm' | 'md'  (default: 'sm')
 *   dot    boolean — show colored dot before label
 */
import React from 'react';

const COLORS = {
  green:  'bg-green-500/15 text-green-500 border border-green-500/25',
  amber:  'bg-amber-500/15 text-amber-500 border border-amber-500/25',
  red:    'bg-red-500/15   text-red-400   border border-red-500/25',
  blue:   'bg-blue-500/15  text-blue-400  border border-blue-500/25',
  teal:   'bg-teal-500/15  text-teal-400  border border-teal-500/25',
  gray:   'bg-gray-500/15  text-gray-400  border border-gray-500/25',
  indigo: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
};
const DOT_COLORS = {
  green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-400',
  blue: 'bg-blue-400', teal: 'bg-teal-400', gray: 'bg-gray-400', indigo: 'bg-indigo-400',
};
const SIZE = { sm: 'px-2.5 py-0.5 text-[11px]', md: 'px-3 py-1 text-xs' };

const Badge = ({ color = 'gray', size = 'sm', dot = false, children }) => (
  <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${COLORS[color]} ${SIZE[size]}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[color]}`} />}
    {children}
  </span>
);

export default Badge;
