import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions, Modal, TouchableOpacity, ScrollView } from 'react-native';
import ProfileMenu from './ProfileMenu';

type Props = {
  active: string;
  onChange: (route: any) => void;
  onLogout?: () => void;
};

export default function Menu({ active, onChange, onLogout }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);

  const { width } = useWindowDimensions();
  const isSmall = width < 480;
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [hamburgerProfileExpanded, setHamburgerProfileExpanded] = useState(false);

  // For hover effect on web
  const [hovered, setHovered] = useState<string | null>(null);

  // Web-only style helpers
  const webTransition = Platform.OS === 'web' ? {
    transitionProperty: 'background-color,box-shadow',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  } : {};
  const webBoxShadow = (shadow: string) => Platform.OS === 'web' ? { boxShadow: shadow } : {};
  const webGradient = Platform.OS === 'web' ? {
    backgroundImage: 'linear-gradient(30deg, #20c997 0%, #0dcaf0 130%)',
    // keep the existing rounded look
    borderRadius: 18,
  } : {};

  return (
  <View style={[styles.container, isSmall && styles.containerColumn, Platform.OS === 'web' ? (webGradient as any) : undefined]}>
      {/* Small screen: show title + hamburger */}
      {isSmall ? (
        <View style={[styles.left, styles.smallHeader]}>
          <Text style={[styles.text, { fontSize: 16, fontWeight: '700' }]}>Cabinet</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setHamburgerOpen(true)} style={[styles.profile, styles.hamburgerBtn]}>
            <Text style={styles.profileText}>☰</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.left, isSmall && styles.leftWrap]}>
          {[
            { key: 'patients', label: 'Patients' },
            { key: 'treatments', label: 'Soins' },
            { key: 'calendar', label: 'Calendrier' },
            { key: 'manager', label: 'Manager' },
          ].map(tab => {
            const isActive = active === tab.key;
            const isHovered = hovered === tab.key && Platform.OS === 'web';
            const isWeb = Platform.OS === 'web';
            return (
              <Pressable
                key={tab.key}
                onPress={() => onChange(tab.key)}
                onHoverIn={() => isWeb && setHovered(tab.key)}
                onHoverOut={() => isWeb && setHovered(null)}
                style={({ pressed }) => [
                  styles.tabItem,
                  isSmall && styles.itemSmall,
                  pressed && styles.pressed,
                  isHovered ? { backgroundColor: 'rgba(255,255,255,0.04)' } : undefined,
                ]}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.tabText, isSmall && styles.text]}>{tab.label}</Text>
                  <View style={[styles.tabUnderline, isActive && styles.tabUnderlineActive]} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      

      {/* On large screens, show profile on the right */}
      {!isSmall && (
        <View style={[styles.right, isSmall && styles.rightSmall]}>
          <Pressable
            onPress={() => setProfileOpen(true)}
            style={[
              styles.profile,
              Platform.OS === 'web' ? (webTransition as any) : undefined,
              Platform.OS === 'web' ? (webBoxShadow('0 2px 8px 0 rgba(25,118,210,0.10)') as any) : undefined,
            ]}
          >
            <Text style={styles.profileText}>👤</Text>
          </Pressable>
        </View>
      )}

      <ProfileMenu visible={profileOpen} onClose={() => setProfileOpen(false)} onLogout={() => { setProfileOpen(false); onLogout && onLogout(); }} />

      {/* Hamburger modal for small screens */}
      <Modal visible={hamburgerOpen} animationType="slide" transparent={true} onRequestClose={() => setHamburgerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle]}>Menu</Text>
              <TouchableOpacity onPress={() => setHamburgerOpen(false)} style={{ padding: 6 }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {[
                { key: 'patients', label: 'Patients' },
                { key: 'treatments', label: 'Soins' },
                { key: 'calendar', label: 'Calendrier' },
                { key: 'manager', label: 'Manager' },
              ].map(tab => (
                <Pressable
                  key={tab.key}
                  onPress={() => { onChange(tab.key); setHamburgerOpen(false); }}
                  style={[styles.item, styles.itemSmall, { marginVertical: 6, width: '100%', backgroundColor: 'transparent' }]}
                >
                  <Text style={styles.modalItemText}>{tab.label}</Text>
                </Pressable>
              ))}

              <View style={{ height: 12 }} />
              <View style={{ paddingVertical: 4 }}>
                <Pressable onPress={() => setHamburgerProfileExpanded(p => !p)} style={[styles.item, styles.itemSmall, { width: '100%' }]}>
                  <Text style={styles.modalItemText}>👤 Profil</Text>
                </Pressable>

                {hamburgerProfileExpanded && (
                  <>
                    <Pressable onPress={() => { setProfileOpen(true); setHamburgerOpen(false); setHamburgerProfileExpanded(false); }} style={[styles.item, styles.itemSmall, { marginTop: 8, width: '100%' }]}>
                      <Text style={styles.modalItemText}>⚙️ Paramètres</Text>
                    </Pressable>

                    <Pressable onPress={() => { setHamburgerOpen(false); setHamburgerProfileExpanded(false); onLogout && onLogout(); }} style={[styles.item, styles.itemSmall, { marginTop: 8, width: '100%' }]}>
                      <Text style={[styles.modalItemText, styles.logoutText]}>Se déconnecter</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'rgba(46, 125, 50, 0.75)',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    margin: 8,
    elevation: Platform.OS !== 'web' ? 2 : undefined,
  },
  containerColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  left: { flexDirection: 'row' },
  leftWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  smallHeader: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 8 },

  // Default item styles (native fallback)
  item: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  itemSmall: { paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, borderRadius: 12 },
  active: {
    backgroundColor: 'rgba(25, 118, 210, 0.90)',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  pressed: { opacity: 0.7, backgroundColor: 'rgba(25, 118, 210, 0.18)' },
  text: { color: '#fff', fontWeight: '600', letterSpacing: 0.5 },

  right: { marginRight: 8 },
  rightSmall: { alignSelf: 'flex-end', marginTop: 6 },

  profile: {
    padding: 8,
    backgroundColor: 'rgba(178, 223, 219, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.18)',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  hamburgerBtn: { padding: 6, marginLeft: 8 },
  profileText: { fontSize: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  modalClose: { color: '#222', fontSize: 16 },
  modalItemText: { color: '#222', fontSize: 16 },

  // Tab style (web)
  tabItem: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  tabText: { color: '#fff', fontWeight: '600', fontSize: 18 },
  tabUnderline: { height: 3, width: '100%', backgroundColor: 'transparent', marginTop: 6, borderRadius: 3 },
  tabUnderlineActive: { backgroundColor: 'rgba(255,255,255,0.9)' },

  // Pills style (web)
  pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  pillActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  pillText: { color: '#fff', fontWeight: '700' },

  logoutText: { color: '#d32f2f' },
});
