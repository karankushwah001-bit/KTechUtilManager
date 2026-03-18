import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import COLORS from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(): { day: string; date: string } {
  const now = new Date();
  return {
    day: DAYS[now.getDay()],
    date: `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
  };
}

interface StatCardProps {
  label: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress: () => void;
}

function StatCard({ label, value, icon, color, onPress }: StatCardProps) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[COLORS.bgCardAlt, COLORS.bgCard]}
        style={styles.statCardGradient}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '22' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { users, sims, passwords, isLoading } = useApp();
  const { day, date } = formatDate();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().split('T')[0];
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);
    const weekStr = weekLater.toISOString().split('T')[0];

    const activeSims = sims.filter(s => s.status === 'active').length;
    const needsRecharge = sims.filter(s =>
      s.status === 'expired' ||
      (s.nextBillingDate && s.nextBillingDate <= todayIso) ||
      (s.dueDate && s.dueDate <= todayIso)
    ).length;
    const billingKey = (s: typeof sims[0]) => s.nextBillingDate || s.dueDate || '';
    const dueToday = sims.filter(s => billingKey(s) === todayIso).length;
    const dueThisWeek = sims.filter(s => billingKey(s) >= todayIso && billingKey(s) <= weekStr).length;

    return { activeSims, dueToday, dueThisWeek, needsRecharge };
  }, [sims]);

  if (isLoading) {
    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]} style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <LinearGradient colors={[COLORS.primary, COLORS.accentPurple]} style={styles.logoBox}>
              <MaterialCommunityIcons name="lightning-bolt" size={22} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.appTitle}>KTech UtilManager</Text>
              <Text style={styles.appSubtitle}>Utility Dashboard</Text>
            </View>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dayText}>{day}</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.statsGrid}>
          <StatCard
            label="Total Users"
            value={users.length}
            icon="account-group"
            color={COLORS.primary}
            onPress={() => router.push('/(tabs)/users')}
          />
          <StatCard
            label="Total SIMs"
            value={sims.length}
            icon="sim"
            color={COLORS.accentPurple}
            onPress={() => router.push('/(tabs)/sims')}
          />
          <StatCard
            label="Active SIMs"
            value={stats.activeSims}
            icon="sim-alert"
            color={COLORS.accentGreen}
            onPress={() => router.push('/(tabs)/sims')}
          />
          <StatCard
            label="Due Today"
            value={stats.dueToday}
            icon="calendar-today"
            color={COLORS.accentRed}
            onPress={() => router.push('/(tabs)/sims')}
          />
          <StatCard
            label="Due This Week"
            value={stats.dueThisWeek}
            icon="calendar-week"
            color={COLORS.accentYellow}
            onPress={() => router.push('/(tabs)/sims')}
          />
          <StatCard
            label="Passwords"
            value={passwords.length}
            icon="shield-key"
            color={COLORS.accentOrange}
            onPress={() => router.push('/(tabs)/vault')}
          />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/users')} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.primary + '33', COLORS.primary + '11']} style={styles.quickBtnGradient}>
              <MaterialCommunityIcons name="account-plus" size={26} color={COLORS.primary} />
              <Text style={[styles.quickBtnText, { color: COLORS.primary }]}>Add User</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/sims')} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.accentPurple + '33', COLORS.accentPurple + '11']} style={styles.quickBtnGradient}>
              <MaterialCommunityIcons name="sim-outline" size={26} color={COLORS.accentPurple} />
              <Text style={[styles.quickBtnText, { color: COLORS.accentPurple }]}>Add SIM</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/vault')} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.accentOrange + '33', COLORS.accentOrange + '11']} style={styles.quickBtnGradient}>
              <MaterialCommunityIcons name="key-plus" size={26} color={COLORS.accentOrange} />
              <Text style={[styles.quickBtnText, { color: COLORS.accentOrange }]}>Add Password</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/settings')} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.accentGreen + '33', COLORS.accentGreen + '11']} style={styles.quickBtnGradient}>
              <MaterialCommunityIcons name="database-export" size={26} color={COLORS.accentGreen} />
              <Text style={[styles.quickBtnText, { color: COLORS.accentGreen }]}>Export Data</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {stats.needsRecharge > 0 && (
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons name="bell-ring" size={18} color={COLORS.accentRed} />
            <Text style={styles.alertText}>{stats.needsRecharge} SIM{stats.needsRecharge > 1 ? 's' : ''} need{stats.needsRecharge === 1 ? 's' : ''} recharge! Tap SIM tab.</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { paddingHorizontal: 16 },
  header: { marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  logoBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: COLORS.text },
  appSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginTop: 1 },
  dateBox: { backgroundColor: COLORS.bgCard + 'aa', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start' },
  dayText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: COLORS.primary },
  dateText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  statCardGradient: { padding: 16, alignItems: 'flex-start' },
  statIconContainer: { borderRadius: 10, padding: 8, marginBottom: 10 },
  statValue: { fontSize: 28, fontFamily: 'Inter_700Bold', color: COLORS.text, lineHeight: 34 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginTop: 4 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  quickBtn: { width: '47%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  quickBtnGradient: { padding: 16, alignItems: 'center', gap: 8 },
  quickBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.accentRed + '22', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.accentRed + '44' },
  alertText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.accentRed },
});
