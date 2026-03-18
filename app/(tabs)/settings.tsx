import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import COLORS from '@/constants/colors';
import { PasswordEntry, SIMCard, User, useApp } from '@/context/AppContext';
import {
  exportPasswordsCSV,
  exportSIMsCSV,
  exportUsersCSV,
  saveBackupFile,
  saveFileToDownloads,
} from '@/utils/csvExport';
import {
  detectCSVType,
  parsePasswordsCSV,
  parseSIMsCSV,
  parseUsersCSV,
  pickAndReadCSV,
  pickAndReadJSON,
} from '@/utils/csvImport';

type LoadingKey = string | null;

interface SettingItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  loading?: boolean;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

function SettingItem({ icon, iconColor, label, sublabel, onPress, loading, rightIcon = 'chevron-right' }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7} disabled={!!loading}>
      <View style={[styles.itemIcon, { backgroundColor: iconColor + '22' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemLabel}>{label}</Text>
        {sublabel ? <Text style={styles.itemSub}>{sublabel}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <MaterialCommunityIcons name={rightIcon} size={18} color={COLORS.textDim} />
      )}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { users, sims, passwords, importUsers, importSIMs, importPasswords, replaceAll } = useApp();
  const [loadingKey, setLoadingKey] = useState<LoadingKey>(null);

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoadingKey(key);
    try {
      await fn();
    } finally {
      setLoadingKey(null);
    }
  };

  const handleExportUsers = () => withLoading('exportUsers', async () => {
    const csv = await exportUsersCSV(users);
    const filename = `Users_${new Date().toISOString().split('T')[0]}.csv`;
    const result = await saveFileToDownloads(filename, csv);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Export Successful', `Users.csv saved to Downloads folder.\n\n${users.length} records exported.`);
    } else {
      Alert.alert('Export Failed', result.error || 'Failed to export users');
    }
  });

  const handleExportSIMs = () => withLoading('exportSIMs', async () => {
    const csv = await exportSIMsCSV(sims);
    const filename = `SIMCards_${new Date().toISOString().split('T')[0]}.csv`;
    const result = await saveFileToDownloads(filename, csv);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Export Successful', `SIMCards.csv saved to Downloads folder.\n\n${sims.length} records exported.`);
    } else {
      Alert.alert('Export Failed', result.error || 'Failed to export SIM cards');
    }
  });

  const handleExportPasswords = () => withLoading('exportPasswords', async () => {
    const csv = await exportPasswordsCSV(passwords);
    const filename = `Passwords_${new Date().toISOString().split('T')[0]}.csv`;
    const result = await saveFileToDownloads(filename, csv);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Export Successful', `Passwords.csv saved to Downloads folder.\n\n${passwords.length} records exported.`);
    } else {
      Alert.alert('Export Failed', result.error || 'Failed to export passwords');
    }
  });

  const handleImport = () => withLoading('import', async () => {
    try {
      const file = await pickAndReadCSV();
      if (!file) return;
      const type = detectCSVType(file.content);
      if (type === 'unknown') {
        Alert.alert('Import Error', 'Invalid or unsupported CSV file. Please use the correct format for Users, SIMCards, or Passwords.');
        return;
      }
      if (type === 'users') {
        const data = parseUsersCSV(file.content);
        await importUsers(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Import Successful', `${data.length} user(s) imported successfully.`);
      } else if (type === 'sims') {
        const data = parseSIMsCSV(file.content);
        await importSIMs(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Import Successful', `${data.length} SIM card(s) imported successfully.`);
      } else if (type === 'passwords') {
        const data = parsePasswordsCSV(file.content);
        await importPasswords(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Import Successful', `${data.length} password(s) imported successfully.`);
      }
    } catch (err: any) {
      Alert.alert('Import Error', err?.message || 'Invalid or unsupported CSV file');
    }
  });

  const handleBackup = () => withLoading('backup', async () => {
    const backup = JSON.stringify({ users, sims, passwords, exportedAt: new Date().toISOString(), version: 1 }, null, 2);
    const result = await saveBackupFile(backup);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Backup Successful', `Full backup saved to Downloads.\n\nUsers: ${users.length}, SIMs: ${sims.length}, Passwords: ${passwords.length}`);
    } else {
      Alert.alert('Backup Failed', result.error || 'Failed to create backup');
    }
  });

  const handleRestore = () => withLoading('restore', async () => {
    try {
      const file = await pickAndReadJSON();
      if (!file) return;
      const backup = JSON.parse(file.content);
      if (!backup.users || !backup.sims || !backup.passwords) {
        Alert.alert('Restore Error', 'Invalid backup file format. Please select a valid KTech UtilManager backup.');
        return;
      }
      Alert.alert(
        'Restore Backup',
        `This will replace ALL current data:\n\nUsers: ${backup.users.length}\nSIMs: ${backup.sims.length}\nPasswords: ${backup.passwords.length}\n\nAre you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore', style: 'destructive', onPress: async () => {
              await replaceAll(backup.users as User[], backup.sims as SIMCard[], backup.passwords as PasswordEntry[]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Restore Successful', 'All data has been restored from backup!');
            }
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Restore Error', 'Could not read backup file. Please make sure it is a valid JSON backup.');
    }
  });

  const handleDownloadSamples = () => withLoading('samples', async () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    const nextMonthMinus1 = new Date(nextMonth); nextMonthMinus1.setDate(nextMonthMinus1.getDate() - 1);
    const reminderStr = nextMonthMinus1.toISOString().split('T')[0];

    const usersCsv = 'name,phone,email,address\nJohn Doe,9876543210,john@example.com,123 Main Street\nJane Smith,8765432109,jane@example.com,456 Park Avenue';
    const simsCsv = `userId,vendor,number,plan,planType,purchaseDate,nextBillingDate,reminderDate,dueDate,status,amount\n,Airtel,9876543210,2GB/Day Unlimited,monthly,${today},${nextMonthStr},${reminderStr},${nextMonthStr},active,599\n,Jio,8765432109,1.5GB/Day Calls,quarterly,${today},${nextMonthStr},${reminderStr},${nextMonthStr},active,399`;
    const passwordsCsv = 'userId,title,username,password,url,notes\n,Gmail,user@gmail.com,MyPass@123,https://mail.google.com,Primary email\n,Facebook,myusername,FB@Pass456,https://facebook.com,Social account';

    const r1 = await saveFileToDownloads('Users.csv', usersCsv);
    const r2 = await saveFileToDownloads('SIMCards.csv', simsCsv);
    const r3 = await saveFileToDownloads('Passwords.csv', passwordsCsv);

    const success = r1.success && r2.success && r3.success;
    if (success) {
      Alert.alert('Sample Files Downloaded', 'Users.csv, SIMCards.csv, and Passwords.csv have been saved to Downloads.');
    } else {
      Alert.alert('Download Note', 'Some files may not have saved. Please check your Downloads folder.');
    }
  });

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Import • Export • Backup</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="CSV Export">
          <SettingItem
            icon="account-arrow-right"
            iconColor={COLORS.primary}
            label="Export Users"
            sublabel={`${users.length} records → Downloads/Users.csv`}
            onPress={handleExportUsers}
            loading={loadingKey === 'exportUsers'}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="sim-outline"
            iconColor={COLORS.accentPurple}
            label="Export SIM Cards"
            sublabel={`${sims.length} records → Downloads/SIMCards.csv`}
            onPress={handleExportSIMs}
            loading={loadingKey === 'exportSIMs'}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-key-outline"
            iconColor={COLORS.accentOrange}
            label="Export Passwords"
            sublabel={`${passwords.length} records → Downloads/Passwords.csv`}
            onPress={handleExportPasswords}
            loading={loadingKey === 'exportPasswords'}
          />
        </Section>

        <Section title="CSV Import">
          <SettingItem
            icon="file-import-outline"
            iconColor={COLORS.accentGreen}
            label="Import CSV File"
            sublabel="Auto-detects Users, SIM Cards, or Passwords"
            onPress={handleImport}
            loading={loadingKey === 'import'}
          />
        </Section>

        <Section title="Sample Files">
          <SettingItem
            icon="file-download-outline"
            iconColor={COLORS.accentYellow}
            label="Download Sample CSVs"
            sublabel="Get Users.csv, SIMCards.csv, Passwords.csv"
            onPress={handleDownloadSamples}
            loading={loadingKey === 'samples'}
          />
        </Section>

        <Section title="Backup & Restore">
          <SettingItem
            icon="database-export-outline"
            iconColor={COLORS.primary}
            label="Create Full Backup"
            sublabel="Save all data as JSON to Downloads"
            onPress={handleBackup}
            loading={loadingKey === 'backup'}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="database-import-outline"
            iconColor={COLORS.accentRed}
            label="Restore from Backup"
            sublabel="Load a .json backup file"
            onPress={handleRestore}
            loading={loadingKey === 'restore'}
          />
        </Section>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            On Android: files are saved directly to your Downloads folder (media permission required). On web/browser: files download automatically via your browser. On iOS: files are shared via the native share sheet.
          </Text>
        </View>

        <View style={styles.appInfo}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color={COLORS.primary} />
          <Text style={styles.appInfoTitle}>KTech UtilManager</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0 • Fully Offline</Text>
          <Text style={styles.appInfoVersion}>Android 10–16 Compatible</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: COLORS.text },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginTop: 2 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  itemIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: COLORS.text },
  itemSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.primary + '11', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.primary + '33' },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, lineHeight: 18 },
  appInfo: { alignItems: 'center', gap: 4, paddingVertical: 20 },
  appInfoTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: COLORS.text },
  appInfoVersion: { fontSize: 12, fontFamily: 'Inter_400Regular', color: COLORS.textDim },
});
