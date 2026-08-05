import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { SFSymbol } from 'expo-symbols';
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

export type LedgerAccountKind = 'Asset' | 'Expense' | 'Income' | 'Liability' | 'Equity';

export type LedgerAccount = {
  id: string;
  name: string;
  detail: string;
  kind: LedgerAccountKind;
  balance: number;
  icon: FinanceIconName;
  symbol: SFSymbol;
  color: string;
};

export type FinanceTransaction = {
  id: string;
  merchant: string;
  note: string;
  account: string;
  amount: number;
  icon: FinanceIconName;
  color: string;
  originAccount?: string;
  destinationAccount?: string;
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

export const ledgerAccounts: LedgerAccount[] = [
  {
    id: 'assets:checking',
    name: 'Everyday Checking',
    detail: 'First Union ••2048',
    kind: 'Asset',
    balance: 8421.18,
    icon: 'account-balance',
    symbol: 'building.columns.fill',
    color: '#007AFF',
  },
  {
    id: 'assets:savings',
    name: 'Emergency Savings',
    detail: 'First Union ••9012',
    kind: 'Asset',
    balance: 42385.68,
    icon: 'savings',
    symbol: 'banknote.fill',
    color: '#34C759',
  },
  {
    id: 'liabilities:credit-cards',
    name: 'Credit Cards',
    detail: '2 cards · $842 due Sep 3',
    kind: 'Liability',
    balance: -2186.44,
    icon: 'credit-card',
    symbol: 'creditcard.fill',
    color: '#FF9500',
  },
  {
    id: 'expenses:food',
    name: 'Food & Dining',
    detail: 'Expense account',
    kind: 'Expense',
    balance: 486.2,
    icon: 'restaurant',
    symbol: 'fork.knife',
    color: '#E47752',
  },
  {
    id: 'expenses:housing',
    name: 'Home',
    detail: 'Expense account',
    kind: 'Expense',
    balance: 1840,
    icon: 'home',
    symbol: 'house.fill',
    color: '#6D74C9',
  },
  {
    id: 'expenses:transport',
    name: 'Getting Around',
    detail: 'Expense account',
    kind: 'Expense',
    balance: 218.64,
    icon: 'directions-car',
    symbol: 'car.fill',
    color: '#3D8DB8',
  },
  {
    id: 'expenses:subscriptions',
    name: 'Subscriptions',
    detail: 'Expense account',
    kind: 'Expense',
    balance: 84.97,
    icon: 'subscriptions',
    symbol: 'repeat',
    color: '#A35D9B',
  },
  {
    id: 'income:salary',
    name: 'Salary',
    detail: 'Income account',
    kind: 'Income',
    balance: 8240,
    icon: 'work',
    symbol: 'briefcase.fill',
    color: '#278662',
  },
  {
    id: 'equity:opening-balances',
    name: 'Opening Balances',
    detail: 'Equity account',
    kind: 'Equity',
    balance: 0,
    icon: 'balance',
    symbol: 'scale.3d',
    color: '#AF52DE',
  },
  {
    id: 'equity:owner-contributions',
    name: 'Owner Contributions',
    detail: 'Equity account',
    kind: 'Equity',
    balance: 0,
    icon: 'account-balance-wallet',
    symbol: 'person.crop.circle.badge.plus',
    color: '#5856D6',
  },
];

export const primaryAccountIds = [
  'assets:checking',
  'liabilities:credit-cards',
  'assets:savings',
];

export const accountHistory: Record<string, number[]> = {
  'assets:checking': [7210, 7480, 7150, 7890, 8120, 7740, 8260, 8010, 8540, 8170, 8390, 8421.18],
  'assets:savings': [38940, 39420, 39760, 40180, 40620, 41040, 41220, 41680, 41920, 42110, 42240, 42385.68],
  'liabilities:credit-cards': [-1480, -1720, -1630, -1940, -1810, -2230, -2070, -2360, -2140, -2460, -2310, -2186.44],
};

export const netWorthTrend = [
  42180.24,
  43240.58,
  42985.16,
  44710.83,
  45282.4,
  45040.12,
  46195.76,
  46840.22,
  46590.68,
  47420.36,
  48018.9,
  48620.42,
];

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
