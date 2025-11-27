import React, { useEffect, useState, useRef } from 'react';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import usersApi, { User, UserRole } from '../api/users';
import UserDetailModal from '../ui/UserDetailModal';
import UserEditModal from '../ui/UserEditModal';
import ConfirmModal from '../ui/ConfirmModal';

type Props = {};

export default function Manager(_props: Props) {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<any>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [data, setData] = useState<User[]>([]);
  const [filteredData, setFilteredData] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const users = await usersApi.getUsers();
      setData(users || []);
      setFilteredData(users || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  useEffect(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(u =>
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      );
      setFilteredData(filtered);
    }
  }, [debouncedSearch, data]);

  const onView = (u: User) => {
    setSelectedUser(u);
    setDetailVisible(true);
  };

  const onEdit = (u: User) => {
    setSelectedUser(u);
    setEditVisible(true);
  };

  const confirmAndDelete = async (id?: string | null) => {
    const target = id ?? toDeleteId;
    if (!target) return;
    setConfirmVisible(false);
    setToDeleteId(null);
    setLoading(true);
    try {
      await usersApi.deleteUser(target);
      fetchUsers();
    } catch (err) {
      console.error('Delete failed', err);
      Alert.alert('Erreur', "La suppression a échoué.");
    } finally {
      setLoading(false);
    }
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    setConfirmVisible(true);
  };

  // Génère couleur d'avatar basée sur le nom
  const getAvatarColor = (name: string) => {
    const colors = ['#1976d2', '#2e7d32', '#9c27b0', '#d32f2f', '#f57c00', '#0288d1', '#c2185b'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Génère initiales pour l'avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Role badge style
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { bg: '#ffebee', text: '#d32f2f' };
      case 'DOCTOR':
        return { bg: '#e3f2fd', text: '#1976d2' };
      case 'SECRETARY':
        return { bg: '#e8f5e9', text: '#2e7d32' };
      default:
        return { bg: '#f5f5f5', text: '#666' };
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'DOCTOR': return 'Médecin';
      case 'SECRETARY': return 'Secrétaire';
      default: return role;
    }
  };

  // Render pour tableau web
  const renderTableRow = ({ item }: { item: User }) => {
    const roleStyle = getRoleBadgeStyle(item.role);
    return (
      <View style={styles.tableRow}>
        <View style={styles.tableCell1}>
          <View style={[styles.avatarSmall, { backgroundColor: getAvatarColor(item.lastName || 'U') }]}>
            <Text style={styles.avatarSmallText}>{getInitials(item.firstName || 'U', item.lastName || '')}</Text>
          </View>
          <View>
            <Text style={styles.tableName}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.tableSubtext}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.tableCell2}>
          <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>{getRoleLabel(item.role)}</Text>
          </View>
        </View>
        <View style={styles.tableCell3}>
          <Text style={styles.tableText}>📞 {item.phoneNumber || 'N/A'}</Text>
        </View>
        <View style={styles.tableCell4}>
          <TouchableOpacity style={styles.tableBtnView} onPress={() => onView(item)}>
            <Text style={styles.tableBtnText}>👁️ Voir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tableBtnEdit} onPress={() => onEdit(item)}>
            <Text style={styles.tableBtnText}>✏️ Éditer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tableBtnDelete} onPress={() => askDelete(item._id)}>
            <Text style={styles.tableBtnDeleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render pour cards mobile
  const renderCard = ({ item }: { item: User }) => {
    const roleStyle = getRoleBadgeStyle(item.role);
    return (
      <Pressable 
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => onView(item)}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.lastName || 'U') }]}>
          <Text style={styles.avatarText}>{getInitials(item.firstName || 'U', item.lastName || '')}</Text>
        </View>

        {/* Infos utilisateur */}
        <View style={styles.cardContent}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={styles.cardSubRow}>
            <View style={[styles.roleBadgeSmall, { backgroundColor: roleStyle.bg }]}>
              <Text style={[styles.roleBadgeTextSmall, { color: roleStyle.text }]}>{getRoleLabel(item.role)}</Text>
            </View>
            <Text style={styles.infoText} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onView(item); }}
          >
            <Text style={styles.actionIcon}>👁️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onEdit(item); }}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteAction]}
            onPress={(e) => { e.stopPropagation(); askDelete(item._id); }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header avec recherche */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>👥 Gestion des Utilisateurs</Text>
        <Text style={styles.subtitle}>
          {filteredData.length} utilisateur{filteredData.length > 1 ? 's' : ''}
        </Text>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            ref={searchRef}
            placeholder="Rechercher un utilisateur..." 
            value={search} 
            onChangeText={setSearch} 
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      )}

      {/* Empty State */}
      {!loading && filteredData.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>Aucun utilisateur trouvé</Text>
          <Text style={styles.emptyText}>
            {search ? 'Essayez avec d\'autres mots-clés' : 'Commencez par ajouter votre premier utilisateur'}
          </Text>
        </View>
      )}

      {/* Liste web: tableau moderne */}
      {!loading && filteredData.length > 0 && isWeb && (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2.5 }]}>Utilisateur</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Rôle</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Téléphone</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.8 }]}>Actions</Text>
          </View>
          <FlatList 
            data={filteredData} 
            keyExtractor={u => u._id} 
            renderItem={renderTableRow}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Liste mobile: cards compactes */}
      {!loading && filteredData.length > 0 && !isWeb && (
        <FlatList 
          data={filteredData} 
          keyExtractor={u => u._id} 
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - Bouton flottant (mobile et web) */}
      <TouchableOpacity 
        style={[styles.fab, isWeb && styles.fabWeb]}
        onPress={() => { setSelectedUser(null); setEditVisible(true); }}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* Modals */}
      <UserDetailModal 
        visible={detailVisible} 
        user={selectedUser} 
        onClose={() => { setDetailVisible(false); setSelectedUser(null); }}
        onEdit={(u) => { setDetailVisible(false); setSelectedUser(u); setEditVisible(true); }}
      />
      
      <UserEditModal 
        visible={editVisible} 
        user={selectedUser} 
        creating={!selectedUser} 
        onClose={() => { setEditVisible(false); setSelectedUser(null); }} 
        onSaved={(updated) => { setEditVisible(false); setSelectedUser(null); fetchUsers(); }} 
      />
      
      <ConfirmModal 
        visible={confirmVisible} 
        title="Supprimer l'utilisateur" 
        message="Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible." 
        onConfirm={() => confirmAndDelete()} 
        onCancel={() => { setConfirmVisible(false); setToDeleteId(null); }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#212121',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  addButtonIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // === FAB - Bouton flottant ===
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 28,
    textAlign: 'center',
  },
  fabWeb: {
    bottom: 32,
    right: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  // === Mobile Cards - Compact === 
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: '#fafafa',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  roleBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  deleteAction: {
    backgroundColor: '#ffebee',
  },
  actionIcon: {
    fontSize: 14,
  },
  // === Web Table - Modern === 
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
  },
  tableCell1: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCell2: {
    flex: 1,
  },
  tableCell3: {
    flex: 1.5,
  },
  tableCell4: {
    flex: 1.8,
    flexDirection: 'row',
    gap: 6,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  tableName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  tableSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tableText: {
    fontSize: 13,
    color: '#666',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableBtnView: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  tableBtnEdit: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  tableBtnDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  tableBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tableBtnDeleteText: {
    fontSize: 14,
  },
});
