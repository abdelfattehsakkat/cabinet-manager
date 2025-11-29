import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarMenus, getHamburgerMenus, shouldShowMoreButton } from '../config/menuConfig';
import ProfileMenu from './ProfileMenu';

type Props = {
  active: string;
  onChange: (route: string) => void;
  userPermissions?: string[];
  onLogout?: () => void;
};

/**
 * TabBar mobile avec support extensible pour menus supplémentaires
 * 
 * Caractéristiques :
 * - Affiche jusqu'à 4-5 menus principaux dans le tab bar
 * - Bouton "Plus" automatique si plus de menus configurés
 * - Bouton Profil avec modal pour déconnexion
 * - Architecture extensible via menuConfig.ts
 */
export default function TabBar({ active, onChange, userPermissions, onLogout }: Props) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const insets = useSafeAreaInsets();
  
  const tabBarMenus = getTabBarMenus(userPermissions);
  const hamburgerMenus = getHamburgerMenus(userPermissions);
  const showMoreButton = shouldShowMoreButton() && hamburgerMenus.length > 0;

  // Affiche 4 tabs principaux + Plus + Profil (6 items max sur mobile)
  const maxTabs = 4;
  const displayedTabs = tabBarMenus.slice(0, maxTabs);

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {displayedTabs.map(item => {
          const isActive = active === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.tabPressed,
              ]}
            >
              <View style={[styles.tabContent, isActive && styles.tabContentActive]}>
                <Text style={[styles.icon, isActive && styles.iconActive]}>{item.icon}</Text>
                <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Bouton "Plus" pour menus supplémentaires */}
        {showMoreButton && (
          <Pressable
            onPress={() => setMoreMenuOpen(true)}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.tabPressed,
            ]}
          >
            <View style={styles.tabContent}>
              <Text style={styles.icon}>⋯</Text>
              <Text style={styles.label} numberOfLines={1}>Plus</Text>
            </View>
          </Pressable>
        )}

        {/* Bouton Profil */}
        <Pressable
          onPress={() => setProfileOpen(true)}
          style={({ pressed }) => [
            styles.tab,
            pressed && styles.tabPressed,
          ]}
        >
          <View style={styles.tabContent}>
            <Text style={styles.icon}>👤</Text>
            <Text style={styles.label} numberOfLines={1}>Profil</Text>
          </View>
        </Pressable>
      </View>

      {/* Modal ProfileMenu */}
      <ProfileMenu 
        visible={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        onLogout={() => {
          setProfileOpen(false);
          onLogout && onLogout();
        }} 
      />

      {/* Modal pour menus supplémentaires */}
      {showMoreButton && (
        <Modal
          visible={moreMenuOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setMoreMenuOpen(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setMoreMenuOpen(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Menu supplémentaire</Text>
                <TouchableOpacity onPress={() => setMoreMenuOpen(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.menuList}>
                {hamburgerMenus.map(item => (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      onChange(item.key);
                      setMoreMenuOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed,
                      active === item.key && styles.menuItemActive,
                    ]}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={[
                      styles.menuLabel,
                      active === item.key && styles.menuLabelActive,
                    ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    // paddingBottom géré dynamiquement via useSafeAreaInsets
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPressed: {
    opacity: 0.6,
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabContentActive: {
    // Optionnel: ajouter un effet visuel supplémentaire
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  labelActive: {
    color: '#1976d2',
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  menuList: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemPressed: {
    backgroundColor: '#f5f5f5',
  },
  menuItemActive: {
    backgroundColor: '#e3f2fd',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#1976d2',
    fontWeight: '600',
  },
});
