import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency, GlassSurface } from './src/components';
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
  const insets = useSafeAreaInsets();
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
      <View pointerEvents="none" style={styles.ambient}>
        <LinearGradient
          colors={['#080A12', '#0D1120', '#08090F']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.orbLime} />
        <View style={styles.orbBlue} />
        <View style={styles.orbPurple} />
      </View>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        {activeTab === 'Home' && <HomeScreen {...screenProps} />}
        {activeTab === 'Activity' && <ActivityScreen {...screenProps} />}
        {activeTab === 'Plan' && <PlanScreen {...screenProps} />}
        {activeTab === 'Insights' && <InsightsScreen {...screenProps} />}
      </Animated.View>

      <View style={[styles.navWrap, { bottom: Math.max(insets.bottom, 12) }]}>
        <GlassSurface style={styles.nav} tintColor="rgba(20,24,35,0.42)">
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
        </GlassSurface>
      </View>

      <Animated.View
        style={[
          styles.toastWrap,
          {
            pointerEvents: 'none',
            top: insets.top + 10,
            transform: [{ translateY: toastY }],
          },
        ]}
      >
        <GlassSurface style={styles.toast} tintColor="rgba(20,24,35,0.76)">
          <View style={styles.toastIcon}>
            <Ionicons color={colors.background} name="checkmark" size={13} />
          </View>
          <Text numberOfLines={1} style={styles.toastText}>{toast}</Text>
        </GlassSurface>
      </Animated.View>

      <Modal animationType="slide" onRequestClose={() => setAddOpen(false)} transparent visible={addOpen}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <Pressable onPress={() => setAddOpen(false)} style={StyleSheet.absoluteFill} />
          <GlassSurface style={styles.sheet} tintColor="rgba(14,17,26,0.94)">
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
          </GlassSurface>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setSelectedTransaction(null)} transparent visible={Boolean(selected)}>
        <View style={styles.modalBackdrop}>
          <Pressable onPress={() => setSelectedTransaction(null)} style={StyleSheet.absoluteFill} />
          {selected && (
            <GlassSurface style={[styles.sheet, styles.detailSheet]} tintColor="rgba(14,17,26,0.94)">
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
            </GlassSurface>
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
  ambient: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  orbLime: {
    backgroundColor: 'rgba(174,255,74,0.16)',
    borderRadius: 190,
    height: 380,
    position: 'absolute',
    right: -220,
    top: 60,
    width: 380,
  },
  orbBlue: {
    backgroundColor: 'rgba(67,142,255,0.13)',
    borderRadius: 170,
    height: 340,
    left: -220,
    position: 'absolute',
    top: 360,
    width: 340,
  },
  orbPurple: {
    backgroundColor: 'rgba(155,113,255,0.11)',
    borderRadius: 180,
    bottom: -130,
    height: 360,
    position: 'absolute',
    right: -160,
    width: 360,
  },
  content: { flex: 1 },
  navWrap: { left: 16, position: 'absolute', right: 16 },
  nav: {
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 31,
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: 8,
  },
  navItem: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: 3 },
  navIcon: { alignItems: 'center', borderRadius: 18, height: 29, justifyContent: 'center', width: 42 },
  navIconActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
  },
  navLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 9, marginTop: 1 },
  navLabelActive: { color: colors.text },
  toastWrap: {
    alignSelf: 'center',
    maxWidth: '88%',
    position: 'absolute',
  },
  toast: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  toastIcon: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  toastText: { color: colors.text, fontFamily: fonts.demi, fontSize: 12 },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.62)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
