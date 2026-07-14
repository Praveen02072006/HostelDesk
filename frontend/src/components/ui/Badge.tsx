import React from 'react';
import { cn, STATUS_COLORS, PRIORITY_COLORS } from '../../lib/utils';
import { ComplaintStatus, Priority } from '../../types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'status' | 'priority' | 'default';
  status?: ComplaintStatus;
  priority?: Priority;
}

export const Badge = ({ className, variant = 'default', status, priority, children, ...props }: BadgeProps) => {
  let badgeClass = 'badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  if (variant === 'status' && status) {
    badgeClass = STATUS_COLORS[status];
  } else if (variant === 'priority' && priority) {
    badgeClass = PRIORITY_COLORS[priority];
  }

  return (
    <span className={cn(badgeClass, className)} {...props}>
      {children || status || priority}
    </span>
  );
};
