import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { User } from '../api/users';

type Props = {
  visible: boolean;
  user?: User | null;
  onClose: () => void;
  onEdit?: (user: User) => void;
};

export default function UserDetailModal({ visible, user, onClose, onEdit }: Props) {
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isWeb = windowWidth >= 768;

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => setWindowWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

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

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return { backgroundColor: '#d32f2f', color: '#fff' };
      case 'DOCTOR':
        return { backgroundColor: '#1976d2', color: '#fff' };
      case 'SECRETARY':
        return { backgroundColor: '#2e7d32', color: '#fff' };
      default:
        return { backgroundColor: '#9e9e9e', color: '#fff' };
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'DOCTOR':
        return 'Médecin';
      case 'SECRETARY':
        return 'Secrétaire';
      default:
        return role || '—';
    }
  };

  const formatDateTime = (date?: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const roleBadge = getRoleBadgeStyle(user?.role);

  return (
    <Modal visible={visible} animationType="slide" transparent={isWeb} onRequestClose={onClose}>
      <View style={[styles.backdrop, !isWeb && styles.backdropMobile]}>
        <View style={[styles.modal, isWeb ? styles.modalWeb : styles.modalMobile]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(user?.lastName) }]}>
              <Text style={styles.avatarText}>
                {getInitials(user?.firstName, user?.lastName)}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: roleBadge.backgroundColor }]}>
                <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>
                  {getRoleLabel(user?.role)}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.headerCloseBtn}
              onPress={onClose}
            >
              <Text style={styles.headerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCardsContainer}>
            {user?.email && (
              <View style={[styles.infoCard, styles.infoCardEmail]}>
                <Text style={styles.infoCardIcon}>📧</Text>
                <Text style={styles.infoCardLabel}>Email</Text>
                <Text style={styles.infoCardValue} numberOfLines={1}>{user.email}</Text>
              </View>
            )}
            {user?.phoneNumber && (
              <View style={[styles.infoCard, styles.infoCardPhone]}>
                <Text style={styles.infoCardIcon}>📞</Text>
                <Text style={styles.infoCardLabel}>Téléphone</Text>
                <Text style={styles.infoCardValue}>{user.phoneNumber}</Text>
              </View>
            )}
            {user?.specialization && (
              <View style={[styles.infoCard, styles.infoCardSpec]}>
                <Text style={styles.infoCardIcon}>🩺</Text>
                <Text style={styles.infoCardLabel}>Spécialisation</Text>
                <Text style={styles.infoCardValue}>{user.specialization}</Text>
              </View>
            )}
          </View>

          {/* Details Section */}
          <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Informations</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prénom</Text>
                <Text style={styles.detailValue}>{user?.firstName || '—'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nom</Text>
                <Text style={styles.detailValue}>{user?.lastName || '—'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{user?.email || '—'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Téléphone</Text>
                <Text style={styles.detailValue}>{user?.phoneNumber || '—'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rôle</Text>
                <Text style={styles.detailValue}>{getRoleLabel(user?.role)}</Text>
              </View>
              
              {user?.specialization && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Spécialisation</Text>
                  <Text style={styles.detailValue}>{user.specialization}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🕐 Dates</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Créé le</Text>
                <Text style={styles.detailValue}>{formatDateTime(user?.createdAt)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Modifié le</Text>
                <Text style={styles.detailValue}>{formatDateTime(user?.updatedAt)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
            {onEdit && user && (
              <TouchableOpacity 
                style={styles.editBtn} 
                onPress={() => { onClose(); onEdit(user); }}
              >
                <Text style={styles.editBtnText}>✏️ Modifier</Text>
              </TouchableOpacity>
            )}
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
    width: 500,
    maxWidth: '90%',
    maxHeight: '85%',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  infoCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoCardEmail: {
    backgroundColor: '#e3f2fd',
  },
  infoCardPhone: {
    backgroundColor: '#e8f5e9',
  },
  infoCardSpec: {
    backgroundColor: '#fff3e0',
  },
  infoCardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  infoCardLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginTop: 2,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    maxWidth: '60%',
    textAlign: 'right',
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
  closeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  editBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
