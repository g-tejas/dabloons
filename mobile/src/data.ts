export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amount: number;
  icon: string;
  color: string;
};

export type Account = {
  id: string;
  name: string;
  kind: string;
  balance: number;
  number: string;
  color: string;
  change: string;
};

export const balanceHistory: Record<string, number[]> = {
  '1W': [23080, 23120, 22940, 23310, 23470, 23390, 23680, 23842],
  '1M': [21780, 22140, 21930, 22520, 22390, 22880, 22710, 23240, 23090, 23842],
  '3M': [19600, 20120, 19820, 20980, 21320, 21110, 22080, 21890, 22940, 23842],
  '1Y': [15200, 16300, 15900, 17400, 18100, 17600, 19300, 20700, 21400, 23842],
};

export const accounts: Account[] = [
  {
    id: 'everyday',
    name: 'Everyday',
    kind: 'Checking',
    balance: 6842.19,
    number: '•• 1842',
    color: '#C7FF59',
    change: '+$1,240 this month',
  },
  {
    id: 'savings',
    name: 'Rainy day',
    kind: 'Savings',
    balance: 12440.0,
    number: '•• 0921',
    color: '#A998FF',
    change: '68% of goal',
  },
  {
    id: 'investments',
    name: 'Long term',
    kind: 'Investing',
    balance: 4560.28,
    number: '•• 6610',
    color: '#66B7FF',
    change: '+8.4% all time',
  },
];

export const transactions: Transaction[] = [
  {
    id: '1',
    merchant: 'Whole Foods',
    category: 'Groceries',
    date: 'Today, 10:42 AM',
    amount: -86.42,
    icon: 'basket-outline',
    color: '#F1B764',
  },
  {
    id: '2',
    merchant: 'Salary',
    category: 'Income',
    date: 'Today, 8:00 AM',
    amount: 3200,
    icon: 'arrow-down',
    color: '#6BE585',
  },
  {
    id: '3',
    merchant: 'Figma',
    category: 'Subscriptions',
    date: 'Yesterday',
    amount: -15,
    icon: 'shapes-outline',
    color: '#A998FF',
  },
  {
    id: '4',
    merchant: 'Blue Bottle',
    category: 'Coffee',
    date: 'Yesterday',
    amount: -6.8,
    icon: 'cafe-outline',
    color: '#66B7FF',
  },
  {
    id: '5',
    merchant: 'City Transit',
    category: 'Transport',
    date: 'Aug 2',
    amount: -28,
    icon: 'train-outline',
    color: '#FF746D',
  },
  {
    id: '6',
    merchant: 'Freelance project',
    category: 'Income',
    date: 'Aug 1',
    amount: 780,
    icon: 'briefcase-outline',
    color: '#6BE585',
  },
  {
    id: '7',
    merchant: 'Apple',
    category: 'Subscriptions',
    date: 'Jul 31',
    amount: -12.99,
    icon: 'musical-notes-outline',
    color: '#A998FF',
  },
];

export const budgets = [
  { id: 'food', label: 'Food & drink', spent: 624, limit: 850, icon: 'restaurant-outline', color: '#F1B764' },
  { id: 'shopping', label: 'Shopping', spent: 284, limit: 500, icon: 'bag-handle-outline', color: '#A998FF' },
  { id: 'transport', label: 'Transport', spent: 152, limit: 300, icon: 'car-outline', color: '#66B7FF' },
  { id: 'fun', label: 'Fun money', spent: 236, limit: 250, icon: 'sparkles-outline', color: '#FF746D' },
];

export const categories = [
  { label: 'Food', amount: 624, percent: 36, color: '#F1B764' },
  { label: 'Shopping', amount: 418, percent: 24, color: '#A998FF' },
  { label: 'Bills', amount: 361, percent: 21, color: '#66B7FF' },
  { label: 'Other', amount: 329, percent: 19, color: '#59625D' },
];
