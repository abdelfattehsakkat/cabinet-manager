import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Modal } from 'react-native';

type Appointment = {
  _id?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientName?: string;
  date: string;
  duration?: number;
  type?: string;
  status?: string;
};

type Props = { appointments: Appointment[]; onSelect?: (a: Appointment) => void };

export default function CalendarMobile({ appointments, onSelect }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Filter appointments for selected date
  const todayKey = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toDateString();
  const todaysAppointments = appointments
    .filter(a => {
      const d = new Date(a.date);
      const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      return new Date(local.getFullYear(), local.getMonth(), local.getDate()).toDateString() === todayKey;
    })
    .sort((l, r) => new Date(l.date).getTime() - new Date(r.date).getTime());

  // Navigation handlers
  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Generate time slots (9h-17h)
  const timeSlots: string[] = [];
  for (let h = 9; h < 17; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }
  timeSlots.push('17:00');

  // Get appointment at specific time slot
  const getAppointmentAtSlot = (slot: string) => {
    return todaysAppointments.find(a => {
      const d = new Date(a.date);
      const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      const time = `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`;
      return time === slot;
    });
  };

  // Format date display
  const isToday = todayKey === new Date().toDateString();
  const formattedDate = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Status colors
  const statusColors: Record<string, string> = {
    scheduled: '#1976d2',
    completed: '#616161',
    cancelled: '#d32f2f',
    noShow: '#f57c00'
  };

  // Mini calendar component
  const MiniCalendar = () => {
    const today = new Date();
    const currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = currentMonth.getDay() === 0 ? 6 : currentMonth.getDay() - 1; // Monday = 0

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const hasAppointment = (day: number) => {
      const dateKey = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
      return appointments.some(a => {
        const d = new Date(a.date);
        const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return new Date(local.getFullYear(), local.getMonth(), local.getDate()).toDateString() === dateKey;
      });
    };

    const goToPrevMonth = () => {
      const prev = new Date(currentMonth);
      prev.setMonth(prev.getMonth() - 1);
      setSelectedDate(prev);
    };

    const goToNextMonth = () => {
      const next = new Date(currentMonth);
      next.setMonth(next.getMonth() + 1);
      setSelectedDate(next);
    };

    return (
      <View style={styles.miniCalendar}>
        <View style={styles.miniHeader}>
          <Pressable onPress={goToPrevMonth}><Text style={styles.navArrow}>‹</Text></Pressable>
          <Text style={styles.miniMonthTitle}>
            {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable onPress={goToNextMonth}><Text style={styles.navArrow}>›</Text></Pressable>
        </View>
        <View style={styles.weekDays}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <Text key={i} style={styles.weekDay}>{d}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {days.map((day, i) => {
            if (!day) return <View key={`empty-${i}`} style={styles.dayCell} />;
            const isSelected = day === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth();
            const isTodayDay = day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
            const hasAppt = hasAppointment(day);
            return (
              <Pressable
                key={day}
                style={[styles.dayCell, isSelected && styles.daySelected, isTodayDay && styles.dayToday]}
                onPress={() => {
                  setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                  setShowCalendar(false);
                }}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                {hasAppt && <View style={styles.dayDot} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header harmonisé avec Patients/Soins */}
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>
          {todaysAppointments.length} rendez-vous {todaysAppointments.length > 1 ? 'prévus' : 'prévu'}
        </Text>
        
        <View style={styles.navBar}>
          <Pressable onPress={goToPreviousDay} style={styles.navButton}>
            <Text style={styles.navArrow}>‹</Text>
          </Pressable>
          <Pressable onPress={goToToday} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>{isToday ? "Aujourd'hui" : "Aujourd'hui"}</Text>
          </Pressable>
          <Pressable onPress={goToNextDay} style={styles.navButton}>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
          <Pressable onPress={() => setShowCalendar(true)} style={styles.calendarButton}>
            <Text style={styles.calendarIcon}>📅</Text>
          </Pressable>
        </View>
        <Text style={styles.dateTitle}>{formattedDate}</Text>
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {timeSlots.map((slot, index) => {
          const appointment = getAppointmentAtSlot(slot);
          const isHourMark = slot.endsWith(':00');
          
          if (appointment) {
            const duration = appointment.duration || 30;
            const slots = Math.ceil(duration / 30);
            const patientName = appointment.patientName || `${appointment.patientFirstName} ${appointment.patientLastName}`;
            const statusColor = statusColors[appointment.status || 'scheduled'] || '#1976d2';
            
            return (
              <View key={slot} style={styles.timeSlot}>
                <Text style={styles.timeLabel}>{slot}</Text>
                <Pressable 
                  style={[styles.appointmentBlock, { height: 60 * slots, backgroundColor: statusColor }]}
                  onPress={() => onSelect && onSelect(appointment)}
                >
                  <Text style={styles.appointmentTime}>{slot}</Text>
                  <Text style={styles.appointmentPatient}>{patientName}</Text>
                  <Text style={styles.appointmentType}>{appointment.type || 'Consultation'}</Text>
                  <Text style={styles.appointmentDuration}>{duration} min</Text>
                </Pressable>
              </View>
            );
          }
          
          return (
            <View key={slot} style={styles.timeSlot}>
              <Text style={[styles.timeLabel, !isHourMark && styles.timeLabelLight]}>{isHourMark ? slot : ''}</Text>
              <View style={styles.emptySlot}>
                <View style={styles.slotLine} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Mini Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide" transparent={true} onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une date</Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <MiniCalendar />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 24, fontWeight: '700', color: '#212121', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  navBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  navButton: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8, width: 40, alignItems: 'center' },
  navArrow: { fontSize: 24, fontWeight: '700', color: '#333' },
  todayButton: { flex: 1, padding: 12, backgroundColor: '#1976d2', borderRadius: 8, alignItems: 'center' },
  todayButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  calendarButton: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8, width: 40, alignItems: 'center' },
  calendarIcon: { fontSize: 20 },
  dateTitle: { fontSize: 14, fontWeight: '500', color: '#666', textTransform: 'capitalize' },
  timeline: { flex: 1, paddingHorizontal: 16 },
  timeSlot: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 60 },
  timeLabel: { width: 50, paddingTop: 4, fontSize: 13, fontWeight: '600', color: '#666' },
  timeLabelLight: { color: '#ccc' },
  emptySlot: { flex: 1, height: 60, justifyContent: 'center' },
  slotLine: { height: 1, backgroundColor: '#e0e0e0' },
  appointmentBlock: { flex: 1, padding: 12, borderRadius: 8, marginBottom: 2, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  appointmentTime: { fontSize: 12, color: '#fff', opacity: 0.9, marginBottom: 4 },
  appointmentPatient: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  appointmentType: { fontSize: 13, color: '#fff', opacity: 0.9, marginBottom: 2 },
  appointmentDuration: { fontSize: 12, color: '#fff', opacity: 0.8 },
  
  // Mini calendar styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 24, color: '#666' },
  miniCalendar: { padding: 16 },
  miniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  miniMonthTitle: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  weekDays: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#666' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dayText: { fontSize: 15, color: '#333' },
  daySelected: { backgroundColor: '#1976d2', borderRadius: 20 },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayToday: { borderWidth: 2, borderColor: '#1976d2', borderRadius: 20 },
  dayDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: '#f57c00' }
});
