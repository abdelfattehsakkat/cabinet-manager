import React, { useRef, useEffect, useState } from 'react';

type Appointment = {
  _id?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientName?: string;
  date: string;
  duration?: number;
  type?: string;
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
};

export default function CalendarWeb({ appointments, onSelect }: Props) {
  // compute today's appointments for the left summary
  const todayKey = new Date().toDateString();
  const todays = appointments.filter(a => {
    const d = new Date(a.date);
    const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    return new Date(local.getFullYear(), local.getMonth(), local.getDate()).toDateString() === todayKey;
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

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <aside style={{ width: 320 }}>
        <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3>Rendez-vous aujourd'hui</h3>
          {todays.length === 0 && <div style={{ color: '#666' }}>Aucun rendez-vous</div>}
          {todays.map(a => {
            const d = new Date(a.date);
            const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
            const time = local.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
            return (
              <div key={a._id || a.date} style={{ paddingTop: 8, paddingBottom: 8, marginTop: 8, cursor: 'pointer' }} onClick={() => onSelect && onSelect(a)}>
                <div style={{ fontWeight: 700 }}>{time} — {a.patientName || `${a.patientFirstName} ${a.patientLastName}`}</div>
                <div style={{ color: '#666' }}>{a.type || 'Consultation'}</div>
              </div>
            );
          })}
        </div>
      </aside>

      <main style={{ flex: 1, maxWidth: 980 }}>
        <div ref={calendarContainerRef} style={{ height: 'calc(100vh - 160px)', minHeight: 480 }}>
          {/* @ts-ignore */}
          <FullCalendar
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
            expandRows={true}
            contentHeight={'auto'}
            events={appointments.map(a => {
              const d = new Date(a.date);
              const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
              const end = new Date(local.getTime() + ((a.duration || 30) * 60000));
              return { id: a._id, title: a.patientName || `${a.patientFirstName} ${a.patientLastName}`, start: local, end, extendedProps: { appointment: a } };
            })}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventClick={(info: any) => onSelect && onSelect(info.event.extendedProps?.appointment)}
            height={computedHeight || '100%'}
          />
        </div>
      </main>
    </div>
  );
}
