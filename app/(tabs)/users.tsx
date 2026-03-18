import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { User, useApp } from '@/context/AppContext';

const USER_FIELDS = [
  { key: 'name', label: 'Full Name', placeholder: 'Enter full name' },
  { key: 'phone', label: 'Phone Number', placeholder: '9876543210', keyboardType: 'phone-pad' as const },
  { key: 'email', label: 'Email', placeholder: 'user@example.com', keyboardType: 'email-address' as const },
  { key: 'address', label: 'Address', placeholder: 'Street, City, State', multiline: true },
];

function UserCard({ user, onEdit, onDelete }: { user: User; onEdit: () => void; onDelete: () => void }) {
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarColor = COLORS.primary;

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '44' }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{user.name}</Text>
          <Text style={styles.cardSub}>
            <MaterialCommunityIcons name="phone" size={11} color={COLORS.textMuted} /> {user.phone}
          </Text>
          {user.email ? (
            <Text style={styles.cardSub2}>
              <MaterialCommunityIcons name="email" size={11} color={COLORS.textDim} /> {user.email}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textDim} />
      </View>
    </SwipeableRow>
  );
}

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const { users, addUser, updateUser, deleteUser } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>(emptyForm);

  const openAdd = () => {
    setEditingId(null);
    setFormValues(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (user: User) => {
    setEditingId(user.id);
    setFormValues({ name: user.name, phone: user.phone, email: user.email, address: user.address });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formValues.name?.trim() || !formValues.phone?.trim()) {
      Alert.alert('Validation', 'Name and phone are required.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingId) {
      await updateUser(editingId, formValues);
    } else {
      await addUser(formValues as any);
    }
    setModalVisible(false);
  };

  const handleDelete = (user: User) => {
    Alert.alert('Delete User', `Delete ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteUser(user.id);
        }
      },
    ]);
  };

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Users</Text>
          <Text style={styles.headerSub}>{users.length} registered</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <UserCard user={item} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-off" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyText}>No users yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first user</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <FormModal
        visible={modalVisible}
        title={editingId ? 'Edit User' : 'Add User'}
        fields={USER_FIELDS}
        values={formValues}
        onChange={(k, v) => setFormValues(prev => ({ ...prev, [k]: v }))}
        onSubmit={handleSubmit}
        onClose={() => setModalVisible(false)}
        submitLabel={editingId ? 'Update User' : 'Add User'}
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
  separator: { height: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: 3 },
  cardSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: COLORS.textMuted },
  cardSub2: { fontSize: 11, fontFamily: 'Inter_400Regular', color: COLORS.textDim, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: COLORS.textMuted },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: COLORS.textDim },
});
