import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Platform } from 'react-native';
import { getAppointments } from '../api/appointments';
import { getPatients } from '../api/patients';

type Appointment = {
  _id?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientName?: string;
  date: string;
  duration?: number;
  type?: string;
  status?: string;
  notes?: string;
};

type Patient = {
  _id: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
};

type Stats = {
  todayAppointments: number;
  upcomingToday: number;
  completedToday: number;
  totalPatients: number;
  newPatientsThisWeek: number;
  cancelledToday: number;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    todayAppointments: 0,
    upcomingToday: 0,
    completedToday: 0,
    totalPatients: 0,
    newPatientsThisWeek: 0,
    cancelledToday: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      // Fetch today's appointments
      const appointments = await getAppointments({ 
        startDate: todayStart.toISOString(), 
        endDate: todayEnd.toISOString() 
      });

      // Fetch all patients
      const patients = await getPatients();

      // Calculate stats
      const todayKey = todayStart.toDateString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayAppts = appointments.filter(a => {
        const d = new Date(a.date);
        return d.toDateString() === todayKey;
      });

      const upcoming = todayAppts.filter(a => new Date(a.date).getTime() > now.getTime() && a.status !== 'completed' && a.status !== 'cancelled');
      const completed = todayAppts.filter(a => a.status === 'completed');
      const cancelled = todayAppts.filter(a => a.status === 'cancelled');
      const newPatients = patients.filter(p => p.createdAt && new Date(p.createdAt) > weekAgo);

      setStats({
        todayAppointments: todayAppts.length,
        upcomingToday: upcoming.length,
        completedToday: completed.length,
        totalPatients: patients.length,
        newPatientsThisWeek: newPatients.length,
        cancelledToday: cancelled.length,
      });

      // Sort appointments by time
      const sortedToday = todayAppts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTodayAppointments(sortedToday);

      // Get 5 most recent patients
      const sorted = [...patients].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setRecentPatients(sorted.slice(0, 5));

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20c997" />
        <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
      </View>
    );
  }

  const StatCard = ({ title, value, subtitle, color, icon }: any) => (
    <View style={[styles.statCard, Platform.OS === 'web' && styles.statCardWeb]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de bord</Text>
        <Text style={styles.subtitle}>Vue d'ensemble de votre activité</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="RDV aujourd'hui"
          value={stats.todayAppointments}
          subtitle={`${stats.upcomingToday} à venir`}
          color="#1976d2"
          icon="📅"
        />
        <StatCard
          title="RDV terminés"
          value={stats.completedToday}
          subtitle="Aujourd'hui"
          color="#2e7d32"
          icon="✅"
        />
        <StatCard
          title="Total patients"
          value={stats.totalPatients}
          subtitle={`+${stats.newPatientsThisWeek} cette semaine`}
          color="#9c27b0"
          icon="👥"
        />
        <StatCard
          title="Annulations"
          value={stats.cancelledToday}
          subtitle="Aujourd'hui"
          color="#d32f2f"
          icon="❌"
        />
      </View>

      {/* Today's Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📆 Rendez-vous du jour</Text>
          <Pressable onPress={loadDashboard}>
            <Text style={styles.refreshBtn}>🔄 Actualiser</Text>
          </Pressable>
        </View>
        
        {todayAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>Aucun rendez-vous aujourd'hui</Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {todayAppointments.map((appt, idx) => {
              const d = new Date(appt.date);
              const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const isPast = d.getTime() < new Date().getTime();
              const statusColors: Record<string, string> = {
                scheduled: '#1976d2',
                completed: '#2e7d32',
                cancelled: '#d32f2f',
                noShow: '#f57c00'
              };
              const statusLabels: Record<string, string> = {
                scheduled: 'Planifié',
                completed: 'Terminé',
                cancelled: 'Annulé',
                noShow: 'Absent'
              };
              const statusColor = statusColors[appt.status || 'scheduled'] || '#1976d2';

              return (
                <View key={appt._id || idx} style={[styles.appointmentCard, isPast && styles.appointmentPast]}>
                  <View style={[styles.appointmentBar, { backgroundColor: statusColor }]} />
                  <View style={styles.appointmentContent}>
                    <View style={styles.appointmentTop}>
                      <Text style={styles.appointmentTime}>{time}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{statusLabels[appt.status || 'scheduled']}</Text>
                      </View>
                    </View>
                    <Text style={styles.appointmentPatient}>
                      {appt.patientName || `${appt.patientFirstName} ${appt.patientLastName}`}
                    </Text>
                    <Text style={styles.appointmentType}>
                      {appt.type || 'Consultation'} • {appt.duration || 30} min
                    </Text>
                    {appt.notes && <Text style={styles.appointmentNotes} numberOfLines={2}>{appt.notes}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Recent Patients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Patients récents</Text>
        {recentPatients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun patient récent</Text>
          </View>
        ) : (
          <View style={styles.patientsList}>
            {recentPatients.map((patient) => (
              <View key={patient._id} style={styles.patientCard}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>
                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
                  <Text style={styles.patientDate}>
                    Ajouté le {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
        <View style={styles.quickActions}>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Nouveau RDV</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Nouveau patient</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Statistiques</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Paramètres</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardWeb: {
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }),
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  refreshBtn: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentPast: {
    opacity: 0.6,
  },
  appointmentBar: {
    width: 4,
  },
  appointmentContent: {
    flex: 1,
    padding: 16,
  },
  appointmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  appointmentNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  patientsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  patientDate: {
    fontSize: 12,
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
});
