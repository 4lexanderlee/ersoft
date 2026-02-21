/**
 * EmptyState — Centered empty list / no-data placeholder
 *
 * Props:
 *   icon      React node (optional)
 *   title     string
 *   message   string (optional)
 *   action    React node (optional CTA button)
 */
import React from 'react';
import { useDS } from '../../hooks/useDS';

const EmptyState = ({ icon, title, message, action }) => {
  const { muted, text } = useDS();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon && (
        <div className={`text-5xl mb-1 ${muted}`}>{icon}</div>
      )}
      <p className={`font-bold text-base ${text}`}>{title}</p>
      {message && <p className={`text-sm max-w-xs ${muted}`}>{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
