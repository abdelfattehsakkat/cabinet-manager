import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usersApi, { User, UserRole, CreateUserPayload, UpdateUserPayload } from '../api/users';

type Props = {
  visible: boolean;
  user?: User | null;
  creating?: boolean;
  onClose: () => void;
  onSaved?: (user: User) => void;
};

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'DOCTOR', label: 'Médecin' },
  { value: 'SECRETARY', label: 'Secrétaire' },
];

export default function UserEditModal({ visible, user, onClose, onSaved, creating = false }: Props) {
  const [form, setForm] = useState<Partial<User & { password: string }>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isWeb = windowWidth >= 768;

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => setWindowWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({ ...user, password: '' });
      return;
    }
    if (creating) {
      setForm({ role: 'DOCTOR' });
      return;
    }
  }, [user, creating]);

  useEffect(() => {
    if (visible && creating) {
      setForm({ role: 'DOCTOR' });
      setErrors({});
    }
  }, [visible, creating]);

  const getAvatarColor = (name?: string) => {
    if (!name) return '#2e7d32';
    const colors = ['#1976d2', '#2e7d32', '#9c27b0', '#d32f2f', '#f57c00', '#0288d1', '#c2185b'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.charAt(0) || '';
    const l = lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'U';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.firstName?.trim()) newErrors.firstName = 'Prénom requis';
    if (!form.lastName?.trim()) newErrors.lastName = 'Nom requis';
    if (!form.email?.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!form.role) newErrors.role = 'Rôle requis';
    
    // Password required only for creation, optional for edit but must be valid if provided
    if (creating && !form.password?.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (form.password && form.password.trim().length > 0 && form.password.length < 6) {
      newErrors.password = 'Min. 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      if (user) {
        // Update existing user
        const payload: UpdateUserPayload = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
          phoneNumber: form.phoneNumber,
          specialization: form.specialization,
        };
        // Include password only if provided
        if (form.password && form.password.trim().length >= 6) {
          payload.password = form.password;
        }
        const updated = await usersApi.updateUser(user._id, payload);
        onSaved?.(updated);
      } else {
        // Create new user
        const payload: CreateUserPayload = {
          firstName: form.firstName!,
          lastName: form.lastName!,
          email: form.email!,
          password: form.password!,
          role: form.role!,
          phoneNumber: form.phoneNumber,
          specialization: form.specialization,
        };
        const created = await usersApi.createUser(payload);
        onSaved?.(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Save failed', err);
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent={isWeb} onRequestClose={onClose}>
      <View style={[styles.backdrop, !isWeb && styles.backdropMobile]}>
        <View style={[styles.modal, isWeb ? styles.modalWeb : styles.modalMobile, !isWeb && { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(form.lastName || 'N') }]}>
              <Text style={styles.avatarText}>
                {getInitials(form.firstName, form.lastName)}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>
                {creating ? '👤 Nouvel Utilisateur' : '✏️ Modifier Utilisateur'}
              </Text>
              <Text style={styles.subtitle}>
                {creating ? 'Créer un nouveau compte' : `${form.firstName || ''} ${form.lastName || ''}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.headerCloseBtn} onPress={onClose}>
              <Text style={styles.headerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Row: Prénom / Nom */}
            <View style={styles.row}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Prénom *</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  value={form.firstName || ''}
                  onChangeText={(t) => setForm({ ...form, firstName: t })}
                  placeholder="Prénom"
                  placeholderTextColor="#999"
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Nom *</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  value={form.lastName || ''}
                  onChangeText={(t) => setForm({ ...form, lastName: t })}
                  placeholder="Nom"
                  placeholderTextColor="#999"
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>📧 Email *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={form.email || ''}
                onChangeText={(t) => setForm({ ...form, email: t })}
                placeholder="email@exemple.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password - required for creation, optional for edit */}
            <View style={styles.field}>
              <Text style={styles.label}>
                🔒 Mot de passe {creating ? '*' : '(optionnel)'}
              </Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={form.password || ''}
                onChangeText={(t) => setForm({ ...form, password: t })}
                placeholder={creating ? 'Min. 6 caractères' : 'Laisser vide pour ne pas changer'}
                placeholderTextColor="#999"
                secureTextEntry
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              {!creating && !errors.password && (
                <Text style={styles.hintText}>Laissez vide pour conserver le mot de passe actuel</Text>
              )}
            </View>

            {/* Role */}
            <View style={styles.field}>
              <Text style={styles.label}>👔 Rôle *</Text>
              <View style={styles.roleContainer}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.roleOption,
                      form.role === r.value && styles.roleOptionSelected,
                      r.value === 'ADMIN' && form.role === r.value && styles.roleAdmin,
                      r.value === 'DOCTOR' && form.role === r.value && styles.roleDoctor,
                      r.value === 'SECRETARY' && form.role === r.value && styles.roleSecretary,
                    ]}
                    onPress={() => setForm({ ...form, role: r.value })}
                  >
                    <Text style={[
                      styles.roleText,
                      form.role === r.value && styles.roleTextSelected,
                    ]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <Text style={styles.label}>📞 Téléphone</Text>
              <TextInput
                style={styles.input}
                value={form.phoneNumber || ''}
                onChangeText={(t) => setForm({ ...form, phoneNumber: t })}
                placeholder="+216 XX XXX XXX"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Specialization (only for doctors) */}
            {form.role === 'DOCTOR' && (
              <View style={styles.field}>
                <Text style={styles.label}>🩺 Spécialisation</Text>
                <TextInput
                  style={styles.input}
                  value={form.specialization || ''}
                  onChangeText={(t) => setForm({ ...form, specialization: t })}
                  placeholder="Ex: Cardiologie, Pédiatrie..."
                  placeholderTextColor="#999"
                />
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
              onPress={submit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {creating ? '✓ Créer' : '✓ Enregistrer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropMobile: {
    backgroundColor: '#f5f5f5',
  },
  modal: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  modalWeb: {
    width: 520,
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: 16,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }),
  },
  modalMobile: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  headerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCloseIcon: {
    fontSize: 18,
    color: '#666',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  fieldHalf: {
    flex: 1,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#212121',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  inputError: {
    borderColor: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  roleOptionSelected: {
    borderColor: '#1976d2',
  },
  roleAdmin: {
    backgroundColor: '#ffebee',
    borderColor: '#d32f2f',
  },
  roleDoctor: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  roleSecretary: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  roleTextSelected: {
    fontWeight: '700',
    color: '#212121',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  hintText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
