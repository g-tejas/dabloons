import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { CategoryPill } from '@/components/finance/category-pill';
import { SystemIcon } from '@/components/finance/system-icon';
import { type FinanceTransaction, formatMoney } from '@/constants/finance-data';
import { Colors, Spacing } from '@/constants/theme';

export function TransactionRow({
  transaction,
  last = false,
}: {
  transaction: FinanceTransaction;
  last?: boolean;
}) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const positive = transaction.amount > 0;

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: `${transaction.color}18` }]}>
        <SystemIcon
          color={transaction.color}
          fallback={transaction.icon}
          name={transactionSymbol(transaction.icon)}
          size={18}
        />
      </View>
      <View
        style={[
          styles.content,
          !last && {
            borderBottomColor: theme.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
          },
        ]}>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.merchant, { color: theme.text }]}>
            {transaction.merchant}
          </Text>
          <View style={styles.meta}>
            <Text numberOfLines={1} style={[styles.note, { color: theme.textSecondary }]}>
              {transaction.note}
            </Text>
            <Text style={[styles.metaDot, { color: theme.textTertiary }]}>·</Text>
            <CategoryPill account={transaction.account} compact />
          </View>
        </View>
        <Text style={[styles.amount, { color: positive ? theme.positive : theme.text }]}>
          {formatMoney(transaction.amount, positive)}
        </Text>
      </View>
    </View>
  );
}

function transactionSymbol(icon: FinanceTransaction['icon']) {
  if (icon === 'restaurant') return 'fork.knife' as const;
  if (icon === 'work') return 'banknote.fill' as const;
  if (icon === 'local-grocery-store') return 'cart.fill' as const;
  if (icon === 'bolt') return 'bolt.fill' as const;
  if (icon === 'directions-car' || icon === 'electric-car') return 'car.fill' as const;
  if (icon === 'subscriptions' || icon === 'cloud') return 'repeat' as const;
  return 'creditcard.fill' as const;
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 68,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    marginLeft: Spacing.three,
    minHeight: 68,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 0,
  },
  note: {
    flexShrink: 1,
    fontSize: 11,
  },
  metaDot: {
    fontSize: 11,
    marginHorizontal: 5,
  },
  amount: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    paddingRight: 1,
  },
});
