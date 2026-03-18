import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeableRow } from '@/components/SwipeableRow';
import COLORS from '@/constants/colors';
import { SIMCard, useApp } from '@/context/AppContext';
import {
  PLAN_TYPE_LABELS,
  PlanType,
  calculateNextBillingDate,
  calculateReminderDate,
  formatDisplayDate,
  getDueBadge,
  todayStr,
} from '@/utils/billing';

const PLAN_TYPES: PlanType[] = ['monthly', 'quarterly', 'yearly', 'custom'];

const VENDOR_COLORS: Record<string, string> = {
  airtel: '#FF4444',
  jio: '#0066CC',
  vi: '#CC0088',
  bsnl: '#336600',
  idea: '#CC6600',
  vodafone: '#E60000',
};

function getVendorColor(vendor: string): string {
  return VENDOR_COLORS[vendor.toLowerCase()] || COLORS.accentPurple;
}

type FilterType = 'all' | 'active' | 'inactive' | 'expired';

interface SIMFormState {
  vendor: string;
  number: string;
  plan: string;
  planType: PlanType;
  purchaseDate: string;
  nextBillingDate: string;
  amount: string;
  status: 'active' | 'inactive' | 'expired';
  userId: string;
}

const emptyForm: SIMFormState = {
  vendor: '',
  number: '',
  plan: '',
  planType: 'monthly',
  purchaseDate: todayStr(),
  nextBillingDate: '',
  amount: '',
  status: 'active',
  userId: '',
};

function SIMFormModal({
  visible,
  title,
  initial,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  initial: SIMFormState;
  onSubmit: (values: SIMFormState) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<SIMFormState>(initial);

  React.useEffect(() => {
    if (visible) setForm(initial);
  }, [visible, initial]);

  const set = (key: keyof SIMFormState, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      if (key === 'planType' || key === 'purchaseDate') {
        const planType = key === 'planType' ? (value as PlanType) : prev.planType;
        const purchaseDate = key === 'purchaseDate' ? value : prev.purchaseDate;
        if (planType !== 'custom' && purchaseDate) {
          updated.nextBillingDate = calculateNextBillingDate(purchaseDate, planType);
        }
      }
      return updated;
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={fStyles.overlay}>
        <View style={[fStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={fStyles.handle} />
          <View style={fStyles.modalHeader}>
            <Text style={fStyles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={fStyles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Field label="Vendor Name">
              <TextInput
                style={fStyles.input}
                value={form.vendor}
                onChangeText={v => set('vendor', v)}
                placeholder="e.g. Airtel, Jio, VI, BSNL"
                placeholderTextColor={COLORS.textDim}
                autoCapitalize="words"
              />
            </Field>

            <Field label="SIM Number">
              <TextInput
                style={fStyles.input}
                value={form.number}
                onChangeText={v => set('number', v)}
                placeholder="9876543210"
                placeholderTextColor={COLORS.textDim}
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Plan Details">
              <TextInput
                style={fStyles.input}
                value={form.plan}
                onChangeText={v => set('plan', v)}
                placeholder="2GB/Day - Unlimited Calls"
                placeholderTextColor={COLORS.textDim}
              />
            </Field>

            <Field label="Amount (₹)">
              <TextInput
                style={fStyles.input}
                value={form.amount}
                onChangeText={v => set('amount', v)}
                placeholder="599"
                placeholderTextColor={COLORS.textDim}
                keyboardType="numeric"
              />
            </Field>

            <Field label="Billing Cycle">
              <View style={fStyles.optionRow}>
                {PLAN_TYPES.map(pt => (
                  <TouchableOpacity
                    key={pt}
                    style={[fStyles.optBtn, form.planType === pt && fStyles.optBtnActive]}
                    onPress={() => set('planType', pt)}
                  >
                    <Text style={[fStyles.optText, form.planType === pt && fStyles.optTextActive]}>
                      {PLAN_TYPE_LABELS[pt]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>

            <Field label="Purchase Date (YYYY-MM-DD)">
              <TextInput
                style={fStyles.input}
                value={form.purchaseDate}
                onChangeText={v => set('purchaseDate', v)}
                placeholder="2024-03-10"
                placeholderTextColor={COLORS.textDim}
              />
            </Field>

            <Field label={form.planType === 'custom' ? 'Next Billing Date (YYYY-MM-DD)' : 'Next Billing Date (Auto-Calculated)'}>
              {form.planType === 'custom' ? (
                <TextInput
                  style={fStyles.input}
                  value={form.nextBillingDate}
                  onChangeText={v => set('nextBillingDate', v)}
                  placeholder="2024-04-10"
                  placeholderTextColor={COLORS.textDim}
                />
              ) : (
                <View style={fStyles.autoCalcBox}>
                  <MaterialCommunityIcons name="auto-fix" size={16} color={COLORS.accentGreen} />
                  <Text style={fStyles.autoCalcText}>
                    {form.nextBillingDate
                      ? formatDisplayDate(form.nextBillingDate)
                      : 'Enter purchase date first'}
                  </Text>
                </View>
              )}
              {form.nextBillingDate ? (
                <Text style={fStyles.reminderNote}>
                  <MaterialCommunityIcons name="bell" size={11} color={COLORS.accentYellow} /> Reminder: {formatDisplayDate(calculateReminderDate(form.nextBillingDate))}
                </Text>
              ) : null}
            </Field>

            <Field label="Status">
              <View style={fStyles.optionRow}>
                {(['active', 'inactive', 'expired'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[fStyles.optBtn, form.status === s && fStyles.optBtnActive]}
                    onPress={() => set('status', s)}
                  >
                    <Text style={[fStyles.optText, form.status === s && fStyles.optTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
          </ScrollView>

          <TouchableOpacity
            style={fStyles.submitBtn}
            onPress={() => onSubmit(form)}
            activeOpacity={0.85}
          >
            <Text style={fStyles.submitText}>{title}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fStyles.fieldContainer}>
      <Text style={fStyles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SIMCardItem({
  sim,
  users,
  onEdit,
  onDelete,
  onRechargeDone,
}: {
  sim: SIMCard;
  users: { id: string; name: string }[];
  onEdit: () => void;
  onDelete: () => void;
  onRechargeDone: () => void;
}) {
  const owner = users.find(u => u.id === sim.userId);
  const badge = getDueBadge(sim.nextBillingDate || sim.dueDate, sim.status);
  const vendorColor = getVendorColor(sim.vendor);
  const needsRecharge =
    sim.status === 'expired' ||
    (sim.nextBillingDate && new Date(sim.nextBillingDate) <= new Date());

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      <View style={[styles.card, needsRecharge && styles.cardUrgent]}>
        {/* Vendor badge */}
        <LinearGradient
          colors={[vendorColor + '33', vendorColor + '11']}
          style={[styles.vendorBadge, { borderColor: vendorColor + '55' }]}
        >
          <MaterialCommunityIcons name="sim" size={18} color={vendorColor} />
          <Text style={[styles.vendorText, { color: vendorColor }]}>{sim.vendor}</Text>
        </LinearGradient>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardRow}>
            <Text style={styles.cardNumber}>{sim.number}</Text>
            {badge && (
              <View style={[styles.dueBadge, { backgroundColor: badge.color + '22' }]}>
                <Text style={[styles.dueBadgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            )}
          </View>

          {sim.plan ? <Text style={styles.cardPlan} numberOfLines={1}>{sim.plan}</Text> : null}

          <View style={styles.billingRow}>
            <MaterialCommunityIcons name="refresh" size={11} color={COLORS.textDim} />
            <Text style={styles.billingText}>
              {PLAN_TYPE_LABELS[sim.planType] || 'Monthly'}
            </Text>
            {sim.nextBillingDate ? (
              <>
                <Text style={styles.billingDot}>·</Text>
                <MaterialCommunityIcons name="calendar-arrow-right" size={11} color={COLORS.textDim} />
                <Text style={styles.billingText}>{formatDisplayDate(sim.nextBillingDate)}</Text>
              </>
            ) : null}
            {sim.amount ? (
              <>
                <Text style={styles.billingDot}>·</Text>
                <Text style={styles.billingText}>₹{sim.amount}</Text>
              </>
            ) : null}
          </View>

          {sim.reminderDate ? (
            <View style={styles.reminderRow}>
              <MaterialCommunityIcons name="bell-outline" size={11} color={COLORS.accentYellow} />
              <Text style={styles.reminderText}>Reminder: {formatDisplayDate(sim.reminderDate)}</Text>
            </View>
          ) : null}

          {owner ? (
            <Text style={styles.ownerText}>
              <MaterialCommunityIcons name="account" size={11} color={COLORS.textDim} /> {owner.name}
            </Text>
          ) : null}

          {needsRecharge && (
            <TouchableOpacity style={styles.rechargeBtn} onPress={onRechargeDone} activeOpacity={0.8}>
              <MaterialCommunityIcons name="lightning-bolt" size={14} color="#000" />
              <Text style={styles.rechargeBtnText}>Recharge Done</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.statusDot, { backgroundColor: sim.status === 'active' ? COLORS.accentGreen : COLORS.danger }]} />
      </View>
    </SwipeableRow>
  );
}

export default function SIMsScreen() {
  const insets = useSafeAreaInsets();
  const { sims, users, addSIM, updateSIM, deleteSIM, rechargeDone } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<SIMFormState>(emptyForm);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredSims = filter === 'all' ? sims : sims.filter(s => s.status === filter);

  const openAdd = () => {
    setEditingId(null);
    const today = todayStr();
    const nextBilling = calculateNextBillingDate(today, 'monthly');
    setInitialForm({ ...emptyForm, purchaseDate: today, nextBillingDate: nextBilling });
    setModalVisible(true);
  };

  const openEdit = (sim: SIMCard) => {
    setEditingId(sim.id);
    setInitialForm({
      vendor: sim.vendor,
      number: sim.number,
      plan: sim.plan,
      planType: sim.planType || 'monthly',
      purchaseDate: sim.purchaseDate || todayStr(),
      nextBillingDate: sim.nextBillingDate || sim.dueDate || '',
      amount: sim.amount,
      status: sim.status,
      userId: sim.userId,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (form: SIMFormState) => {
    if (!form.vendor.trim() || !form.number.trim()) {
      Alert.alert('Validation', 'Vendor and SIM number are required.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const reminderDate = form.nextBillingDate ? calculateReminderDate(form.nextBillingDate) : '';
    const payload = {
      userId: form.userId,
      vendor: form.vendor,
      number: form.number,
      plan: form.plan,
      planType: form.planType,
      purchaseDate: form.purchaseDate,
      nextBillingDate: form.nextBillingDate,
      reminderDate,
      dueDate: form.nextBillingDate,
      status: form.status,
      amount: form.amount,
    };
    if (editingId) {
      await updateSIM(editingId, payload);
    } else {
      await addSIM(payload);
    }
    setModalVisible(false);
  };

  const handleDelete = (sim: SIMCard) => {
    Alert.alert('Delete SIM', `Delete SIM ${sim.number}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteSIM(sim.id);
        }
      },
    ]);
  };

  const handleRechargeDone = async (sim: SIMCard) => {
    Alert.alert(
      'Recharge Done?',
      `Mark SIM ${sim.number} as recharged?\n\nNew billing cycle starts today.\nNext billing: ${formatDisplayDate(calculateNextBillingDate(todayStr(), sim.planType || 'monthly'))}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Recharged!',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await rechargeDone(sim.id);
          }
        },
      ]
    );
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'expired', label: 'Expired' },
  ];

  const expiredCount = sims.filter(s => s.status === 'expired').length;

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>SIM Manager</Text>
          <Text style={styles.headerSub}>{sims.length} SIMs · {expiredCount > 0 ? `${expiredCount} need recharge` : 'all up to date'}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
            {f.key === 'expired' && expiredCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{expiredCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredSims}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <SIMCardItem
            sim={item}
            users={users}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item)}
            onRechargeDone={() => handleRechargeDone(item)}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="sim-off" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyText}>No SIM cards</Text>
            <Text style={styles.emptySubtext}>Tap + to add a SIM card</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <SIMFormModal
        visible={modalVisible}
        title={editingId ? 'Update SIM' : 'Add SIM'}
        initial={initialForm}
        onSubmit={handleSubmit}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: COLORS.text },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 14, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 12, flexDirection: 'row' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard + '88' },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  filterText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.primary },
  filterBadge: { backgroundColor: COLORS.danger, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'flex-start' },
  cardUrgent: { borderColor: COLORS.danger + '66' },
  vendorBadge: { borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, gap: 4, minWidth: 60 },
  vendorText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  cardInfo: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  cardNumber: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: COLORS.text },
  dueBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  dueBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  cardPlan: { fontSize: 11, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginBottom: 5 },
  billingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 },
  billingText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: COLORS.textDim },
  billingDot: { fontSize: 11, color: COLORS.textDim },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  reminderText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: COLORS.accentYellow + 'cc' },
  ownerText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: COLORS.textDim, marginBottom: 6 },
  rechargeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accentGreen, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', marginTop: 4,
  },
  rechargeBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#000' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: COLORS.textMuted },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: COLORS.textDim },
});

const fStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: COLORS.text },
  closeBtn: { padding: 4 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.bgCardLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontFamily: 'Inter_400Regular', fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCardLight },
  optBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  optText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.textMuted },
  optTextActive: { color: COLORS.primary },
  autoCalcBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.accentGreen + '11', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.accentGreen + '33' },
  autoCalcText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: COLORS.accentGreen },
  reminderNote: { fontSize: 11, fontFamily: 'Inter_400Regular', color: COLORS.accentYellow, marginTop: 6, paddingLeft: 4 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  submitText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#000' },
});
