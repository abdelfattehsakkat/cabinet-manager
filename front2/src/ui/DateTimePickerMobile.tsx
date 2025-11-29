import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';

type Props = {
  value: string; // ISO string or datetime-local format (YYYY-MM-DDTHH:mm)
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function DateTimePickerMobile({ value, onChange, placeholder = 'Sélectionner date et heure' }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Parse the value
  const parseValue = (val: string) => {
    if (!val) return new Date();
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    } catch {}
    return new Date();
  };
  
  const currentDate = parseValue(value);
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const [hours, setHours] = useState(currentDate.getHours());
  const [minutes, setMinutes] = useState(currentDate.getMinutes());

  // Format for display
  const formatDisplay = (val: string) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} à ${h}:${m}`;
    } catch {
      return '';
    }
  };

  // Generate calendar data
  const getCalendarData = () => {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekDay = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const weeks: Array<Array<number | null>> = [];
    let week: Array<number | null> = new Array(7).fill(null);
    let day = 1;
    
    for (let i = startWeekDay; i < 7; i++) {
      week[i] = day++;
    }
    weeks.push(week);
    
    while (day <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && day <= daysInMonth; i++) {
        week[i] = day++;
      }
      weeks.push(week);
    }
    return weeks;
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const changeMonth = (delta: number) => {
    const m = viewMonth + delta;
    const d = new Date(viewYear, m, 1);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  };

  const selectDay = (dayNum: number) => {
    const newDate = new Date(viewYear, viewMonth, dayNum, hours, minutes);
    setSelectedDate(newDate);
    setShowTimePicker(true);
  };

  const confirmDateTime = () => {
    const finalDate = new Date(selectedDate);
    finalDate.setHours(hours, minutes, 0, 0);
    
    // Format as ISO string compatible with datetime-local
    const year = finalDate.getFullYear();
    const month = String(finalDate.getMonth() + 1).padStart(2, '0');
    const day = String(finalDate.getDate()).padStart(2, '0');
    const h = String(finalDate.getHours()).padStart(2, '0');
    const m = String(finalDate.getMinutes()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}T${h}:${m}`;
    
    onChange(formatted);
    setShowTimePicker(false);
    setShowPicker(false);
  };

  const isSelectedDay = (dayNum: number) => {
    return selectedDate.getDate() === dayNum && 
           selectedDate.getMonth() === viewMonth && 
           selectedDate.getFullYear() === viewYear;
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return today.getDate() === dayNum && 
           today.getMonth() === viewMonth && 
           today.getFullYear() === viewYear;
  };

  return (
    <>
      <Pressable style={styles.inputButton} onPress={() => setShowPicker(true)}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {!showTimePicker ? (
              <>
                {/* Calendar Header */}
                <View style={styles.header}>
                  <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn}>
                    <Text style={styles.navText}>◀</Text>
                  </Pressable>
                  <Text style={styles.monthTitle}>{monthNames[viewMonth]} {viewYear}</Text>
                  <Pressable onPress={() => changeMonth(1)} style={styles.navBtn}>
                    <Text style={styles.navText}>▶</Text>
                  </Pressable>
                </View>

                {/* Weekday headers */}
                <View style={styles.weekRow}>
                  {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d, i) => (
                    <Text key={i} style={styles.weekdayText}>{d}</Text>
                  ))}
                </View>

                {/* Calendar grid */}
                <View style={styles.calendarGrid}>
                  {getCalendarData().map((week, wi) => (
                    <View key={wi} style={styles.weekRow}>
                      {week.map((day, di) => (
                        <View key={di} style={styles.dayCell}>
                          {day ? (
                            <Pressable 
                              style={[
                                styles.dayBtn,
                                isSelectedDay(day) && styles.dayBtnSelected,
                                isToday(day) && styles.dayBtnToday
                              ]} 
                              onPress={() => selectDay(day)}
                            >
                              <Text style={[
                                styles.dayText,
                                isSelectedDay(day) && styles.dayTextSelected
                              ]}>
                                {day}
                              </Text>
                            </Pressable>
                          ) : <View style={styles.emptyDay} />}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>

                {/* Cancel button */}
                <Pressable style={styles.cancelBtn} onPress={() => setShowPicker(false)}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Time picker */}
                <Text style={styles.timeTitle}>Sélectionner l'heure</Text>
                <Text style={styles.selectedDateText}>
                  {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                
                <View style={styles.timePickerContainer}>
                  {/* Hours */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Heures</Text>
                    <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: 24 }, (_, i) => i).map(h => (
                        <Pressable 
                          key={h} 
                          style={[styles.timeItem, hours === h && styles.timeItemSelected]}
                          onPress={() => setHours(h)}
                        >
                          <Text style={[styles.timeItemText, hours === h && styles.timeItemTextSelected]}>
                            {String(h).padStart(2, '0')}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  {/* Minutes */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Minutes</Text>
                    <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                        <Pressable 
                          key={m} 
                          style={[styles.timeItem, minutes === m && styles.timeItemSelected]}
                          onPress={() => setMinutes(m)}
                        >
                          <Text style={[styles.timeItemText, minutes === m && styles.timeItemTextSelected]}>
                            {String(m).padStart(2, '0')}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.timeActions}>
                  <Pressable style={styles.backBtn} onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.backText}>← Retour</Text>
                  </Pressable>
                  <Pressable style={styles.confirmBtn} onPress={confirmDateTime}>
                    <Text style={styles.confirmText}>Confirmer</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  placeholder: {
    color: '#999',
  },
  icon: {
    fontSize: 18,
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
  },
  navText: {
    fontSize: 18,
    color: '#1976d2',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingVertical: 8,
  },
  calendarGrid: {
    marginBottom: 16,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  dayBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayBtnSelected: {
    backgroundColor: '#1976d2',
  },
  dayBtnToday: {
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyDay: {
    flex: 1,
  },
  cancelBtn: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  timeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectedDateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeColumn: {
    alignItems: 'center',
    width: 80,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  timeScroll: {
    height: 180,
  },
  timeItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 2,
  },
  timeItemSelected: {
    backgroundColor: '#1976d2',
  },
  timeItemText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  timeItemTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '700',
    marginHorizontal: 16,
    color: '#333',
  },
  timeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  backBtn: {
    padding: 12,
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  confirmBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
