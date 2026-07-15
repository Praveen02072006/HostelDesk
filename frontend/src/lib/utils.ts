import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'MMM dd, yyyy') {
  if (!date) return '';
  return format(new Date(date), fmt);
}

export function formatRelativeTime(date: string | Date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const PRIORITY_COLORS = {
  CRITICAL: 'priority-critical',
  HIGH: 'priority-high',
  MEDIUM: 'priority-medium',
  LOW: 'priority-low',
};

export const STATUS_COLORS: Record<string, string> = {
  RAISED: 'badge-raised',
  VERIFIED: 'badge-verified',
  ASSIGNED: 'badge-assigned',
  ACCEPTED: 'badge-accepted',
  IN_PROGRESS: 'badge-in-progress',
  COMPLETED: 'badge-completed',
  PENDING_VERIFICATION: 'badge-completed',
  CLOSED: 'badge-closed',
  ARCHIVED: 'badge-archived',
  CANCELLED: 'badge-cancelled',
};
