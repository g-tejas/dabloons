import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SystemIcon } from '@/components/finance/system-icon';
import {
  formatMoney,
  ledgerAccounts,
  type LedgerAccount,
  type LedgerAccountKind,
} from '@/constants/finance-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useLedger } from '@/context/ledger-context';

type PickingField = 'origin' | 'destination' | null;
type KeypadKey = (typeof keypad)[number];

const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'] as const;
const accountKindOrder: LedgerAccountKind[] = ['Asset', 'Expense', 'Income', 'Liability', 'Equity'];

export default function NewTransactionScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const router = useRouter();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ origin?: string }>();
  const { addTransaction } = useLedger();
  const requestedOrigin = params.origin;
  const initialOrigin =
    requestedOrigin && ledgerAccounts.some((account) => account.id === requestedOrigin)
      ? requestedOrigin
      : 'assets:checking';
  const [amountText, setAmountText] = useState('0');
  const [originId, setOriginId] = useState(initialOrigin);
  const [destinationId, setDestinationId] = useState('expenses:food');
  const [description, setDescription] = useState('');
  const [noteVisible, setNoteVisible] = useState(false);
  const [picking, setPicking] = useState<PickingField>(null);
  const origin = ledgerAccounts.find((account) => account.id === originId)!;
  const destination = ledgerAccounts.find((account) => account.id === destinationId)!;
  const amount = Number(amountText) || 0;
  const canSave = amount > 0 && originId !== destinationId;
  const compact = height < 740;

  const groupedAccounts = useMemo(
    () =>
      accountKindOrder
        .map((kind) => ({
          accounts: ledgerAccounts.filter((account) => account.kind === kind),
          kind,
        }))
        .filter((group) => group.accounts.length > 0),
    [],
  );

  function enterKey(key: KeypadKey) {
    void Haptics.selectionAsync();

    if (key === 'delete') {
      setAmountText((current) => {
        const next = current.slice(0, -1);
        return next.length === 0 ? '0' : next;
      });
      return;
    }

    if (key === '.') {
      setAmountText((current) => (current.includes('.') ? current : `${current}.`));
      return;
    }

    setAmountText((current) => {
      const decimals = current.split('.')[1];
      const digitCount = current.replace('.', '').length;
      if (decimals?.length === 2 || digitCount >= 9) return current;
      return current === '0' ? key : `${current}${key}`;
    });
  }

  function selectAccount(account: LedgerAccount) {
    void Haptics.selectionAsync();
    if (picking === 'origin') setOriginId(account.id);
    if (picking === 'destination') setDestinationId(account.id);
    setPicking(null);
  }

  function swapAccounts() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOriginId(destinationId);
    setDestinationId(originId);
  }

  function save() {
    if (!canSave) return;
    addTransaction({
      amount,
      description,
      destinationAccount: destinationId,
      originAccount: originId,
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  const inverseBackground = theme.text;
  const inverseText = theme.background;

  return (
    <>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}>
          <View style={styles.header}>
            <HeaderButton
              accessibilityLabel="Close"
              backgroundColor={theme.backgroundElement}
              color={theme.text}
              fallback="close"
              name="xmark"
              onPress={() => router.back()}
            />
            <Text style={[styles.headerTitle, { color: theme.text }]}>New transaction</Text>
            <HeaderButton
              accessibilityLabel={noteVisible ? 'Hide note' : 'Add note'}
              backgroundColor={noteVisible ? theme.text : theme.backgroundElement}
              color={noteVisible ? theme.background : theme.text}
              fallback="edit-note"
              name="text.badge.plus"
              onPress={() => setNoteVisible((current) => !current)}
            />
          </View>

          <View style={styles.content}>
            <View style={[styles.amountArea, compact && styles.amountAreaCompact]}>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                numberOfLines={1}
                style={[
                  styles.amount,
                  compact && styles.amountCompact,
                  { color: amount > 0 ? theme.text : theme.textTertiary },
                ]}>
                {formatEnteredAmount(amountText)}
              </Text>
              <Text style={[styles.amountCaption, { color: theme.textSecondary }]}>
                USD · {formatMoney(Math.max(origin.balance, 0))} available
              </Text>
            </View>

            <View style={styles.routeArea}>
              <View style={[styles.routeBar, { backgroundColor: inverseBackground }]}>
                <RouteAccount
                  account={origin}
                  inverseText={inverseText}
                  label="FROM"
                  onPress={() => setPicking('origin')}
                />
                <Pressable
                  accessibilityLabel="Swap origin and destination"
                  hitSlop={8}
                  onPress={swapAccounts}
                  style={({ pressed }) => [
                    styles.swapButton,
                    { backgroundColor: theme.background },
                    pressed && styles.buttonPressed,
                  ]}>
                  <SystemIcon
                    color={theme.text}
                    fallback="swap-horiz"
                    name="arrow.left.arrow.right"
                    size={15}
                    weight="semibold"
                  />
                </Pressable>
                <RouteAccount
                  account={destination}
                  align="right"
                  inverseText={inverseText}
                  label="TO"
                  onPress={() => setPicking('destination')}
                />
              </View>

              <View style={styles.routeMeta}>
                <Text style={[styles.routeMetaText, { color: theme.textSecondary }]}>
                  {origin.kind} → {destination.kind}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => setNoteVisible((current) => !current)}
                  style={({ pressed }) => pressed && styles.textPressed}>
                  <Text style={[styles.noteAction, { color: theme.text }]}>
                    {description ? 'Edit note' : 'Add note'}
                  </Text>
                </Pressable>
              </View>

              {noteVisible && (
                <View
                  style={[
                    styles.noteField,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}>
                  <TextInput
                    accessibilityLabel="Transaction note"
                    autoFocus
                    maxLength={60}
                    onChangeText={setDescription}
                    placeholder="What was this for?"
                    placeholderTextColor={theme.textTertiary}
                    returnKeyType="done"
                    style={[styles.noteInput, { color: theme.text }]}
                    value={description}
                  />
                </View>
              )}
            </View>

            <View style={[styles.keypad, compact && styles.keypadCompact]}>
              {keypad.map((key) => (
                <Pressable
                  accessibilityLabel={key === 'delete' ? 'Delete digit' : key}
                  key={key}
                  onPress={() => enterKey(key)}
                  style={({ pressed }) => [
                    styles.key,
                    compact && styles.keyCompact,
                    pressed && {
                      backgroundColor: theme.backgroundElement,
                      transform: [{ scale: 0.94 }],
                    },
                  ]}>
                  {key === 'delete' ? (
                    <SystemIcon
                      color={theme.text}
                      fallback="backspace"
                      name="delete.left"
                      size={24}
                      weight="medium"
                    />
                  ) : (
                    <Text style={[styles.keyText, { color: theme.text }]}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canSave}
              onPress={save}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: canSave ? theme.text : theme.backgroundElement,
                },
                pressed && canSave && styles.savePressed,
              ]}>
              <Text
                style={[
                  styles.saveText,
                  { color: canSave ? theme.background : theme.textTertiary },
                ]}>
                {canSave ? 'Add transaction' : 'Enter an amount'}
              </Text>
              {canSave && (
                <SystemIcon
                  color={theme.background}
                  fallback="arrow-forward"
                  name="arrow.right"
                  size={17}
                  weight="bold"
                />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        animationType="slide"
        onRequestClose={() => setPicking(null)}
        presentationStyle="pageSheet"
        visible={picking !== null}>
        <SafeAreaView
          edges={['bottom']}
          style={[styles.pickerScreen, { backgroundColor: theme.background }]}>
          <View style={styles.pickerHeader}>
            <View style={styles.pickerHeading}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>
                {picking === 'origin' ? 'Money from' : 'Money to'}
              </Text>
              <Text style={[styles.pickerSubtitle, { color: theme.textSecondary }]}>
                {picking === 'origin'
                  ? 'Choose the account funding this entry.'
                  : 'Choose an expense, asset, liability, income, or equity account.'}
              </Text>
            </View>
            <HeaderButton
              accessibilityLabel="Close account picker"
              backgroundColor={theme.backgroundElement}
              color={theme.text}
              fallback="close"
              name="xmark"
              onPress={() => setPicking(null)}
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.pickerContent}
            showsVerticalScrollIndicator={false}>
            {groupedAccounts.map((group) => (
              <View key={group.kind} style={styles.pickerSection}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  {group.kind}
                </Text>
                <View
                  style={[
                    styles.accountGroup,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  {group.accounts.map((account, index) => {
                    const selected =
                      picking === 'origin'
                        ? account.id === originId
                        : account.id === destinationId;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={account.id}
                        onPress={() => selectAccount(account)}
                        style={({ pressed }) => [
                          styles.accountOption,
                          index < group.accounts.length - 1 && {
                            borderBottomColor: theme.border,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                          },
                          pressed && { backgroundColor: theme.backgroundElement },
                        ]}>
                        <View
                          style={[styles.optionIcon, { backgroundColor: `${account.color}1F` }]}>
                          <SystemIcon
                            color={account.color}
                            fallback={account.icon}
                            name={account.symbol}
                            size={18}
                            weight="medium"
                          />
                        </View>
                        <View style={styles.optionCopy}>
                          <Text style={[styles.optionName, { color: theme.text }]}>
                            {account.name}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[styles.optionDetail, { color: theme.textSecondary }]}>
                            {account.detail}
                          </Text>
                        </View>
                        {selected ? (
                          <View style={[styles.check, { backgroundColor: theme.text }]}>
                            <SystemIcon
                              color={theme.background}
                              fallback="check"
                              name="checkmark"
                              size={13}
                              weight="bold"
                            />
                          </View>
                        ) : (
                          <Text style={[styles.optionBalance, { color: theme.textSecondary }]}>
                            {formatMoney(account.balance)}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function HeaderButton({
  accessibilityLabel,
  backgroundColor,
  color,
  fallback,
  name,
  onPress,
}: {
  accessibilityLabel: string;
  backgroundColor: string;
  color: string;
  fallback: 'close' | 'edit-note';
  name: 'xmark' | 'text.badge.plus';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerButton,
        { backgroundColor },
        pressed && styles.buttonPressed,
      ]}>
      <SystemIcon color={color} fallback={fallback} name={name} size={17} weight="semibold" />
    </Pressable>
  );
}

function RouteAccount({
  account,
  align = 'left',
  inverseText,
  label,
  onPress,
}: {
  account: LedgerAccount;
  align?: 'left' | 'right';
  inverseText: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityHint="Opens the account picker"
      accessibilityLabel={`${label === 'FROM' ? 'From' : 'To'} ${account.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.routeAccount,
        align === 'right' && styles.routeAccountRight,
        pressed && styles.routeAccountPressed,
      ]}>
      <Text style={[styles.routeLabel, { color: inverseText }]}>{label}</Text>
      <View style={[styles.routeNameRow, align === 'right' && styles.routeNameRowRight]}>
        {align === 'left' && <View style={[styles.accountDot, { backgroundColor: account.color }]} />}
        <Text
          numberOfLines={1}
          style={[styles.routeName, { color: inverseText }]}
          ellipsizeMode="tail">
          {shortAccountName(account.name)}
        </Text>
        {align === 'right' && <View style={[styles.accountDot, { backgroundColor: account.color }]} />}
      </View>
    </Pressable>
  );
}

function formatEnteredAmount(value: string) {
  const [whole = '0', fraction] = value.split('.');
  const formattedWhole = Number(whole || '0').toLocaleString('en-US');
  return `$${formattedWhole}${value.includes('.') ? `.${fraction ?? ''}` : ''}`;
}

function shortAccountName(name: string) {
  return name
    .replace('Everyday ', '')
    .replace('Emergency ', '')
    .replace('Owner ', '');
}

const styles = StyleSheet.create({
  accountDot: {
    borderRadius: 5,
    height: 7,
    width: 7,
  },
  accountGroup: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  accountOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 64,
    paddingHorizontal: Spacing.four,
  },
  amount: {
    fontSize: 60,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    letterSpacing: -3.2,
    lineHeight: 68,
    maxWidth: '100%',
  },
  amountArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 116,
    paddingHorizontal: Spacing.two,
  },
  amountAreaCompact: {
    minHeight: 90,
  },
  amountCaption: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  amountCompact: {
    fontSize: 50,
    lineHeight: 58,
  },
  buttonPressed: {
    opacity: 0.62,
    transform: [{ scale: 0.93 }],
  },
  check: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  content: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 520,
    paddingBottom: Spacing.one,
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: Spacing.four,
  },
  headerButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  key: {
    alignItems: 'center',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    width: '30%',
  },
  keyCompact: {
    height: 49,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
    rowGap: 2,
  },
  keypadCompact: {
    marginTop: 0,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  keyText: {
    fontSize: 26,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  noteAction: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteField: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  noteInput: {
    fontSize: 15,
    height: 46,
  },
  optionBalance: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionDetail: {
    fontSize: 12,
  },
  optionIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickerContent: {
    gap: Spacing.five,
    paddingBottom: Spacing.nine,
    paddingHorizontal: Spacing.four,
  },
  pickerHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.four,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  pickerHeading: {
    flex: 1,
    gap: 4,
  },
  pickerScreen: {
    flex: 1,
  },
  pickerSection: {
    gap: Spacing.two,
  },
  pickerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 300,
  },
  pickerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  routeAccount: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: Spacing.four,
  },
  routeAccountPressed: {
    opacity: 0.55,
  },
  routeAccountRight: {
    alignItems: 'flex-end',
    paddingLeft: 0,
    paddingRight: Spacing.four,
  },
  routeArea: {
    marginBottom: 2,
  },
  routeBar: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    flexDirection: 'row',
    height: 66,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.9,
    opacity: 0.48,
  },
  routeMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: Spacing.two,
  },
  routeMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  routeNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    maxWidth: '100%',
  },
  routeNameRowRight: {
    justifyContent: 'flex-end',
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.two,
    height: 54,
    justifyContent: 'center',
  },
  savePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
  },
  screen: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: Spacing.two,
  },
  swapButton: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  textPressed: {
    opacity: 0.5,
  },
});
