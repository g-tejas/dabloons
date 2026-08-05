import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  ledgerAccounts,
  recentTransactions,
  type FinanceTransaction,
} from '@/constants/finance-data';

type AddTransactionInput = {
  amount: number;
  description?: string;
  destinationAccount: string;
  originAccount: string;
};

type LedgerContextValue = {
  transactions: FinanceTransaction[];
  addTransaction: (input: AddTransactionInput) => FinanceTransaction;
};

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: PropsWithChildren) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(recentTransactions);

  const value = useMemo<LedgerContextValue>(
    () => ({
      transactions,
      addTransaction(input) {
        const origin = ledgerAccounts.find((account) => account.id === input.originAccount);
        const destination = ledgerAccounts.find(
          (account) => account.id === input.destinationAccount,
        );

        if (!origin || !destination) {
          throw new Error('A valid origin and destination account are required.');
        }

        const increasesTrackedBalance =
          destination.kind === 'Asset' || destination.kind === 'Income';
        const transaction: FinanceTransaction = {
          account: destination.id,
          amount: increasesTrackedBalance ? input.amount : -input.amount,
          color: destination.color,
          destinationAccount: destination.id,
          icon: destination.icon,
          id: `local-${Date.now()}`,
          merchant: input.description?.trim() || destination.name,
          note: `Today · ${origin.name} → ${destination.name}`,
          originAccount: origin.id,
        };

        setTransactions((current) => [transaction, ...current]);
        return transaction;
      },
    }),
    [transactions],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used inside LedgerProvider.');
  }
  return context;
}
