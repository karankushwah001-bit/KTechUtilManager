import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import COLORS from '@/constants/colors';

export interface FormField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  options?: string[];
}

interface FormModalProps {
  visible: boolean;
  title: string;
  fields: FormField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitLabel?: string;
}

export function FormModal({
  visible,
  title,
  fields,
  values,
  onChange,
  onSubmit,
  onClose,
  submitLabel = 'Save',
}: FormModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {fields.map(field => (
              <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {field.options ? (
                  <View style={styles.optionsRow}>
                    {field.options.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.optionBtn,
                          values[field.key] === opt && styles.optionBtnActive,
                        ]}
                        onPress={() => onChange(field.key, opt)}
                      >
                        <Text style={[
                          styles.optionText,
                          values[field.key] === opt && styles.optionTextActive,
                        ]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, field.multiline && styles.inputMultiline]}
                    value={values[field.key] || ''}
                    onChangeText={v => onChange(field.key, v)}
                    placeholder={field.placeholder || field.label}
                    placeholderTextColor={COLORS.textDim}
                    secureTextEntry={field.secureTextEntry}
                    keyboardType={field.keyboardType || 'default'}
                    multiline={field.multiline}
                    numberOfLines={field.multiline ? 3 : 1}
                    autoCapitalize="none"
                  />
                )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} activeOpacity={0.85}>
            <Text style={styles.submitText}>{submitLabel}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: COLORS.text },
  closeBtn: { padding: 4 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCardLight },
  optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  optionText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.textMuted },
  optionTextActive: { color: COLORS.primary },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  submitText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#000' },
});
