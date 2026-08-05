import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { CategoryPill } from '@/components/finance/category-pill';
import { InsetGroup } from '@/components/finance/inset-group';
import { NativeTabScrollView } from '@/components/finance/native-tab-scroll-view';
import { SectionHeader } from '@/components/finance/section-header';
import { SystemIcon } from '@/components/finance/system-icon';
import { TransactionRow } from '@/components/finance/transaction-row';
import {
  categoryMeta,
  formatMoney,
  recentTransactions,
  type FinanceIconName,
  type FinanceTransaction,
} from '@/constants/finance-data';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

const weeklySpend = [42, 68, 36, 88, 55, 73, 49, 92, 62, 78, 58, 70];
const merchantsByAccount: Record<string, { name: string; amount: number; share: number }[]> = {
  'expenses:food': [
    { name: 'Metro Market', amount: 186.42, share: 38 },
    { name: 'Restaurants', amount: 164.8, share: 34 },
    { name: 'Coffee & Treats', amount: 79.22, share: 16 },
  ],
  'expenses:housing': [
    { name: 'Oak Street Rent', amount: 1620, share: 88 },
    { name: 'Mori Energy', amount: 119.3, share: 7 },
    { name: 'Home Supplies', amount: 76.4, share: 4 },
  ],
  'expenses:transport': [
    { name: 'Metro Pass', amount: 96, share: 44 },
    { name: 'Luma Mobility', amount: 72.5, share: 33 },
    { name: 'Fuel & Charging', amount: 38.2, share: 18 },
  ],
  'expenses:subscriptions': [
    { name: 'Cloudbox', amount: 24.99, share: 29 },
    { name: 'Streamline', amount: 18.99, share: 22 },
    { name: 'News & Media', amount: 15, share: 18 },
  ],
};

type Period = 'Month' | '3 Months' | 'Year';

export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{ account?: string | string[] }>();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const [period, setPeriod] = useState<Period>('Month');
  const rawAccount = Array.isArray(params.account) ? params.account[0] : params.account;
  const account = decodeURIComponent(rawAccount ?? 'expenses:other');
  const meta = categoryMeta[account] ?? {
    label: account.split(':').at(-1)?.replaceAll('-', ' ') ?? 'Other',
    icon: 'label' as FinanceIconName,
    color: theme.accent,
    budget: 500,
    spent: 184.2,
  };
  const progress = Math.min(meta.spent / meta.budget, 1);
  const remaining = Math.max(meta.budget - meta.spent, 0);
  const merchants = merchantsByAccount[account] ?? [
    { name: 'Top Merchant', amount: meta.spent * 0.42, share: 42 },
    { name: 'Everything Else', amount: meta.spent * 0.36, share: 36 },
  ];
  const matchingTransactions = recentTransactions.filter((transaction) => transaction.account === account);
  const transactions: FinanceTransaction[] = matchingTransactions.length
    ? matchingTransactions
    : [
        {
          id: 'detail-1',
          merchant: merchants[0].name,
          note: 'Aug 24 · Card purchase',
          account,
          amount: -Math.min(merchants[0].amount, 82.4),
          icon: meta.icon,
          color: meta.color,
        },
        {
          id: 'detail-2',
          merchant: merchants[1].name,
          note: 'Aug 16 · Card purchase',
          account,
          amount: -Math.min(merchants[1].amount, 54.2),
          icon: meta.icon,
          color: meta.color,
        },
      ];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityLabel="Category options"
              hitSlop={10}
              onPress={() => Alert.alert(meta.label, 'Budget, rules, and category settings will live here.')}
              style={({ pressed }) => pressed && styles.controlPressed}>
              <SystemIcon color={theme.accent} fallback="more-horiz" name="ellipsis.circle" size={24} />
            </Pressable>
          ),
          title: meta.label,
        }}
      />
      <NativeTabScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.six }]}
        style={{ backgroundColor: theme.background }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.metricHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: `${meta.color}18` }]}>
            <SystemIcon
              color={meta.color}
              fallback={meta.icon}
              name={categorySymbol(account)}
              size={24}
            />
          </View>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Spent in August</Text>
          <Text style={[styles.amount, { color: theme.text }]}>{formatMoney(meta.spent)}</Text>
          <CategoryPill account={account} />
        </View>

        <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundElement }]}>
          {(['Month', '3 Months', 'Year'] as const).map((value) => {
            const selected = period === value;
            return (
              <Pressable
                key={value}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setPeriod(value);
                }}
                style={({ pressed }) => [
                  styles.segment,
                  selected && [
                    styles.segmentSelected,
                    { backgroundColor: theme.surface, shadowColor: scheme === 'dark' ? '#000000' : '#737373' },
                  ],
                  pressed && styles.controlPressed,
                ]}>
                <Text style={[styles.segmentText, { color: selected ? theme.text : theme.textSecondary }]}>
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <InsetGroup style={styles.budgetGroup}>
          <View style={styles.budgetTop}>
            <View>
              <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Monthly Budget</Text>
              <Text style={[styles.budgetValue, { color: theme.text }]}>{formatMoney(meta.budget)}</Text>
            </View>
            <View style={styles.budgetRight}>
              <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Remaining</Text>
              <Text style={[styles.remainingValue, { color: theme.positive }]}>{formatMoney(remaining)}</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.progressFill, { backgroundColor: meta.color, width: `${progress * 100}%` }]} />
          </View>
          <Text style={[styles.progressDetail, { color: theme.textSecondary }]}>
            {Math.round(progress * 100)}% used · 6 days remaining
          </Text>
        </InsetGroup>

        <View style={styles.section}>
          <SectionHeader eyebrow={`Weekly average ${formatMoney(meta.spent / 4)}`} title="Spending History" />
          <InsetGroup style={styles.chartGroup}>
            <View style={styles.chart}>
              {weeklySpend.map((height, index) => (
                <View key={`${height}-${index}`} style={styles.barSlot}>
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: index === weeklySpend.length - 1 ? meta.color : `${meta.color}45`,
                        height: `${height}%`,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.chartAxis}>
              <Text style={[styles.axisText, { color: theme.textTertiary }]}>JUN</Text>
              <Text style={[styles.axisText, { color: theme.textTertiary }]}>JUL</Text>
              <Text style={[styles.axisText, { color: theme.textTertiary }]}>AUG</Text>
            </View>
          </InsetGroup>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Top Merchants" />
          <InsetGroup>
            {merchants.map((merchant, index) => (
              <Pressable
                key={merchant.name}
                onPress={() => Alert.alert(merchant.name, `${formatMoney(merchant.amount)} this month`)}
                style={({ pressed }) => [
                  styles.merchantRow,
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <View style={[styles.rank, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.rankText, { color: theme.textSecondary }]}>{index + 1}</Text>
                </View>
                <View
                  style={[
                    styles.merchantContent,
                    index < merchants.length - 1 && {
                      borderBottomColor: theme.border,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}>
                  <View style={styles.merchantCopy}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{merchant.name}</Text>
                    <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>{merchant.share}% of this category</Text>
                  </View>
                  <Text style={[styles.merchantAmount, { color: theme.text }]}>{formatMoney(merchant.amount)}</Text>
                  <SystemIcon color={theme.textTertiary} fallback="chevron-right" name="chevron.right" size={11} />
                </View>
              </Pressable>
            ))}
          </InsetGroup>
        </View>

        <View style={styles.section}>
          <SectionHeader
            action="See All"
            onAction={() => Alert.alert('Transactions', `All activity for ${meta.label} will live here.`)}
            title="Transactions"
          />
          <InsetGroup style={styles.transactionGroup}>
            {transactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                last={index === transactions.length - 1}
                transaction={transaction}
              />
            ))}
          </InsetGroup>
        </View>

        <InsetGroup>
          <Pressable
            onPress={() => Alert.alert('Category Rules', 'Automatic merchant and category rules will be configured here.')}
            style={({ pressed }) => [styles.ruleRow, pressed && { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.ruleIcon, { backgroundColor: theme.accentSoft }]}>
              <SystemIcon color={theme.accent} fallback="auto-fix-high" name="wand.and.stars" size={19} />
            </View>
            <View style={styles.ruleCopy}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Category Rules</Text>
              <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>Manage automatic categorization</Text>
            </View>
            <SystemIcon color={theme.textTertiary} fallback="chevron-right" name="chevron.right" size={11} />
          </Pressable>
        </InsetGroup>
      </NativeTabScrollView>
    </>
  );
}

function categorySymbol(account: string) {
  if (account === 'expenses:food') return 'fork.knife' as const;
  if (account === 'expenses:housing') return 'house.fill' as const;
  if (account === 'expenses:transport') return 'car.fill' as const;
  if (account === 'expenses:subscriptions') return 'repeat' as const;
  if (account === 'expenses:shopping') return 'bag.fill' as const;
  return 'tag.fill' as const;
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
  controlPressed: {
    opacity: 0.45,
  },
  metricHeader: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.one,
  },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 11,
    height: 44,
    justifyContent: 'center',
    marginBottom: Spacing.three,
    width: 44,
  },
  metricLabel: {
    fontSize: 13,
  },
  amount: {
    fontSize: 40,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: Spacing.two,
    marginTop: 1,
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
  budgetGroup: {
    padding: Spacing.four,
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  smallLabel: {
    fontSize: 13,
  },
  budgetValue: {
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    marginTop: 3,
  },
  remainingValue: {
    fontSize: 17,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    marginTop: 4,
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
  progressDetail: {
    fontSize: 11,
    marginTop: 7,
  },
  section: {
    gap: Spacing.three,
  },
  chartGroup: {
    padding: Spacing.four,
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 5,
    height: 126,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    minHeight: 8,
    width: '100%',
  },
  chartAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  axisText: {
    fontSize: 10,
    fontWeight: '600',
  },
  merchantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 64,
    paddingLeft: Spacing.four,
  },
  rank: {
    alignItems: 'center',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '600',
  },
  merchantContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    marginLeft: Spacing.three,
    minHeight: 64,
    paddingRight: Spacing.four,
  },
  merchantCopy: {
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
  merchantAmount: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  transactionGroup: {
    paddingHorizontal: Spacing.four,
  },
  ruleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 68,
    paddingHorizontal: Spacing.four,
  },
  ruleIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  ruleCopy: {
    flex: 1,
    gap: 3,
  },
});
