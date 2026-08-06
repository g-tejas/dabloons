import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

export type FinanceIconName = ComponentProps<typeof MaterialIcons>['name'];

export type BudgetCategory = {
  account: string;
  label: string;
  icon: FinanceIconName;
  color: string;
  spent: number;
  budget: number;
};

export type FinanceTransaction = {
  id: string;
  merchant: string;
  note: string;
  account: string;
  amount: number;
  icon: FinanceIconName;
  color: string;
};

export type ReconciliationItem = {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  issue: 'Needs category' | 'Possible duplicate' | 'Amount mismatch' | 'New merchant';
  detail: string;
  suggestedAccount?: string;
  icon: FinanceIconName;
  color: string;
};

export const overview = {
  netWorth: 48620.42,
  monthlyChange: 1284.32,
  monthlyChangePercent: 3.8,
  available: 3421.18,
  income: 8240,
  spending: 5186.44,
  savingsRate: 28,
};

export const netWorthTrend = [42, 46, 43, 51, 56, 54, 62, 66, 64, 72, 77, 82];

export const budgets: BudgetCategory[] = [
  {
    account: 'expenses:food',
    label: 'Food & dining',
    icon: 'restaurant',
    color: '#E47752',
    spent: 486.2,
    budget: 650,
  },
  {
    account: 'expenses:housing',
    label: 'Home',
    icon: 'home',
    color: '#6D74C9',
    spent: 1840,
    budget: 2050,
  },
  {
    account: 'expenses:transport',
    label: 'Getting around',
    icon: 'directions-car',
    color: '#3D8DB8',
    spent: 218.64,
    budget: 400,
  },
  {
    account: 'expenses:subscriptions',
    label: 'Subscriptions',
    icon: 'subscriptions',
    color: '#A35D9B',
    spent: 84.97,
    budget: 110,
  },
];

export const recentTransactions: FinanceTransaction[] = [
  {
    id: 't1',
    merchant: 'Green Table',
    note: 'Today · Lunch',
    account: 'expenses:food',
    amount: -24.8,
    icon: 'restaurant',
    color: '#E47752',
  },
  {
    id: 't2',
    merchant: 'Payroll',
    note: 'Today · Acme Studio',
    account: 'income:salary',
    amount: 4120,
    icon: 'work',
    color: '#278662',
  },
  {
    id: 't3',
    merchant: 'Metro Market',
    note: 'Yesterday · Groceries',
    account: 'expenses:food',
    amount: -86.42,
    icon: 'local-grocery-store',
    color: '#D78A3D',
  },
  {
    id: 't4',
    merchant: 'Mori Energy',
    note: 'Aug 18 · Autopay',
    account: 'expenses:housing',
    amount: -119.3,
    icon: 'bolt',
    color: '#6D74C9',
  },
];

export const reconciliationItems: ReconciliationItem[] = [
  {
    id: 'r1',
    merchant: 'Sunday Press',
    date: 'Aug 30 · Chase Sapphire',
    amount: -18.4,
    issue: 'Needs category',
    detail: 'Coffee shop or books? We found two likely matches.',
    suggestedAccount: 'expenses:food',
    icon: 'local-cafe',
    color: '#D77A50',
  },
  {
    id: 'r2',
    merchant: 'Cloudbox',
    date: 'Aug 29 · Amex Blue',
    amount: -12.99,
    issue: 'Possible duplicate',
    detail: 'A matching charge appeared 2 minutes earlier.',
    suggestedAccount: 'expenses:subscriptions',
    icon: 'cloud',
    color: '#756EC6',
  },
  {
    id: 'r3',
    merchant: 'Northstar Market',
    date: 'Aug 27 · Checking ••2048',
    amount: -73.21,
    issue: 'Amount mismatch',
    detail: 'Your receipt is $71.21 — the bank cleared $2.00 more.',
    suggestedAccount: 'expenses:food',
    icon: 'local-grocery-store',
    color: '#D5963F',
  },
  {
    id: 'r4',
    merchant: 'Luma Mobility',
    date: 'Aug 24 · Chase Sapphire',
    amount: -42.5,
    issue: 'New merchant',
    detail: 'First time seeing this merchant. Is it transportation?',
    suggestedAccount: 'expenses:transport',
    icon: 'electric-car',
    color: '#438FB5',
  },
  {
    id: 'r5',
    merchant: 'Paper & Parcel',
    date: 'Aug 21 · Amex Blue',
    amount: -34.18,
    issue: 'Needs category',
    detail: 'No memo was attached to this card purchase.',
    suggestedAccount: 'expenses:shopping',
    icon: 'shopping-bag',
    color: '#A45D8E',
  },
];

export const categoryMeta: Record<
  string,
  { label: string; icon: FinanceIconName; color: string; budget: number; spent: number }
> = {
  'expenses:food': {
    label: 'Food & dining',
    icon: 'restaurant',
    color: '#E47752',
    budget: 650,
    spent: 486.2,
  },
  'expenses:housing': {
    label: 'Home',
    icon: 'home',
    color: '#6D74C9',
    budget: 2050,
    spent: 1840,
  },
  'expenses:transport': {
    label: 'Getting around',
    icon: 'directions-car',
    color: '#3D8DB8',
    budget: 400,
    spent: 218.64,
  },
  'expenses:subscriptions': {
    label: 'Subscriptions',
    icon: 'subscriptions',
    color: '#A35D9B',
    budget: 110,
    spent: 84.97,
  },
  'expenses:shopping': {
    label: 'Shopping',
    icon: 'shopping-bag',
    color: '#A45D8E',
    budget: 300,
    spent: 174.82,
  },
};

export function formatMoney(value: number, showSign = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: showSign ? 'always' : 'auto',
  }).format(value);
}
