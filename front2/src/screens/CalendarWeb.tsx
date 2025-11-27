import React, { useRef, useEffect, useState } from 'react';

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

// Load FullCalendar only when this web component is rendered
const FullCalendar = (typeof window !== 'undefined') ? require('@fullcalendar/react').default : null;
const dayGridPlugin = (typeof window !== 'undefined') ? require('@fullcalendar/daygrid').default : null;
const timeGridPlugin = (typeof window !== 'undefined') ? require('@fullcalendar/timegrid').default : null;
const interactionPlugin = (typeof window !== 'undefined') ? require('@fullcalendar/interaction').default : null;
const frLocale = (typeof window !== 'undefined') ? require('@fullcalendar/core/locales/fr').default : null;

type Props = {
  appointments: Appointment[];
  onSelect?: (a: Appointment) => void;
  onCreate?: (initial?: string | null) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onMove?: (id: string, newDate: string, newDuration?: number) => Promise<void>;
};

export default function CalendarWeb({ appointments, onSelect, onCreate, onUpdateStatus, onMove }: Props) {
  const calendarRef = useRef<any>(null);
  // compute today's appointments for the left summary
  const todayKey = new Date().toDateString();
  const todays = appointments.filter(a => {
    const d = new Date(a.date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString() === todayKey;
  }).sort((l, r) => new Date(l.date).getTime() - new Date(r.date).getTime());

  if (!FullCalendar) return <div>Calendar (web) not available</div>;
  // measure container to compute exact pixel height divisible by slot count
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const [computedHeight, setComputedHeight] = useState<number | null>(null);

  useEffect(() => {
    function compute() {
      const el = calendarContainerRef.current;
      if (!el) return;
      const clientH = el.clientHeight;
      // compute number of slots between 09:00 and 17:00 with 30min duration
      const slotCount = (17 - 9) * 2; // 8 hours * 2 = 16
      const slotHeight = Math.floor(clientH / slotCount);
      setComputedHeight(slotHeight * slotCount);
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Inject grid-based CSS to force equal row heights (robust against rounding)
  useEffect(() => {
    // removed grid CSS injection because it breaks FullCalendar layout
    return () => {};
  }, []);

  // Status colors
  const statusColors: Record<string, string> = {
    scheduled: '#1976d2',
    completed: '#616161',
    cancelled: '#d32f2f',
    noShow: '#f57c00'
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'Planifié',
    completed: 'Terminé',
    cancelled: 'Annulé',
    noShow: 'Absent'
  };

  // Calculate stats for sidebar
  const now = new Date();
  const upcomingToday = todays.filter(a => {
    const d = new Date(a.date);
    return d.getTime() > now.getTime() && a.status !== 'completed' && a.status !== 'cancelled';
  });
  const nextAppointment = upcomingToday.length > 0 ? upcomingToday[0] : null;

  // Handle single click on event
  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps?.appointment;
    if (!appointment) return;
    onSelect && onSelect(appointment);
  };

  // Convertir une date en ISO string en préservant l'heure locale (évite le décalage UTC)
  const toLocalISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Handle drag & drop
  const handleEventDrop = async (info: any) => {
    const appointment = info.event.extendedProps?.appointment;
    if (!appointment?._id) {
      info.revert();
      return;
    }
    
    const startDate = info.event.start;
    if (!startDate) {
      info.revert();
      return;
    }
    
    // Utiliser toLocalISOString pour préserver l'heure locale
    const newDate = toLocalISOString(startDate);

    try {
      if (onMove) {
        await onMove(appointment._id, newDate);
      }
    } catch (err) {
      console.error('Failed to move appointment:', err);
      info.revert();
      alert('Erreur lors du déplacement du rendez-vous');
    }
  };

  // Handle resize
  const handleEventResize = async (info: any) => {
    const appointment = info.event.extendedProps?.appointment;
    if (!appointment?._id) {
      info.revert();
      return;
    }
    
    const startDate = info.event.start;
    const newDuration = Math.round((info.event.end - info.event.start) / 60000);
    
    if (!startDate) {
      info.revert();
      return;
    }
    
    const newDate = toLocalISOString(startDate);

    try {
      if (onMove) {
        await onMove(appointment._id, newDate, newDuration);
      }
    } catch (err) {
      console.error('Failed to resize appointment:', err);
      info.revert();
      alert('Erreur lors du redimensionnement du rendez-vous');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <aside style={{ width: 340 }}>
        <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>Aujourd'hui</h3>
          
          {/* Summary stats */}
          {todays.length > 0 && (
            <div style={{ padding: 10, background: '#f5f5f5', borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>{todays.length} RDV</span>
              <span style={{ color: '#666' }}> • </span>
              <span style={{ color: '#2e7d32' }}>{upcomingToday.length} à venir</span>
            </div>
          )}

          {todays.length === 0 && <div style={{ color: '#666', padding: 8 }}>Aucun rendez-vous</div>}
          
          {todays.map((a, idx) => {
            const d = new Date(a.date);
            const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
            const isPast = d.getTime() < now.getTime();
            const isNext = nextAppointment?._id === a._id;
            const color = statusColors[a.status || 'scheduled'] || '#1976d2';
            
            return (
              <div 
                key={a._id || a.date} 
                style={{ 
                  padding: 10, 
                  marginTop: 8, 
                  cursor: 'pointer',
                  borderLeft: `4px solid ${color}`,
                  paddingLeft: 12,
                  background: isPast ? '#fafafa' : '#fff',
                  borderRadius: 4,
                  position: 'relative'
                }} 
                onClick={() => onSelect && onSelect(a)}
              >
                {isNext && (
                  <div style={{ 
                    position: 'absolute', 
                    top: -6, 
                    right: 8, 
                    background: '#ff9800', 
                    color: '#fff', 
                    fontSize: 10, 
                    padding: '2px 6px', 
                    borderRadius: 10, 
                    fontWeight: 600 
                  }}>À VENIR</div>
                )}
                <div style={{ fontWeight: 700, opacity: isPast ? 0.6 : 1 }}>
                  {time} — {a.patientName || `${a.patientFirstName} ${a.patientLastName}`}
                </div>
                <div style={{ color: '#666', fontSize: 13, marginTop: 2, opacity: isPast ? 0.6 : 1 }}>
                  {a.type || 'Consultation'} • {statusLabels[a.status || 'scheduled']}
                </div>
                
                {/* Quick actions */}
                {!isPast && a.status !== 'completed' && a.status !== 'cancelled' && onUpdateStatus && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onUpdateStatus(a._id!, 'completed')}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 11, background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >✓ Terminé</button>
                    <button
                      onClick={() => onUpdateStatus(a._id!, 'noShow')}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 11, background: '#f57c00', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >✗ Absent</button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#666' }}>Légende</div>
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: statusColors[key] }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, maxWidth: 980 }}>
        <div ref={calendarContainerRef} style={{ height: 'calc(100vh - 160px)', minHeight: 480, position: 'relative' }}>
          {/* @ts-ignore */}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={frLocale || 'fr'}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            buttonText={{ today: 'Aujourd\'hui', month: 'Mois', week: 'Semaine', day: 'Jour', list: 'Liste' }}
            hiddenDays={[0]}
            slotMinTime={'09:00:00'}
            slotMaxTime={'17:00:00'}
            slotDuration={'00:30:00'}
            slotLabelInterval={'01:00:00'}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            allDaySlot={false}
            selectable={true}
            editable={true}
            eventDurationEditable={true}
            eventStartEditable={true}
            nowIndicator={true}
            dateClick={(info: any) => {
              onCreate && onCreate(info.dateStr);
            }}
            select={(info: any) => {
              onCreate && onCreate(info.startStr);
            }}
            expandRows={true}
            contentHeight={'auto'}
            timeZone={'local'}
            events={appointments.map(a => {
              const start = new Date(a.date);
              const end = new Date(start.getTime() + ((a.duration || 30) * 60000));
              const color = statusColors[a.status || 'scheduled'] || '#1976d2';
              return { 
                id: a._id, 
                title: a.patientName || `${a.patientFirstName} ${a.patientLastName}`, 
                start, 
                end, 
                backgroundColor: color,
                borderColor: color,
                extendedProps: { appointment: a } 
              };
            })}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventMouseEnter={(info: any) => {
              const a = info.event.extendedProps?.appointment;
              if (!a) return;
              info.el.title = `${a.patientName || a.patientFirstName + ' ' + a.patientLastName}\n${a.type || 'Consultation'}\n${statusLabels[a.status || 'scheduled']}${a.notes ? '\n' + a.notes : ''}`;
            }}
            height={computedHeight || '100%'}
          />

          {/* floating create button inside web calendar */}
          {onCreate && (
            <button onClick={() => {
              // Date du jour à 09:00 par défaut
              const today = new Date();
              today.setHours(9, 0, 0, 0);
              onCreate(today.toISOString());
            }} style={{ position: 'absolute', right: 20, bottom: 20, background: '#1976d2', color: '#fff', border: 'none', width: 52, height: 52, borderRadius: 26, fontSize: 22, cursor: 'pointer' }}>＋</button>
          )}
        </div>
      </main>
    </div>
  );
}
