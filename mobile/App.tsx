import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { formatCurrency } from './src/components';
import { transactions } from './src/data';
import { ActivityScreen, HomeScreen, InsightsScreen, PlanScreen } from './src/screens';
import { colors, fonts, radii } from './src/theme';

type Tab = 'Home' | 'Activity' | 'Plan' | 'Insights';

const tabs: { label: Tab; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { label: 'Activity', icon: 'swap-horizontal-outline', activeIcon: 'swap-horizontal' },
  { label: 'Plan', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
  { label: 'Insights', icon: 'sparkles-outline', activeIcon: 'sparkles' },
];

function FinanceApp() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Food');
  const fade = useRef(new Animated.Value(1)).current;
  const toastY = useRef(new Animated.Value(-80)).current;

  const showToast = (message: string) => {
    setToast(message);
    toastY.stopAnimation();
    toastY.setValue(-80);
    Animated.sequence([
      Animated.spring(toastY, { damping: 16, stiffness: 210, toValue: 0, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastY, { duration: 220, toValue: -80, useNativeDriver: true }),
    ]).start();
  };

  const changeTab = (tab: Tab) => {
    if (tab === activeTab) return;
    Haptics.selectionAsync().catch(() => undefined);
    Animated.timing(fade, { duration: 110, toValue: 0, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(fade, { duration: 180, toValue: 1, useNativeDriver: true }).start();
    });
  };

  const saveTransaction = () => {
    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount)) {
      showToast('Enter an amount first');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setAddOpen(false);
    setAmount('');
    setNote('');
    showToast(`${formatCurrency(parsedAmount)} added to ${category}`);
  };

  const screenProps = {
    onAdd: () => setAddOpen(true),
    onTransactionPress: setSelectedTransaction,
    onToast: showToast,
  };

  const selected = transactions.find((item) => item.id === selectedTransaction);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <Animated.View style={[styles.content, { opacity: fade }]}>
        {activeTab === 'Home' && <HomeScreen {...screenProps} />}
        {activeTab === 'Activity' && <ActivityScreen {...screenProps} />}
        {activeTab === 'Plan' && <PlanScreen {...screenProps} />}
        {activeTab === 'Insights' && <InsightsScreen {...screenProps} />}
      </Animated.View>

      <View style={styles.navWrap}>
        <BlurView intensity={56} style={styles.nav} tint="dark">
          {tabs.map((tab) => {
            const active = tab.label === activeTab;
            return (
              <Pressable
                accessibilityLabel={tab.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                key={tab.label}
                onPress={() => changeTab(tab.label)}
                style={styles.navItem}
              >
                <View style={[styles.navIcon, active && styles.navIconActive]}>
                  <Ionicons
                    color={active ? colors.background : colors.muted}
                    name={active ? tab.activeIcon : tab.icon}
                    size={19}
                  />
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </BlurView>
      </View>

      <Animated.View style={[styles.toast, { pointerEvents: 'none', transform: [{ translateY: toastY }] }]}>
        <Ionicons color={colors.background} name="checkmark-circle" size={18} />
        <Text numberOfLines={1} style={styles.toastText}>{toast}</Text>
      </Animated.View>

      <Modal animationType="slide" onRequestClose={() => setAddOpen(false)} transparent visible={addOpen}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <Pressable onPress={() => setAddOpen(false)} style={StyleSheet.absoluteFill} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Pressable hitSlop={12} onPress={() => setAddOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>New transaction</Text>
              <Pressable hitSlop={12} onPress={saveTransaction}>
                <Text style={styles.save}>Save</Text>
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>AMOUNT</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                accessibilityLabel="Transaction amount"
                autoFocus
                keyboardType="decimal-pad"
                nativeID="transaction-amount"
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.subtle}
                selectionColor={colors.accent}
                style={styles.amountInput}
                value={amount}
              />
            </View>
            <Text style={styles.inputLabel}>CATEGORY</Text>
            <View style={styles.categoryChips}>
              {['Food', 'Shopping', 'Bills', 'Travel'].map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.inputLabel}>NOTE</Text>
            <TextInput
              accessibilityLabel="Transaction note"
              nativeID="transaction-note"
              onChangeText={setNote}
              placeholder="What was this for?"
              placeholderTextColor={colors.subtle}
              selectionColor={colors.accent}
              style={styles.noteInput}
              value={note}
            />
            <Pressable onPress={saveTransaction} style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}>
              <Text style={styles.saveButtonText}>Add transaction</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setSelectedTransaction(null)} transparent visible={Boolean(selected)}>
        <View style={styles.modalBackdrop}>
          <Pressable onPress={() => setSelectedTransaction(null)} style={StyleSheet.absoluteFill} />
          {selected && (
            <View style={[styles.sheet, styles.detailSheet]}>
              <View style={styles.handle} />
              <View style={[styles.detailIcon, { backgroundColor: `${selected.color}20` }]}>
                <Ionicons color={selected.color} name={selected.icon as keyof typeof Ionicons.glyphMap} size={28} />
              </View>
              <Text style={styles.detailMerchant}>{selected.merchant}</Text>
              <Text style={[styles.detailAmount, selected.amount > 0 && { color: colors.green }]}>
                {selected.amount > 0 ? '+' : ''}{formatCurrency(selected.amount)}
              </Text>
              <View style={styles.detailCard}>
                <DetailRow label="Status" value="Completed" />
                <DetailRow label="Category" value={selected.category} />
                <DetailRow label="Date" value={selected.date} last />
              </View>
              <Pressable onPress={() => setSelectedTransaction(null)} style={styles.detailDone}>
                <Text style={styles.detailDoneText}>Done</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailDivider]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FinanceApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1 },
  navWrap: { bottom: 18, left: 16, position: 'absolute', right: 16 },
  nav: {
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    height: 70,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  navItem: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: 5 },
  navIcon: { alignItems: 'center', borderRadius: 18, height: 31, justifyContent: 'center', width: 38 },
  navIconActive: { backgroundColor: colors.accent },
  navLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 9, marginTop: 2 },
  navLabelActive: { color: colors.text },
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 7,
    maxWidth: '86%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    top: 8,
  },
  toastText: { color: colors.background, fontFamily: fonts.demi, fontSize: 12 },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.62)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.subtle,
    borderRadius: 3,
    height: 4,
    marginBottom: 18,
    marginTop: 10,
    width: 38,
  },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  cancel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13 },
  save: { color: colors.accent, fontFamily: fonts.demi, fontSize: 13 },
  sheetTitle: { color: colors.text, fontFamily: fonts.demi, fontSize: 16 },
  inputLabel: { color: colors.muted, fontFamily: fonts.demi, fontSize: 9, letterSpacing: 1.2, marginBottom: 9 },
  amountInputRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 26 },
  currencySymbol: { color: colors.muted, fontFamily: fonts.demi, fontSize: 38, marginRight: 5 },
  amountInput: { color: colors.text, flex: 1, fontFamily: fonts.demi, fontSize: 42, letterSpacing: -1.5, padding: 0 },
  categoryChips: { flexDirection: 'row', gap: 7, marginBottom: 24 },
  categoryChip: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  categoryChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  categoryText: { color: colors.muted, fontFamily: fonts.demi, fontSize: 11 },
  categoryTextActive: { color: colors.background },
  noteInput: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginBottom: 22,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  saveButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 16 },
  buttonPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  saveButtonText: { color: colors.background, fontFamily: fonts.demi, fontSize: 14 },
  detailSheet: { alignItems: 'center', paddingBottom: 36 },
  detailIcon: { alignItems: 'center', borderRadius: 30, height: 60, justifyContent: 'center', marginTop: 10, width: 60 },
  detailMerchant: { color: colors.text, fontFamily: fonts.demi, fontSize: 17, marginTop: 13 },
  detailAmount: { color: colors.text, fontFamily: fonts.demi, fontSize: 34, letterSpacing: -1, marginTop: 6 },
  detailCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 15,
    width: '100%',
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  detailDivider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  detailLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 },
  detailValue: { color: colors.text, fontFamily: fonts.demi, fontSize: 12 },
  detailDone: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.pill, marginTop: 20, paddingVertical: 14, width: '100%' },
  detailDoneText: { color: colors.background, fontFamily: fonts.demi, fontSize: 13 },
});
