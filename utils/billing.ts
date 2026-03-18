export type PlanType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function calculateNextBillingDate(purchaseDate: string, planType: PlanType, customDate?: string): string {
  switch (planType) {
    case 'monthly':
      return addMonths(purchaseDate, 1);
    case 'quarterly':
      return addMonths(purchaseDate, 3);
    case 'yearly':
      return addMonths(purchaseDate, 12);
    case 'custom':
      return customDate || purchaseDate;
    default:
      return addMonths(purchaseDate, 1);
  }
}

export function calculateReminderDate(nextBillingDate: string): string {
  return addDays(nextBillingDate, -1);
}

export function getDaysUntilDue(nextBillingDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextBillingDate);
  return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(nextBillingDate: string): boolean {
  return getDaysUntilDue(nextBillingDate) < 0;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function getDueBadge(nextBillingDate: string, status: string): { label: string; color: string; urgent: boolean } | null {
  if (status === 'inactive') return { label: 'Inactive', color: '#888', urgent: false };
  if (!nextBillingDate) return null;

  const days = getDaysUntilDue(nextBillingDate);

  if (days < 0) return { label: 'Overdue', color: '#ff5252', urgent: true };
  if (days === 0) return { label: 'Due Today!', color: '#ff5252', urgent: true };
  if (days === 1) return { label: 'Due Tomorrow', color: '#ffd740', urgent: true };
  if (days <= 7) return { label: `Due in ${days}d`, color: '#ffd740', urgent: false };
  return { label: `${days}d remaining`, color: '#00e676', urgent: false };
}

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  custom: 'Custom',
};
