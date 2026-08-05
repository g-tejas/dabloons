import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { InsetGroup } from '@/components/finance/inset-group';
import { NativeTabScrollView } from '@/components/finance/native-tab-scroll-view';
import { SectionHeader } from '@/components/finance/section-header';
import { SystemIcon } from '@/components/finance/system-icon';
import { TransactionRow } from '@/components/finance/transaction-row';
import { TrendChart } from '@/components/finance/trend-chart';
import {
  accountHistory,
  formatMoney,
  ledgerAccounts,
} from '@/constants/finance-data';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useLedger } from '@/context/ledger-context';

type Period = '1M' | '3M' | '6M' | '1Y';

const periods: Period[] = ['1M', '3M', '6M', '1Y'];
const chartLabels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

export default function AccountDetailScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useLedger();
  const [period, setPeriod] = useState<Period>('1M');
  const account = ledgerAccounts.find((item) => item.id === id);

  const history = useMemo(() => {
    const base = accountHistory[id] ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, account?.balance ?? 0];
    const multipliers: Record<Period, number> = { '1M': 1, '3M': 1.035, '6M': 1.07, '1Y': 1.12 };
    const multiplier = multipliers[period];
    return base.map((value, index) => value - (base.length - 1 - index) * (multiplier - 1) * 210);
  }, [account?.balance, id, period]);

  if (!account) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <Text style={[styles.missingTitle, { color: theme.text }]}>Account not found</Text>
      </View>
    );
  }

  const relatedTransactions = transactions.filter(
    (transaction) =>
      transaction.originAccount === account.id ||
      transaction.destinationAccount === account.id ||
      transaction.account === account.id,
  );
  const activity = relatedTransactions.length > 0 ? relatedTransactions.slice(0, 4) : transactions.slice(0, 4);
  const opening = history[0];
  const change = account.balance - opening;
  const positiveChange = change >= 0;
  const stats = accountStats(account.id);
  const selectedAccountId = account.id;

  function selectPeriod(nextPeriod: Period) {
    void Haptics.selectionAsync();
    setPeriod(nextPeriod);
  }

  function addTransaction() {
    router.push({
      pathname: '/transaction/new',
      params: { origin: selectedAccountId },
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitle: false,
          title: account.name,
        }}
      />
      <NativeTabScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: theme.background }}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: `${account.color}18` }]}>
            <SystemIcon
              color={account.color}
              fallback={account.icon}
              name={account.symbol}
              size={27}
            />
          </View>
          <Text style={[styles.kind, { color: theme.textSecondary }]}>{account.kind.toUpperCase()}</Text>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.balance, { color: theme.text }]}>
            {formatMoney(account.balance)}
          </Text>
          <View style={styles.changeRow}>
            <SystemIcon
              color={positiveChange ? theme.positive : theme.danger}
              fallback={positiveChange ? 'north-east' : 'south-east'}
              name={positiveChange ? 'arrow.up.right' : 'arrow.down.right'}
              size={13}
              weight="semibold"
            />
            <Text
              style={[
                styles.change,
                { color: positiveChange ? theme.positive : theme.danger },
              ]}>
              {formatMoney(change, true)} this period
            </Text>
          </View>
        </View>

        <View style={[styles.periodControl, { backgroundColor: theme.backgroundElement }]}>
          {periods.map((item) => {
            const selected = item === period;
            return (
              <Pressable
                key={item}
                onPress={() => selectPeriod(item)}
                style={[
                  styles.period,
                  selected && { backgroundColor: theme.surface },
                ]}>
                <Text
                  style={[
                    styles.periodText,
                    { color: selected ? theme.text : theme.textSecondary },
                  ]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.chart}>
          <TrendChart
            key={period}
            accessibilityLabel={`${account.name} balance history for ${period}`}
            color={account.color}
            formatValue={formatMoney}
            labels={chartLabels}
            values={history}
          />
          <View style={styles.axis}>
            <Text style={[styles.axisText, { color: theme.textTertiary }]}>START</Text>
            <Text style={[styles.axisText, { color: theme.textTertiary }]}>NOW</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Account Stats" />
          <InsetGroup style={styles.statsGroup}>
            <Stat label="Opening balance" value={formatMoney(opening)} />
            <View style={[styles.verticalRule, { backgroundColor: theme.border }]} />
            <Stat label="Money in" value={formatMoney(stats.inflow)} valueColor={theme.positive} />
            <View style={[styles.horizontalRule, { backgroundColor: theme.border }]} />
            <Stat label="Money out" value={formatMoney(stats.outflow)} valueColor={theme.danger} />
            <View style={[styles.verticalRule, styles.lowerVerticalRule, { backgroundColor: theme.border }]} />
            <Stat label="Reconciled" value={`${stats.reconciled}%`} />
          </InsetGroup>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Recent Activity" />
          <InsetGroup>
            {activity.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                last={index === activity.length - 1}
                transaction={transaction}
              />
            ))}
          </InsetGroup>
        </View>
      </NativeTabScrollView>

      <View style={[styles.actionWrap, { bottom: BottomTabInset + Spacing.three }]}>
        <Pressable
          onPress={addTransaction}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.accent },
            pressed && styles.actionPressed,
          ]}>
          <SystemIcon color="#FFFFFF" fallback="add" name="plus" size={18} weight="bold" />
          <Text style={styles.actionText}>Add Transaction</Text>
        </Pressable>
      </View>
    </>
  );
}

function Stat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: valueColor ?? theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function accountStats(id: string) {
  if (id === 'assets:savings') return { inflow: 2400, outflow: 400, reconciled: 100 };
  if (id === 'liabilities:credit-cards') return { inflow: 1840, outflow: 2186.44, reconciled: 96 };
  return { inflow: 8240, outflow: 5186.44, reconciled: 98 };
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  actionPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionWrap: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    position: 'absolute',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
  },
  axisText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  balance: {
    fontSize: 42,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -1.8,
  },
  change: {
    fontSize: 13,
    fontWeight: '600',
  },
  changeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  chart: {
    gap: 2,
  },
  content: {
    alignSelf: 'center',
    gap: Spacing.six,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + 110,
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    gap: 5,
  },
  heroIcon: {
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    marginBottom: 3,
    width: 50,
  },
  horizontalRule: {
    height: StyleSheet.hairlineWidth,
    left: Spacing.four,
    position: 'absolute',
    right: Spacing.four,
    top: '50%',
  },
  kind: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  lowerVerticalRule: {
    bottom: 0,
    top: '50%',
  },
  missing: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  period: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    justifyContent: 'center',
    minHeight: 28,
  },
  periodControl: {
    borderRadius: 9,
    flexDirection: 'row',
    padding: 2,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: Spacing.three,
  },
  stat: {
    alignItems: 'flex-start',
    gap: 4,
    justifyContent: 'center',
    minHeight: 74,
    paddingHorizontal: Spacing.four,
    width: '50%',
  },
  statLabel: {
    fontSize: 11,
  },
  statsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  statValue: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  verticalRule: {
    bottom: '50%',
    left: '50%',
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
});
