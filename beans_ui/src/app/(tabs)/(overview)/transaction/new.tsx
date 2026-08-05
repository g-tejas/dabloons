import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { SystemIcon } from '@/components/finance/system-icon';
import {
  formatMoney,
  ledgerAccounts,
  type LedgerAccount,
  type LedgerAccountKind,
} from '@/constants/finance-data';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useLedger } from '@/context/ledger-context';

type PickingField = 'origin' | 'destination' | null;

const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'] as const;
const accountKindOrder: LedgerAccountKind[] = ['Asset', 'Expense', 'Income', 'Liability', 'Equity'];

export default function NewTransactionScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const router = useRouter();
  const params = useLocalSearchParams<{ origin?: string }>();
  const { addTransaction } = useLedger();
  const requestedOrigin = params.origin;
  const validOrigin = requestedOrigin && ledgerAccounts.some((account) => account.id === requestedOrigin)
    ? requestedOrigin
    : 'assets:checking';
  const [amountText, setAmountText] = useState('0');
  const [originId, setOriginId] = useState(validOrigin);
  const [destinationId, setDestinationId] = useState('expenses:food');
  const [description, setDescription] = useState('');
  const [picking, setPicking] = useState<PickingField>(null);
  const origin = ledgerAccounts.find((account) => account.id === originId)!;
  const destination = ledgerAccounts.find((account) => account.id === destinationId)!;
  const amount = Number(amountText) || 0;
  const canSave = amount > 0 && originId !== destinationId;

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

  function enterKey(key: (typeof keypad)[number]) {
    void Haptics.selectionAsync();
    if (key === 'delete') {
      setAmountText((current) => (current.length <= 1 ? '0' : current.slice(0, -1)));
      return;
    }
    if (key === '.') {
      setAmountText((current) => (current.includes('.') ? current : `${current}.`));
      return;
    }
    setAmountText((current) => {
      const decimals = current.split('.')[1];
      if (decimals?.length === 2 || current.replace('.', '').length >= 9) return current;
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

  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitle: false,
          title: 'New Transaction',
        }}
      />
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.amountBlock}>
            <Text style={[styles.overline, { color: theme.textSecondary }]}>AMOUNT</Text>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.62}
              numberOfLines={1}
              style={[styles.amount, { color: amount > 0 ? theme.text : theme.textTertiary }]}>
              {formatMoney(amount)}
            </Text>
            <Text style={[styles.currency, { color: theme.textSecondary }]}>USD</Text>
          </View>

          <View style={styles.accountFlow}>
            <AccountButton
              account={origin}
              label="FROM"
              onPress={() => setPicking('origin')}
            />
            <Pressable
              accessibilityLabel="Swap origin and destination"
              onPress={swapAccounts}
              style={({ pressed }) => [
                styles.swapButton,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <SystemIcon
                color={theme.accent}
                fallback="swap-vert"
                name="arrow.up.arrow.down"
                size={16}
                weight="semibold"
              />
            </Pressable>
            <AccountButton
              account={destination}
              label="TO"
              onPress={() => setPicking('destination')}
            />
          </View>

          <View
            style={[
              styles.descriptionWrap,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <SystemIcon
              color={theme.textTertiary}
              fallback="edit-note"
              name="text.alignleft"
              size={18}
            />
            <TextInput
              accessibilityLabel="Transaction description"
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textTertiary}
              returnKeyType="done"
              style={[styles.description, { color: theme.text }]}
              value={description}
            />
            <View style={[styles.kindBadge, { backgroundColor: `${destination.color}18` }]}>
              <Text style={[styles.kindText, { color: destination.color }]}>
                {destination.kind}
              </Text>
            </View>
          </View>

          <View style={styles.keypad}>
            {keypad.map((key) => (
              <Pressable
                accessibilityLabel={key === 'delete' ? 'Delete digit' : key}
                key={key}
                onPress={() => enterKey(key)}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
                ]}>
                {key === 'delete' ? (
                  <SystemIcon
                    color={theme.text}
                    fallback="backspace"
                    name="delete.left"
                    size={23}
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
              { backgroundColor: canSave ? theme.accent : theme.backgroundSelected },
              pressed && canSave && styles.savePressed,
            ]}>
            <Text style={styles.saveText}>
              {canSave ? `Add ${formatMoney(amount)} Transaction` : 'Enter an amount'}
            </Text>
          </Pressable>
          <Text style={[styles.ledgerNote, { color: theme.textTertiary }]}>
            Creates a balanced entry from {origin.name} to {destination.name}.
          </Text>
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setPicking(null)}
        presentationStyle="pageSheet"
        visible={picking !== null}>
        <View style={[styles.pickerScreen, { backgroundColor: theme.background }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
            <Pressable hitSlop={10} onPress={() => setPicking(null)}>
              <Text style={[styles.cancel, { color: theme.accent }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              {picking === 'origin' ? 'Origin Account' : 'Destination Account'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={styles.pickerContent}>
            {groupedAccounts.map((group) => (
              <View key={group.kind} style={styles.pickerSection}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  {group.kind.toUpperCase()}
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
                        <View style={[styles.optionIcon, { backgroundColor: `${account.color}18` }]}>
                          <SystemIcon
                            color={account.color}
                            fallback={account.icon}
                            name={account.symbol}
                            size={18}
                          />
                        </View>
                        <View style={styles.optionCopy}>
                          <Text style={[styles.optionName, { color: theme.text }]}>
                            {account.name}
                          </Text>
                          <Text style={[styles.optionDetail, { color: theme.textSecondary }]}>
                            {account.detail}
                          </Text>
                        </View>
                        {selected && (
                          <SystemIcon
                            color={theme.accent}
                            fallback="check"
                            name="checkmark"
                            size={16}
                            weight="bold"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function AccountButton({
  account,
  label,
  onPress,
}: {
  account: LedgerAccount;
  label: string;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.accountButton,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.flowIcon, { backgroundColor: `${account.color}18` }]}>
        <SystemIcon
          color={account.color}
          fallback={account.icon}
          name={account.symbol}
          size={19}
        />
      </View>
      <Text numberOfLines={1} style={[styles.accountName, { color: theme.text }]}>
        {account.name}
      </Text>
      <Text numberOfLines={1} style={[styles.accountKind, { color: theme.textSecondary }]}>
        {account.kind}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accountButton: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 5,
    minHeight: 116,
    padding: Spacing.three,
  },
  accountFlow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  accountGroup: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  accountKind: {
    fontSize: 11,
  },
  accountLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
  accountOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 62,
    paddingHorizontal: Spacing.four,
  },
  amount: {
    fontSize: 52,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -2.2,
  },
  amountBlock: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: Spacing.four,
  },
  cancel: {
    fontSize: 16,
  },
  content: {
    alignSelf: 'center',
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    paddingBottom: Spacing.seven,
    width: '100%',
  },
  currency: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
  description: {
    flex: 1,
    fontSize: 15,
    minHeight: 46,
  },
  descriptionWrap: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  flowIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerSpacer: {
    width: 48,
  },
  key: {
    alignItems: 'center',
    aspectRatio: 1.45,
    borderRadius: Radius.large,
    justifyContent: 'center',
    width: '30%',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  keyText: {
    fontSize: 27,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  kindBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  kindText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ledgerNote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
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
  overline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  pickerContent: {
    gap: Spacing.five,
    padding: Spacing.four,
    paddingBottom: Spacing.nine,
  },
  pickerHeader: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  pickerScreen: {
    flex: 1,
  },
  pickerSection: {
    gap: Spacing.two,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.68,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  savePressed: {
    transform: [{ scale: 0.98 }],
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  screen: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: Spacing.two,
  },
  swapButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
