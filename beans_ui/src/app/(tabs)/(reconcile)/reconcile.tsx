import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { CategoryPill } from '@/components/finance/category-pill';
import { InsetGroup } from '@/components/finance/inset-group';
import { SectionHeader } from '@/components/finance/section-header';
import { SystemIcon } from '@/components/finance/system-icon';
import { formatMoney, reconciliationItems, type ReconciliationItem } from '@/constants/finance-data';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

type Filter = 'All' | 'Categories' | 'Other';

const filters: Filter[] = ['All', 'Categories', 'Other'];
const checklist = [
  { label: 'Checking statement', detail: 'Matched through August 30', done: true },
  { label: 'Credit card statements', detail: '4 transactions need review', done: false },
  { label: 'Income and transfers', detail: 'No differences found', done: true },
];

export default function ReconcileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [expandedId, setExpandedId] = useState<string | null>(reconciliationItems[0].id);
  const [resolved, setResolved] = useState<string[]>([]);

  const remaining = reconciliationItems.length - resolved.length;
  const completion = Math.min(100, Math.round(72 + resolved.length * 5.6));
  const visibleItems = useMemo(
    () =>
      reconciliationItems.filter((item) => {
        if (resolved.includes(item.id)) return false;
        if (activeFilter === 'Categories') return item.issue === 'Needs category';
        if (activeFilter === 'Other') return item.issue !== 'Needs category';
        return true;
      }),
    [activeFilter, resolved],
  );

  function filterCount(filter: Filter) {
    return reconciliationItems.filter((item) => {
      if (resolved.includes(item.id)) return false;
      if (filter === 'Categories') return item.issue === 'Needs category';
      if (filter === 'Other') return item.issue !== 'Needs category';
      return true;
    }).length;
  }

  function toggleItem(id: string) {
    void Haptics.selectionAsync();
    setExpandedId((current) => (current === id ? null : id));
  }

  function resolveItem(item: ReconciliationItem) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setResolved((current) => [...current, item.id]);
    setExpandedId(null);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityLabel="About reconciliation"
              hitSlop={10}
              onPress={() => Alert.alert('Reconciliation', 'Review anything that differs from your bank statements before closing the month.')}
              style={({ pressed }) => pressed && styles.controlPressed}>
              <SystemIcon color={theme.accent} fallback="info-outline" name="info.circle" size={24} />
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
        <InsetGroup style={styles.statusGroup}>
          <View style={styles.statusTop}>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusTitle, { color: theme.text }]}>August 2026</Text>
              <Text style={[styles.statusDetail, { color: theme.textSecondary }]}>
                {remaining} {remaining === 1 ? 'item' : 'items'} remaining
              </Text>
            </View>
            <View style={[styles.readyBadge, { backgroundColor: theme.warningSoft }]}>
              <Text style={[styles.readyValue, { color: theme.warning }]}>{completion}%</Text>
              <Text style={[styles.readyLabel, { color: theme.warning }]}>READY</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${completion}%` }]} />
          </View>
          <View style={styles.statusFooter}>
            <View style={styles.statusMeta}>
              <SystemIcon color={theme.positive} fallback="check-circle" name="checkmark.circle.fill" size={15} />
              <Text style={[styles.statusMetaText, { color: theme.textSecondary }]}>2 statements matched</Text>
            </View>
            <Text style={[styles.dueText, { color: theme.warning }]}>Due in 3 days</Text>
          </View>
        </InsetGroup>

        <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundElement }]}>
          {filters.map((filter) => {
            const selected = filter === activeFilter;
            return (
              <Pressable
                key={filter}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setActiveFilter(filter);
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
                  {filter} {filterCount(filter)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <SectionHeader eyebrow="Tap a transaction to review the difference." title="Needs Review" />
          {visibleItems.length > 0 ? (
            <InsetGroup>
              {visibleItems.map((item, index) => {
                const expanded = expandedId === item.id;
                return (
                  <View key={item.id}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => toggleItem(item.id)}
                      style={({ pressed }) => [
                        styles.itemRow,
                        pressed && { backgroundColor: theme.backgroundElement },
                      ]}>
                      <View style={[styles.itemIcon, { backgroundColor: issueBackground(item, theme) }]}>
                        <SystemIcon
                          color={issueColor(item, theme)}
                          fallback={issueFallback(item)}
                          name={issueSymbol(item)}
                          size={18}
                        />
                      </View>
                      <View
                        style={[
                          styles.itemContent,
                          !expanded && index < visibleItems.length - 1 && {
                            borderBottomColor: theme.border,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                          },
                        ]}>
                        <View style={styles.itemCopy}>
                          <Text numberOfLines={1} style={[styles.merchant, { color: theme.text }]}>
                            {item.merchant}
                          </Text>
                          <Text numberOfLines={1} style={[styles.itemDetail, { color: theme.textSecondary }]}>
                            {item.issue} · {item.date.split(' · ')[0]}
                          </Text>
                        </View>
                        <Text style={[styles.amount, { color: theme.text }]}>{formatMoney(item.amount)}</Text>
                        <SystemIcon
                          color={theme.textTertiary}
                          fallback={expanded ? 'expand-less' : 'chevron-right'}
                          name={expanded ? 'chevron.down' : 'chevron.right'}
                          size={11}
                          weight="semibold"
                        />
                      </View>
                    </Pressable>
                    {expanded && (
                      <View
                        style={[
                          styles.expandedPanel,
                          {
                            backgroundColor: theme.surfaceMuted,
                            borderBottomColor: theme.border,
                          },
                        ]}>
                        <Text style={[styles.explanation, { color: theme.textSecondary }]}>{item.detail}</Text>
                        {item.suggestedAccount && (
                          <View style={styles.suggestionRow}>
                            <Text style={[styles.suggestionLabel, { color: theme.textSecondary }]}>Suggested category</Text>
                            <CategoryPill account={item.suggestedAccount} />
                          </View>
                        )}
                        <View style={styles.actions}>
                          <Pressable
                            onPress={() => Alert.alert(item.merchant, 'The detailed transaction inspector is ready for a future pass.')}
                            style={({ pressed }) => [
                              styles.secondaryButton,
                              { backgroundColor: theme.backgroundElement },
                              pressed && styles.buttonPressed,
                            ]}>
                            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Review Details</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => resolveItem(item)}
                            style={({ pressed }) => [
                              styles.primaryButton,
                              { backgroundColor: theme.accent },
                              pressed && styles.buttonPressed,
                            ]}>
                            <SystemIcon color="#FFFFFF" fallback="check" name="checkmark" size={13} weight="bold" />
                            <Text style={styles.primaryButtonText}>Looks Right</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </InsetGroup>
          ) : (
            <InsetGroup style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.positiveSoft }]}>
                <SystemIcon color={theme.positive} fallback="done-all" name="checkmark.circle.fill" size={30} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing to review</Text>
              <Text style={[styles.emptyDetail, { color: theme.textSecondary }]}>
                {remaining === 0 ? 'August is fully reconciled.' : 'Choose another filter to see the remaining items.'}
              </Text>
            </InsetGroup>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Month-End Checklist" />
          <InsetGroup>
            {checklist.map((task, index) => (
              <Pressable
                key={task.label}
                onPress={() => Alert.alert(task.label, task.detail)}
                style={({ pressed }) => [
                  styles.checklistRow,
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <SystemIcon
                  color={task.done ? theme.positive : theme.warning}
                  fallback={task.done ? 'check-circle' : 'radio-button-unchecked'}
                  name={task.done ? 'checkmark.circle.fill' : 'circle'}
                  size={21}
                />
                <View
                  style={[
                    styles.checklistContent,
                    index < checklist.length - 1 && {
                      borderBottomColor: theme.border,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}>
                  <View style={styles.checklistCopy}>
                    <Text style={[styles.checklistTitle, { color: theme.text }]}>{task.label}</Text>
                    <Text style={[styles.checklistDetail, { color: theme.textSecondary }]}>{task.detail}</Text>
                  </View>
                  <SystemIcon color={theme.textTertiary} fallback="chevron-right" name="chevron.right" size={11} />
                </View>
              </Pressable>
            ))}
          </InsetGroup>
        </View>
      </ScrollView>
    </>
  );
}

function issueColor(item: ReconciliationItem, theme: (typeof Colors)[keyof typeof Colors]) {
  if (item.issue === 'Possible duplicate') return theme.danger;
  if (item.issue === 'Amount mismatch') return theme.warning;
  if (item.issue === 'New merchant') return theme.lavender;
  return theme.accent;
}

function issueBackground(item: ReconciliationItem, theme: (typeof Colors)[keyof typeof Colors]) {
  if (item.issue === 'Possible duplicate') return theme.dangerSoft;
  if (item.issue === 'Amount mismatch') return theme.warningSoft;
  if (item.issue === 'New merchant') return theme.lavenderSoft;
  return theme.accentSoft;
}

function issueSymbol(item: ReconciliationItem) {
  if (item.issue === 'Possible duplicate') return 'doc.on.doc.fill' as const;
  if (item.issue === 'Amount mismatch') return 'exclamationmark.triangle.fill' as const;
  if (item.issue === 'New merchant') return 'storefront.fill' as const;
  return 'tag.fill' as const;
}

function issueFallback(item: ReconciliationItem) {
  if (item.issue === 'Possible duplicate') return 'content-copy' as const;
  if (item.issue === 'Amount mismatch') return 'warning' as const;
  if (item.issue === 'New merchant') return 'storefront' as const;
  return 'label' as const;
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
  statusGroup: {
    padding: Spacing.four,
  },
  statusTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.four,
  },
  statusCopy: {
    flex: 1,
    gap: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.35,
  },
  statusDetail: {
    fontSize: 13,
  },
  readyBadge: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  readyValue: {
    fontSize: 17,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  readyLabel: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.7,
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
  statusFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  statusMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  statusMetaText: {
    fontSize: 12,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '600',
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
  controlPressed: {
    opacity: 0.45,
  },
  section: {
    gap: Spacing.three,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 68,
    paddingLeft: Spacing.four,
  },
  itemIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  itemContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    marginLeft: Spacing.three,
    minHeight: 68,
    paddingRight: Spacing.three,
  },
  itemCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  itemDetail: {
    fontSize: 12,
  },
  amount: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  expandedPanel: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.four,
    padding: Spacing.four,
    paddingLeft: 62,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 19,
  },
  suggestionRow: {
    alignItems: 'flex-start',
    gap: 7,
  },
  suggestionLabel: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.seven,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: Spacing.three,
  },
  emptyDetail: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  checklistRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 64,
    paddingLeft: Spacing.four,
  },
  checklistContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginLeft: Spacing.three,
    minHeight: 64,
    paddingRight: Spacing.four,
  },
  checklistCopy: {
    flex: 1,
    gap: 3,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  checklistDetail: {
    fontSize: 12,
  },
});
