import React, { useState, useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

type Props = {
  visible: boolean;
  initial?: string | null; // YYYY/MM/DD
  onClose: () => void;
  onSelect: (dateStr: string) => void;
};

function parseYMD(s?: string | null) {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(p => parseInt(p, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

function fmtYMD(dt: Date) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

export default function DatePickerCalendar({ visible, initial, onClose, onSelect }: Props) {
  const initDate = parseYMD(initial) || new Date();
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [selected, setSelected] = useState<Date | null>(parseYMD(initial) || null);
  const [mode, setMode] = useState<'day' | 'month' | 'year'>('day');

  const monthData = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekDay = first.getDay(); // 0..6 (Sun..Sat)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const weeks: Array<Array<number | null>> = [];
    let week: Array<number | null> = new Array(7).fill(null);
    let day = 1;
    // fill first week
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
    return { weeks, monthLabel: `${viewYear} - ${viewMonth + 1}` };
  }, [viewMonth, viewYear]);

  const changeMonth = (delta: number) => {
    const m = viewMonth + delta;
    const d = new Date(viewYear, m, 1);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  };

  const changeYear = (delta: number) => {
    setViewYear(v => v + delta);
  };

  const pickDay = (dayNum: number) => {
    const dt = new Date(viewYear, viewMonth, dayNum);
    setSelected(dt);
    onSelect(fmtYMD(dt));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            {/* year back or big jump when in year mode */}
            {mode !== 'year' ? (
              <Pressable onPress={() => changeYear(-1)} style={styles.nav}><Text>{'«'}</Text></Pressable>
            ) : (
              <Pressable onPress={() => changeYear(-25)} style={styles.nav}><Text>{'«'}</Text></Pressable>
            )}
            <Pressable onPress={() => { if (mode === 'day') changeMonth(-1); else if (mode === 'month') setMode('year'); }} style={styles.nav}><Text>{mode === 'day' ? '‹' : mode === 'month' ? '‹' : ''}</Text></Pressable>

            <Pressable onPress={() => { if (mode === 'day') setMode('month'); else if (mode === 'month') setMode('year'); }} style={{ flex: 1, alignItems: 'center' }}>
              {mode === 'day' && <Text style={styles.title}>{monthData.monthLabel}</Text>}
              {mode === 'month' && <Text style={styles.title}>{viewYear}</Text>}
              {mode === 'year' && <Text style={styles.title}>Choisir l'année</Text>}
            </Pressable>

            <Pressable onPress={() => { if (mode === 'day') changeMonth(1); else if (mode === 'month') setMode('year'); }} style={styles.nav}><Text>{mode === 'day' ? '›' : mode === 'month' ? '›' : ''}</Text></Pressable>
            {mode !== 'year' ? (
              <Pressable onPress={() => changeYear(1)} style={styles.nav}><Text>{'»'}</Text></Pressable>
            ) : (
              <Pressable onPress={() => changeYear(25)} style={styles.nav}><Text>{'»'}</Text></Pressable>
            )}
          </View>

          {mode === 'day' && (
            <>
              <View style={styles.weekdays}>
                {['D','L','M','M','J','V','S'].map((w, i) => <Text key={i} style={styles.wd}>{w}</Text>)}
              </View>
              <ScrollView>
                {monthData.weeks.map((wk, i) => (
                  <View key={i} style={styles.weekRow}>
                    {wk.map((d, j) => (
                      <View key={j} style={styles.dayCell}>
                        {d ? (
                          <Pressable onPress={() => pickDay(d)} style={[styles.dayBtn, selected && selected.getDate() === d && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear ? styles.dayBtnSelected : null]}>
                            <Text style={styles.dayText}>{d}</Text>
                          </Pressable>
                        ) : <View style={{ height: 32 }} />}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {mode === 'month' && (
            <View style={{ padding: 8 }}>
              <View style={styles.monthGrid}>
                {['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'].map((m, idx) => (
                  <Pressable key={idx} style={styles.monthCell} onPress={() => { setViewMonth(idx); setMode('day'); }}>
                    <Text style={styles.monthText}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {mode === 'year' && (
            <ScrollView style={{ padding: 8 }}>
              {(() => {
                // show a wider range of years (25 years) centered on viewYear for faster selection
                const start = viewYear - 12;
                const years = Array.from({ length: 25 }, (_, i) => start + i);
                return (
                  <View style={styles.yearGrid}>
                    {years.map((y) => (
                      <Pressable key={y} style={styles.yearCell} onPress={() => { setViewYear(y); setMode('month'); }}>
                        <Text style={styles.yearText}>{y}</Text>
                      </Pressable>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.smallBtn}><Text>Fermer</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 12 },
  card: { width: 320, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontWeight: '700' },
  nav: { padding: 6 },
  weekdays: { flexDirection: 'row', padding: 6, backgroundColor: '#fafafa' },
  wd: { flex: 1, textAlign: 'center', color: '#666', fontSize: 12 },
  weekRow: { flexDirection: 'row', paddingVertical: 4 },
  dayCell: { flex: 1, alignItems: 'center' },
  dayBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dayBtnSelected: { backgroundColor: '#2e7d32' },
  dayText: { color: '#111' },
  actions: { padding: 8, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'flex-end' },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6 }
  ,
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthCell: { width: '30%', padding: 8, marginVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#fff' },
  monthText: { color: '#222' },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  yearCell: { width: '30%', padding: 10, marginVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#fff' },
  yearText: { color: '#222' }
});
