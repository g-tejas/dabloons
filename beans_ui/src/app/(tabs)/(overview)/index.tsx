import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { CategoryPill } from '@/components/finance/category-pill';
import { InsetGroup } from '@/components/finance/inset-group';
import { SectionHeader } from '@/components/finance/section-header';
import { SystemIcon } from '@/components/finance/system-icon';
import { TransactionRow } from '@/components/finance/transaction-row';
import {
  budgets,
  formatMoney,
  netWorthTrend,
  overview,
  recentTransactions,
  type FinanceIconName,
} from '@/constants/finance-data';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

const accounts: {
  name: string;
  detail: string;
  value: number;
  symbol: 'building.columns.fill' | 'creditcard.fill' | 'chart.line.uptrend.xyaxis';
  fallback: FinanceIconName;
  color: string;
}[] = [
  {
    name: 'Everyday Checking',
    detail: 'First Union ••2048',
    value: 8421.18,
    symbol: 'building.columns.fill',
    fallback: 'account-balance',
    color: '#007AFF',
  },
  {
    name: 'Credit Cards',
    detail: '2 cards · $842 due Sep 3',
    value: -2186.44,
    symbol: 'creditcard.fill',
    fallback: 'credit-card',
    color: '#FF9500',
  },
  {
    name: 'Investments',
    detail: 'Retirement and brokerage',
    value: 42385.68,
    symbol: 'chart.line.uptrend.xyaxis',
    fallback: 'show-chart',
    color: '#34C759',
  },
];

export default function OverviewScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [chartMode, setChartMode] = useState<'Net Worth' | 'Cash Flow'>('Net Worth');

  function selectChartMode(mode: 'Net Worth' | 'Cash Flow') {
    void Haptics.selectionAsync();
    setChartMode(mode);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityLabel="Profile and settings"
              hitSlop={10}
              onPress={() => Alert.alert('Dabloons', 'Profile and settings will live here.')}
              style={({ pressed }) => pressed && styles.controlPressed}>
              <SystemIcon
                color={theme.accent}
                fallback="account-circle"
                name="person.crop.circle"
                size={27}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        automaticallyAdjustsScrollIndicatorInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.six }]}
        style={{ backgroundColor: theme.background }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.balanceHeader}>
          <View style={styles.labelRow}>
            <Text style={[styles.caption, { color: theme.textSecondary }]}>Total Net Worth</Text>
            <Pressable
              accessibilityLabel={balanceVisible ? 'Hide balance' : 'Show balance'}
              hitSlop={10}
              onPress={() => {
                void Haptics.selectionAsync();
                setBalanceVisible((visible) => !visible);
              }}
              style={({ pressed }) => pressed && styles.controlPressed}>
              <SystemIcon
                color={theme.textSecondary}
                fallback={balanceVisible ? 'visibility' : 'visibility-off'}
                name={balanceVisible ? 'eye' : 'eye.slash'}
                size={17}
              />
            </Pressable>
          </View>
          <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.balance, { color: theme.text }]}>
            {balanceVisible ? formatMoney(overview.netWorth) : '$••,•••.••'}
          </Text>
          <View style={styles.changeRow}>
            <SystemIcon color={theme.positive} fallback="north-east" name="arrow.up.right" size={13} weight="semibold" />
            <Text style={[styles.changeText, { color: theme.positive }]}>$1,284.32 (3.8%)</Text>
            <Text style={[styles.changePeriod, { color: theme.textSecondary }]}>past month</Text>
          </View>
        </View>

        <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundElement }]}>
          {(['Net Worth', 'Cash Flow'] as const).map((mode) => {
            const selected = chartMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => selectChartMode(mode)}
                style={({ pressed }) => [
                  styles.segment,
                  selected && [
                    styles.segmentSelected,
                    { backgroundColor: theme.surface, shadowColor: scheme === 'dark' ? '#000000' : '#737373' },
                  ],
                  pressed && styles.controlPressed,
                ]}>
                <Text style={[styles.segmentText, { color: selected ? theme.text : theme.textSecondary }]}>
                  {mode}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.chartBlock}>
          <View style={styles.chartBars}>
            {netWorthTrend.map((height, index) => {
              const cashFlowHeight = [58, 34, 68, 44, 74, 51, 62, 38, 70, 49, 77, 56][index];
              return (
                <View key={`${height}-${index}`} style={styles.chartSlot}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        backgroundColor:
                          index === netWorthTrend.length - 1 ? theme.accent : `${theme.accent}45`,
                        height: `${chartMode === 'Net Worth' ? height : cashFlowHeight}%`,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.axis}>
            <Text style={[styles.axisLabel, { color: theme.textTertiary }]}>SEP</Text>
            <Text style={[styles.axisLabel, { color: theme.textTertiary }]}>MAR</Text>
            <Text style={[styles.axisLabel, { color: theme.textTertiary }]}>AUG</Text>
          </View>
        </View>

        <InsetGroup style={styles.summaryGroup}>
          <SummaryCell label="Available" value={formatMoney(overview.available)} color={theme.positive} />
          <View style={[styles.verticalSeparator, { backgroundColor: theme.border }]} />
          <SummaryCell label="Income" value={formatMoney(overview.income)} color={theme.text} />
          <View style={[styles.verticalSeparator, { backgroundColor: theme.border }]} />
          <SummaryCell label="Savings" value={`${overview.savingsRate}%`} color={theme.text} />
        </InsetGroup>

        <View style={styles.section}>
          <SectionHeader
            action="See All"
            onAction={() => Alert.alert('Accounts', 'Account management will live here.')}
            title="Accounts"
          />
          <InsetGroup>
            {accounts.map((account, index) => (
              <Pressable
                key={account.name}
                onPress={() => Alert.alert(account.name, account.detail)}
                style={({ pressed }) => [
                  styles.accountRow,
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <View style={[styles.accountIcon, { backgroundColor: `${account.color}18` }]}>
                  <SystemIcon
                    color={account.color}
                    fallback={account.fallback}
                    name={account.symbol}
                    size={20}
                  />
                </View>
                <View
                  style={[
                    styles.accountContent,
                    index < accounts.length - 1 && {
                      borderBottomColor: theme.border,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}>
                  <View style={styles.accountCopy}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{account.name}</Text>
                    <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>{account.detail}</Text>
                  </View>
                  <Text style={[styles.accountValue, { color: theme.text }]}>{formatMoney(account.value)}</Text>
                  <SystemIcon color={theme.textTertiary} fallback="chevron-right" name="chevron.right" size={12} weight="semibold" />
                </View>
              </Pressable>
            ))}
          </InsetGroup>
        </View>

        <View style={styles.section}>
          <SectionHeader
            action="Edit"
            onAction={() => Alert.alert('August Spending', 'Budget editing will live here.')}
            title="August Spending"
          />
          <InsetGroup>
            <View style={[styles.monthSummary, { borderBottomColor: theme.border }]}>
              <View style={styles.monthSummaryTop}>
                <View>
                  <Text style={[styles.caption, { color: theme.textSecondary }]}>Spent</Text>
                  <Text style={[styles.monthAmount, { color: theme.text }]}>{formatMoney(overview.spending)}</Text>
                </View>
                <View style={styles.monthRight}>
                  <Text style={[styles.caption, { color: theme.textSecondary }]}>Remaining</Text>
                  <Text style={[styles.monthRemaining, { color: theme.positive }]}>$3,053.56</Text>
                </View>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.progressFill, { backgroundColor: theme.accent, width: '63%' }]} />
              </View>
              <Text style={[styles.progressNote, { color: theme.textSecondary }]}>63% of your monthly plan</Text>
            </View>
            {budgets.map((budget, index) => (
              <View key={budget.account} style={styles.budgetRow}>
                <View style={[styles.budgetIcon, { backgroundColor: `${budget.color}18` }]}>
                  <SystemIcon
                    color={budget.color}
                    fallback={budget.icon}
                    name={categorySymbol(budget.account)}
                    size={18}
                  />
                </View>
                <View
                  style={[
                    styles.budgetContent,
                    index < budgets.length - 1 && {
                      borderBottomColor: theme.border,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}>
                  <View style={styles.budgetCopy}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{budget.label}</Text>
                    <CategoryPill account={budget.account} compact color={theme.accent} />
                  </View>
                  <View style={styles.budgetValueBlock}>
                    <Text style={[styles.budgetValue, { color: theme.text }]}>{formatMoney(budget.spent)}</Text>
                    <Text style={[styles.budgetLimit, { color: theme.textSecondary }]}>
                      of {formatMoney(budget.budget)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </InsetGroup>
        </View>

        <View style={styles.section}>
          <SectionHeader
            action="See All"
            onAction={() => Alert.alert('Transactions', 'The complete activity list will live here.')}
            title="Recent Transactions"
          />
          <InsetGroup style={styles.transactionGroup}>
            {recentTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                last={index === recentTransactions.length - 1}
                transaction={transaction}
              />
            ))}
          </InsetGroup>
        </View>

        <InsetGroup>
          <Pressable
            onPress={() => Alert.alert('Spending Insight', 'Flexible spending is down 11% compared with July.')}
            style={({ pressed }) => [styles.insightRow, pressed && { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.insightIcon, { backgroundColor: theme.positiveSoft }]}>
              <SystemIcon color={theme.positive} fallback="lightbulb" name="lightbulb.fill" size={18} />
            </View>
            <View style={styles.insightCopy}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>You’re spending less</Text>
              <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>Flexible spending is down 11% from July.</Text>
            </View>
            <SystemIcon color={theme.textTertiary} fallback="chevron-right" name="chevron.right" size={12} />
          </Pressable>
        </InsetGroup>
      </ScrollView>
    </>
  );
}

function SummaryCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function categorySymbol(account: string) {
  if (account === 'expenses:food') return 'fork.knife' as const;
  if (account === 'expenses:housing') return 'house.fill' as const;
  if (account === 'expenses:transport') return 'car.fill' as const;
  return 'repeat' as const;
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: Spacing.seven,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    width: '100%',
  },
  balanceHeader: {
    paddingHorizontal: Spacing.one,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  balance: {
    fontSize: 40,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -1.6,
    lineHeight: 48,
    marginTop: 2,
  },
  changeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 5,
  },
  changeText: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  changePeriod: {
    fontSize: 13,
    marginLeft: 2,
  },
  controlPressed: {
    opacity: 0.45,
  },
  segmentedControl: {
    borderRadius: 9,
    flexDirection: 'row',
    padding: 2,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    paddingVertical: 6,
  },
  segmentSelected: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartBlock: {
    gap: Spacing.two,
  },
  chartBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 5,
    height: 130,
    paddingHorizontal: Spacing.one,
  },
  chartSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    borderRadius: 4,
    minHeight: 8,
    width: '100%',
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  summaryGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: Spacing.four,
  },
  summaryCell: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
  verticalSeparator: {
    height: 30,
    opacity: 0.45,
    width: StyleSheet.hairlineWidth,
  },
  section: {
    gap: Spacing.three,
  },
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 68,
    paddingLeft: Spacing.four,
  },
  accountIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  accountContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    marginLeft: Spacing.three,
    minHeight: 68,
    paddingRight: Spacing.three,
  },
  accountCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  rowDetail: {
    fontSize: 12,
    lineHeight: 16,
  },
  accountValue: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  monthSummary: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
  },
  monthSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthAmount: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  monthRight: {
    alignItems: 'flex-end',
  },
  monthRemaining: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    marginTop: 3,
  },
  progressTrack: {
    borderRadius: Radius.pill,
    height: 5,
    marginTop: Spacing.four,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: Radius.pill,
    height: '100%',
  },
  progressNote: {
    fontSize: 11,
    marginTop: 7,
  },
  budgetRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 64,
    paddingLeft: Spacing.four,
  },
  budgetIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  budgetContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginLeft: Spacing.three,
    minHeight: 64,
    paddingRight: Spacing.four,
  },
  budgetCopy: {
    flex: 1,
    gap: 3,
  },
  budgetValueBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  budgetValue: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  budgetLimit: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  transactionGroup: {
    paddingHorizontal: Spacing.four,
  },
  insightRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 72,
    paddingHorizontal: Spacing.four,
  },
  insightIcon: {
    alignItems: 'center',
    borderRadius: 9,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  insightCopy: {
    flex: 1,
    gap: 3,
  },
});
