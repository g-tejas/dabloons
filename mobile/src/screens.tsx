import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ActionButton,
  formatCurrency,
  GlassSurface,
  IconButton,
  LineChart,
  SectionHeader,
  TransactionRow,
} from './components';
import { accounts, balanceHistory, budgets, categories, transactions } from './data';
import { colors, fonts, radii } from './theme';

type ScreenProps = {
  onAdd: () => void;
  onTransactionPress: (id: string) => void;
  onToast: (message: string) => void;
};

function ScreenHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      <View>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function HomeScreen({ onAdd, onTransactionPress, onToast }: ScreenProps) {
  const [period, setPeriod] = useState('1M');
  const [inspectedBalance, setInspectedBalance] = useState<number | null>(null);
  const values = balanceHistory[period];
  const shownBalance = inspectedBalance ?? values[values.length - 1];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.homeHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>D</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.homeGreeting}>
          <Text style={styles.eyebrow}>GOOD MORNING</Text>
          <Text style={styles.greeting}>Your money, at a glance</Text>
        </View>
        <IconButton accessibilityLabel="Notifications" name="notifications-outline" onPress={() => onToast('You’re all caught up')} />
      </View>

      <GlassSurface style={styles.heroCard} tintColor="rgba(42,49,62,0.28)">
        <LinearGradient
          colors={['rgba(205,255,106,0.09)', 'rgba(78,143,255,0.03)', 'transparent']}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.balanceBlock}>
          <View style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <View style={styles.privateBadge}>
              <Ionicons color={colors.muted} name="eye-outline" size={11} />
              <Text style={styles.privateText}>Private</Text>
            </View>
          </View>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.balance}>
            {formatCurrency(shownBalance)}
          </Text>
          <View style={styles.changeRow}>
            <View style={styles.changeBadge}>
              <Ionicons color={colors.green} name="arrow-up" size={12} />
              <Text style={styles.changeText}>4.8%</Text>
            </View>
            <Text style={styles.changeCaption}>+$1,094 this month</Text>
          </View>
        </View>

        <View style={styles.chartWrap}>
          <LineChart height={148} values={values} onValueChange={setInspectedBalance} />
          <View style={styles.periodRow}>
            {Object.keys(balanceHistory).map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item}
                onPress={() => setPeriod(item)}
                style={[styles.period, period === item && styles.periodActive]}
              >
                <Text style={[styles.periodText, period === item && styles.periodTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </GlassSurface>

      <GlassSurface style={styles.actionsRow} tintColor="rgba(20,24,35,0.24)">
        <ActionButton icon="add" label="Add" onPress={onAdd} />
        <ActionButton icon="paper-plane-outline" label="Send" onPress={() => onToast('Transfers are coming soon')} />
        <ActionButton icon="scan-outline" label="Scan" onPress={() => onToast('Receipt scanner preview')} />
        <ActionButton icon="ellipsis-horizontal" label="More" onPress={() => onToast('More actions')} />
      </GlassSurface>

      <View style={styles.section}>
        <SectionHeader action="Manage" onPress={() => onToast('Account management')} title="Accounts" />
        <ScrollView
          contentContainerStyle={styles.accountRail}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {accounts.map((account, index) => (
            <GlassSurface
              key={account.id}
              style={[styles.accountCard, { borderColor: `${account.color}52` }]}
              tintColor={`${account.color}12`}
            >
              <LinearGradient
                colors={[`${account.color}1F`, 'rgba(12,14,22,0.28)', `${account.color}08`]}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
                start={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.accountTop}>
                <View style={[styles.accountGlyph, { backgroundColor: account.color }]}>
                  <Ionicons color={colors.background} name={index === 2 ? 'trending-up' : 'wallet-outline'} size={17} />
                </View>
                <Text style={styles.accountNumber}>{account.number}</Text>
              </View>
              <Text style={styles.accountKind}>{account.kind.toUpperCase()}</Text>
              <Text style={styles.accountBalance}>{formatCurrency(account.balance)}</Text>
              <View style={styles.accountBottom}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={[styles.accountChange, { color: account.color }]}>{account.change}</Text>
              </View>
            </GlassSurface>
          ))}
          <Pressable onPress={onAdd} style={styles.addAccountCard}>
            <View style={styles.addCircle}>
              <Ionicons color={colors.accent} name="add" size={22} />
            </View>
            <Text style={styles.addAccountText}>Add account</Text>
          </Pressable>
        </ScrollView>
      </View>

      <GlassSurface style={styles.insightCard} tintColor="rgba(199,255,89,0.08)">
        <View style={styles.insightIcon}>
          <Ionicons color={colors.accent} name="sparkles" size={18} />
        </View>
        <View style={styles.insightCopy}>
          <Text style={styles.insightEyebrow}>WEEKLY PULSE</Text>
          <Text style={styles.insightTitle}>You spent 12% less than last week</Text>
          <Text style={styles.insightMeta}>Dining out made the biggest difference.</Text>
        </View>
        <Ionicons color={colors.muted} name="chevron-forward" size={18} />
      </GlassSurface>

      <View style={styles.section}>
        <SectionHeader action="See all" title="Recent activity" />
        {transactions.slice(0, 4).map((item) => (
          <TransactionRow item={item} key={item.id} onPress={() => onTransactionPress(item.id)} />
        ))}
      </View>
    </ScrollView>
  );
}

export function ActivityScreen({ onAdd, onTransactionPress }: ScreenProps) {
  const [filter, setFilter] = useState('All');
  const filtered = transactions.filter((item) => {
    if (filter === 'Income') return item.amount > 0;
    if (filter === 'Spent') return item.amount < 0;
    return true;
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        eyebrow="AUGUST 2026"
        right={<IconButton accessibilityLabel="Search activity" name="search-outline" />}
        title="Activity"
      />
      <GlassSurface style={styles.activitySummary} tintColor="rgba(90,120,180,0.08)">
        <View>
          <Text style={styles.summaryLabel}>MONEY IN</Text>
          <Text style={[styles.summaryValue, { color: colors.green }]}>+$3,980</Text>
        </View>
        <View style={styles.summaryRule} />
        <View>
          <Text style={styles.summaryLabel}>MONEY OUT</Text>
          <Text style={styles.summaryValue}>−$1,732</Text>
        </View>
      </GlassSurface>
      <View style={styles.filterRow}>
        {['All', 'Spent', 'Income'].map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.dateDivider}>
        <Text style={styles.dateText}>THIS WEEK</Text>
        <Text style={styles.dateTotal}>+$3,843.78</Text>
      </View>
      {filtered.map((item) => (
        <TransactionRow item={item} key={item.id} onPress={() => onTransactionPress(item.id)} />
      ))}
      <Pressable accessibilityRole="button" onPress={onAdd} style={styles.fullButton}>
        <Ionicons color={colors.background} name="add" size={19} />
        <Text style={styles.fullButtonText}>Add transaction</Text>
      </Pressable>
    </ScrollView>
  );
}

export function PlanScreen({ onToast }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        eyebrow="AUGUST PLAN"
        right={<IconButton accessibilityLabel="Budget settings" name="options-outline" onPress={() => onToast('Budget settings')} />}
        title="Your spending plan"
      />
      <GlassSurface style={styles.planHero} tintColor="rgba(199,255,89,0.11)">
        <LinearGradient
          colors={['rgba(199,255,89,0.15)', 'rgba(77,107,43,0.04)', 'transparent']}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.planHeroTop}>
          <Text style={styles.planLabel}>LEFT TO SPEND</Text>
          <View style={styles.onTrackPill}>
            <View style={styles.onTrackDot} />
            <Text style={styles.onTrackText}>On track</Text>
          </View>
        </View>
        <Text style={styles.planValue}>$1,064</Text>
        <Text style={styles.planMeta}>$2,236 spent of $3,300 · 18 days left</Text>
        <View style={styles.heroProgress}>
          <View style={[styles.progressFill, { width: '68%', backgroundColor: colors.accent }]} />
        </View>
      </GlassSurface>

      <View style={styles.section}>
        <SectionHeader action="Edit" onPress={() => onToast('Budget editor')} title="Categories" />
        <GlassSurface style={styles.budgetCard} tintColor="rgba(60,72,92,0.08)">
          {budgets.map((budget, index) => {
            const percent = Math.min((budget.spent / budget.limit) * 100, 100);
            return (
              <View key={budget.id} style={[styles.budgetRow, index > 0 && styles.budgetDivider]}>
                <View style={[styles.budgetIcon, { backgroundColor: `${budget.color}20` }]}>
                  <Ionicons color={budget.color} name={budget.icon as keyof typeof Ionicons.glyphMap} size={20} />
                </View>
                <View style={styles.budgetCopy}>
                  <View style={styles.budgetTextRow}>
                    <Text style={styles.budgetName}>{budget.label}</Text>
                    <Text style={styles.budgetNumbers}>
                      {formatCurrency(budget.spent, 0)} <Text style={styles.budgetLimit}>/ {formatCurrency(budget.limit, 0)}</Text>
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: budget.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </GlassSurface>
      </View>

      <GlassSurface style={styles.goalCard} tintColor="rgba(169,152,255,0.12)">
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.goalEyebrow}>SAVINGS GOAL</Text>
            <Text style={styles.goalTitle}>Japan trip</Text>
          </View>
          <Text style={styles.goalPercent}>68%</Text>
        </View>
        <Text style={styles.goalValue}>$4,420 <Text style={styles.goalLimit}>of $6,500</Text></Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '68%', backgroundColor: colors.purple }]} />
        </View>
      </GlassSurface>
    </ScrollView>
  );
}

export function InsightsScreen({ onToast }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        eyebrow="MONTHLY REPORT"
        right={<IconButton accessibilityLabel="Export report" name="share-outline" onPress={() => onToast('Report ready to share')} />}
        title="August insights"
      />
      <GlassSurface style={styles.insightHero} tintColor="rgba(72,110,170,0.08)">
        <Text style={styles.insightHeroLabel}>TOTAL SPENT</Text>
        <Text style={styles.insightHeroValue}>$1,732.48</Text>
        <View style={styles.insightComparison}>
          <Ionicons color={colors.green} name="trending-down" size={14} />
          <Text style={styles.insightComparisonText}>12% lower than July</Text>
        </View>
        <View style={styles.categoryBar}>
          {categories.map((category) => (
            <View
              key={category.label}
              style={{ backgroundColor: category.color, flex: category.percent, height: 8 }}
            />
          ))}
        </View>
        <View style={styles.legendGrid}>
          {categories.map((category) => (
            <View key={category.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: category.color }]} />
              <View>
                <Text style={styles.legendLabel}>{category.label}</Text>
                <Text style={styles.legendValue}>{formatCurrency(category.amount, 0)} · {category.percent}%</Text>
              </View>
            </View>
          ))}
        </View>
      </GlassSurface>

      <View style={styles.section}>
        <SectionHeader title="Cash flow" />
        <GlassSurface style={styles.cashflowCard} tintColor="rgba(199,255,89,0.05)">
          <View style={styles.cashflowHeader}>
            <View>
              <Text style={styles.cashflowLabel}>NET THIS MONTH</Text>
              <Text style={styles.cashflowValue}>+$2,247.52</Text>
            </View>
            <View style={styles.changeBadge}>
              <Text style={styles.changeText}>+18%</Text>
            </View>
          </View>
          <LineChart height={120} interactive={false} values={[12, 28, 21, 43, 39, 62, 58, 84]} />
        </GlassSurface>
      </View>

      <Pressable onPress={() => onToast('Nice work — keep it going!')} style={styles.coachCard}>
        <View style={styles.coachIcon}>
          <Ionicons color={colors.background} name="leaf" size={20} />
        </View>
        <View style={styles.coachCopy}>
          <Text style={styles.coachEyebrow}>SMART NUDGE</Text>
          <Text style={styles.coachTitle}>Your subscriptions are down $24</Text>
          <Text style={styles.coachBody}>That’s $288 a year back in your pocket.</Text>
        </View>
        <Ionicons color={colors.muted} name="arrow-forward" size={18} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 128, paddingHorizontal: 18, paddingTop: 10 },
  homeHeader: { alignItems: 'center', flexDirection: 'row', marginBottom: 22, paddingHorizontal: 2, paddingTop: 2 },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: { color: colors.background, fontFamily: fonts.demi, fontSize: 18 },
  onlineDot: {
    backgroundColor: colors.green,
    borderColor: colors.background,
    borderRadius: 6,
    borderWidth: 2,
    bottom: 0,
    height: 11,
    position: 'absolute',
    right: 0,
    width: 11,
  },
  homeGreeting: { flex: 1, gap: 2, marginLeft: 12 },
  eyebrow: { color: colors.muted, fontFamily: fonts.demi, fontSize: 10, letterSpacing: 1.35 },
  greeting: { color: colors.text, fontFamily: fonts.demi, fontSize: 15 },
  heroCard: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 30,
    marginBottom: 14,
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 24,
  },
  balanceBlock: { alignItems: 'center', marginBottom: 2 },
  balanceLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  balanceLabel: { color: colors.muted, fontFamily: fonts.demi, fontSize: 11, letterSpacing: 1.4 },
  privateBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  privateText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 9 },
  balance: { color: colors.text, fontFamily: fonts.demi, fontSize: 43, letterSpacing: -2.2, marginTop: 8 },
  changeRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  changeBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(66,220,112,0.14)',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeText: { color: colors.green, fontFamily: fonts.demi, fontSize: 11 },
  changeCaption: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11 },
  chartWrap: { marginTop: 4 },
  periodRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 0 },
  period: { borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 7 },
  periodActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  periodText: { color: colors.subtle, fontFamily: fonts.demi, fontSize: 11 },
  periodTextActive: { color: colors.text },
  actionsRow: {
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  section: { marginBottom: 30 },
  accountRail: { gap: 12, paddingRight: 20 },
  accountCard: {
    borderRadius: radii.lg,
    height: 190,
    padding: 19,
    width: 278,
  },
  accountTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  accountGlyph: { alignItems: 'center', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  accountNumber: { color: colors.muted, fontFamily: fonts.mono, fontSize: 10 },
  accountKind: { color: colors.muted, fontFamily: fonts.demi, fontSize: 9, letterSpacing: 1.2, marginTop: 20 },
  accountBalance: { color: colors.text, fontFamily: fonts.demi, fontSize: 27, letterSpacing: -0.8, marginTop: 4 },
  accountBottom: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' },
  accountName: { color: colors.text, fontFamily: fonts.medium, fontSize: 13 },
  accountChange: { fontFamily: fonts.medium, fontSize: 9 },
  addAccountCard: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 190,
    justifyContent: 'center',
    width: 132,
  },
  addCircle: {
    alignItems: 'center',
    backgroundColor: colors.accentDark,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  addAccountText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11, marginTop: 10 },
  insightCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flexDirection: 'row',
    marginBottom: 30,
    padding: 16,
  },
  insightIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentDark,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  insightCopy: { flex: 1, gap: 3, marginHorizontal: 12 },
  insightEyebrow: { color: colors.accent, fontFamily: fonts.demi, fontSize: 8, letterSpacing: 1 },
  insightTitle: { color: colors.text, fontFamily: fonts.demi, fontSize: 13 },
  insightMeta: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10 },
  screenHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, marginTop: 6 },
  pageTitle: { color: colors.text, fontFamily: fonts.demi, fontSize: 29, letterSpacing: -1, marginTop: 3 },
  activitySummary: {
    borderRadius: radii.lg,
    flexDirection: 'row',
    marginBottom: 20,
    padding: 20,
  },
  summaryLabel: { color: colors.muted, fontFamily: fonts.demi, fontSize: 9, letterSpacing: 1 },
  summaryValue: { color: colors.text, fontFamily: fonts.demi, fontSize: 20, marginTop: 6 },
  summaryRule: { backgroundColor: colors.border, marginHorizontal: 24, width: 1 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  filterChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  filterText: { color: colors.muted, fontFamily: fonts.demi, fontSize: 12 },
  filterTextActive: { color: colors.background },
  dateDivider: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 8 },
  dateText: { color: colors.subtle, fontFamily: fonts.demi, fontSize: 9, letterSpacing: 1.1 },
  dateTotal: { color: colors.green, fontFamily: fonts.demi, fontSize: 10 },
  fullButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 15,
  },
  fullButtonText: { color: colors.background, fontFamily: fonts.demi, fontSize: 14 },
  planHero: { borderRadius: 30, marginBottom: 30, padding: 22 },
  planHeroTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  planLabel: { color: '#A6B88A', fontFamily: fonts.demi, fontSize: 9, letterSpacing: 1.2 },
  onTrackPill: {
    alignItems: 'center',
    backgroundColor: '#1B2811',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  onTrackDot: { backgroundColor: colors.accent, borderRadius: 4, height: 6, width: 6 },
  onTrackText: { color: colors.accent, fontFamily: fonts.demi, fontSize: 9 },
  planValue: { color: colors.text, fontFamily: fonts.demi, fontSize: 39, letterSpacing: -1.5, marginTop: 16 },
  planMeta: { color: '#A6B88A', fontFamily: fonts.medium, fontSize: 11, marginTop: 4 },
  heroProgress: { backgroundColor: '#354423', borderRadius: 5, height: 7, marginTop: 20, overflow: 'hidden' },
  progressFill: { borderRadius: 5, height: '100%' },
  budgetCard: {
    borderRadius: radii.lg,
    paddingHorizontal: 16,
  },
  budgetRow: { alignItems: 'center', flexDirection: 'row', paddingVertical: 16 },
  budgetDivider: { borderTopColor: colors.border, borderTopWidth: 1 },
  budgetIcon: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  budgetCopy: { flex: 1, marginLeft: 12 },
  budgetTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  budgetName: { color: colors.text, fontFamily: fonts.demi, fontSize: 13 },
  budgetNumbers: { color: colors.text, fontFamily: fonts.demi, fontSize: 11 },
  budgetLimit: { color: colors.muted, fontFamily: fonts.medium },
  progressTrack: { backgroundColor: colors.surfaceSoft, borderRadius: 5, height: 6, overflow: 'hidden' },
  goalCard: {
    borderRadius: radii.lg,
    padding: 20,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  goalEyebrow: { color: colors.purple, fontFamily: fonts.demi, fontSize: 9, letterSpacing: 1.1 },
  goalTitle: { color: colors.text, fontFamily: fonts.demi, fontSize: 17, marginTop: 3 },
  goalPercent: { color: colors.purple, fontFamily: fonts.demi, fontSize: 19 },
  goalValue: { color: colors.text, fontFamily: fonts.demi, fontSize: 15, marginBottom: 12, marginTop: 22 },
  goalLimit: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11 },
  insightHero: {
    borderRadius: radii.xl,
    marginBottom: 30,
    padding: 22,
  },
  insightHeroLabel: { color: colors.muted, fontFamily: fonts.demi, fontSize: 9, letterSpacing: 1.1 },
  insightHeroValue: { color: colors.text, fontFamily: fonts.demi, fontSize: 35, letterSpacing: -1, marginTop: 7 },
  insightComparison: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 6 },
  insightComparisonText: { color: colors.green, fontFamily: fonts.medium, fontSize: 11 },
  categoryBar: { borderRadius: 5, flexDirection: 'row', gap: 3, marginTop: 24, overflow: 'hidden' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, rowGap: 16 },
  legendItem: { alignItems: 'center', flexDirection: 'row', width: '50%' },
  legendDot: { borderRadius: 5, height: 8, marginRight: 8, width: 8 },
  legendLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 11 },
  legendValue: { color: colors.muted, fontFamily: fonts.regular, fontSize: 9, marginTop: 1 },
  cashflowCard: {
    borderRadius: radii.lg,
    padding: 18,
  },
  cashflowHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cashflowLabel: { color: colors.muted, fontFamily: fonts.demi, fontSize: 8, letterSpacing: 1 },
  cashflowValue: { color: colors.text, fontFamily: fonts.demi, fontSize: 22, marginTop: 3 },
  coachCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  coachIcon: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  coachCopy: { flex: 1, gap: 2, marginHorizontal: 12 },
  coachEyebrow: { color: colors.accent, fontFamily: fonts.demi, fontSize: 8, letterSpacing: 1 },
  coachTitle: { color: colors.text, fontFamily: fonts.demi, fontSize: 13 },
  coachBody: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10 },
});
