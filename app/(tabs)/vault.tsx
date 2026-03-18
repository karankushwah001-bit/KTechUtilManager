import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormModal } from '@/components/FormModal';
import { SwipeableRow } from '@/components/SwipeableRow';
import COLORS from '@/constants/colors';
import { PasswordEntry, useApp } from '@/context/AppContext';

const PW_FIELDS = [
  { key: 'title', label: 'Title', placeholder: 'Gmail, Facebook, etc.' },
  { key: 'username', label: 'Username / Email', placeholder: 'user@example.com' },
  { key: 'password', label: 'Password', placeholder: 'Enter password', secureTextEntry: false },
  { key: 'url', label: 'Website URL', placeholder: 'https://example.com' },
  { key: 'notes', label: 'Notes', placeholder: 'Optional notes', multiline: true },
];

const emptyForm = { title: '', username: '', password: '', url: '', notes: '', userId: '' };

const ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  gmail: 'gmail',
  google: 'google',
  facebook: 'facebook',
  instagram: 'instagram',
  twitter: 'twitter',
  youtube: 'youtube',
  linkedin: 'linkedin',
  github: 'github',
  apple: 'apple',
  amazon: 'amazon',
  netflix: 'netflix',
  spotify: 'spotify',
  whatsapp: 'whatsapp',
  telegram: 'telegram',
};

function getIcon(title: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const key = title.toLowerCase().replace(/\s/g, '');
  return ICON_MAP[key] || 'key-variant';
}

function PasswordCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: PasswordEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(entry.password);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Password copied to clipboard!');
  };

  const displayPw = revealed ? entry.password : '•'.repeat(Math.min(entry.password.length, 14));

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={getIcon(entry.title)} size={24} color={COLORS.accentOrange} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{entry.title}</Text>
          {entry.username ? <Text style={styles.cardSub}>{entry.username}</Text> : null}
          <View style={styles.pwRow}>
            <Text style={styles.pwText} numberOfLines={1}>{displayPw}</Text>
            <TouchableOpacity onPress={() => setRevealed(p => !p)} style={styles.eyeBtn}>
              <MaterialCommunityIcons
                name={revealed ? 'eye-off' : 'eye'}
                size={14}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="content-copy" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </SwipeableRow>
  );
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { passwords, addPassword, updatePassword, deletePassword } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>(emptyForm);

  const openAdd = () => {
    setEditingId(null);
    setFormValues(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (entry: PasswordEntry) => {
    setEditingId(entry.id);
    setFormValues({
      title: entry.title,
      username: entry.username,
      password: entry.password,
      url: entry.url,
      notes: entry.notes,
      userId: entry.userId,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formValues.title?.trim() || !formValues.password?.trim()) {
      Alert.alert('Validation', 'Title and password are required.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const payload = {
      userId: formValues.userId || '',
      title: formValues.title,
      username: formValues.username || '',
      password: formValues.password,
      url: formValues.url || '',
      notes: formValues.notes || '',
    };
    if (editingId) {
      await updatePassword(editingId, payload);
    } else {
      await addPassword(payload);
    }
    setModalVisible(false);
  };

  const handleDelete = (entry: PasswordEntry) => {
    Alert.alert('Delete Password', `Delete "${entry.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deletePassword(entry.id);
        }
      },
    ]);
  };

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Password Vault</Text>
          <Text style={styles.headerSub}>{passwords.length} entries stored</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={passwords}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <PasswordCard
            entry={item}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="shield-off" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyText}>Vault is empty</Text>
            <Text style={styles.emptySubtext}>Tap + to store a password</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <FormModal
        visible={modalVisible}
        title={editingId ? 'Edit Password' : 'Add Password'}
        fields={PW_FIELDS}
        values={formValues}
        onChange={(k, v) => setFormValues(prev => ({ ...prev, [k]: v }))}
        onSubmit={handleSubmit}
        onClose={() => setModalVisible(false)}
        submitLabel={editingId ? 'Update' : 'Save Password'}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: COLORS.text },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 14, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  iconContainer: { width: 46, height: 46, borderRadius: 12, backgroundColor: COLORS.accentOrange + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accentOrange + '44' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: 3 },
  cardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: COLORS.textMuted, marginBottom: 4 },
  pwRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pwText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: COLORS.textDim, letterSpacing: 1, flex: 1 },
  eyeBtn: { padding: 2 },
  copyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '22', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: COLORS.textMuted },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: COLORS.textDim },
});
