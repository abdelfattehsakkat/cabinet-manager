// filepath: /Users/abdelfatteh/Documents/workspace/cabinetAI/frontend/src/app/calendar/calendar-view/calendar-view.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentDialogComponent } from '../appointment-dialog/appointment-dialog.component';
import { AppointmentDetailsComponent } from '../appointment-details/appointment-details.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AppointmentService, Appointment } from '../services/appointment.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FullCalendarModule } from '@fullcalendar/angular';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { PatientService } from '../../patients/services/patient.service';

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSnackBarModule,
    FullCalendarModule
  ]
})
export class CalendarViewComponent implements OnInit {
  @ViewChild('calendar') calendar: any;
  selectedDate = new Date();
  appointments: Appointment[] = [];
  currentDoctor = '6464b8e7c45b89e6df456123'; // TODO: Get from auth service
  
  calendarOptions: any = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    locale: frLocale,
    initialView: 'dayGridMonth',
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'Aujourd\'hui',
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      list: 'Liste'
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '19:00:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00:00',
    allDaySlot: false,
    nowIndicator: true,
    eventDisplay: 'block',
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this)
  };

  constructor(
    private dialog: MatDialog,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadAppointments();
    this.updateCalendarEvents();
  }

  updateCalendarEvents() {
    if (this.calendar && this.calendar.getApi) {
      const calendarApi = this.calendar.getApi();
      calendarApi.removeAllEvents();
      
      this.appointments.forEach(appointment => {
        // Convertir correctement de UTC vers l'heure locale
        const utcDate = new Date(appointment.date);
        const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
        const endDate = new Date(localDate.getTime() + (appointment.duration || 30) * 60000);
        
        // Créer un titre plus informatif
        const patientName = appointment.patientName || this.getPatientNameFromPopulated(appointment) || 'Patient';
        const appointmentType = appointment.type || 'Consultation';
        const title = `${patientName} - ${appointmentType}`;
        
        calendarApi.addEvent({
          id: appointment._id,
          title: title,
          start: localDate,
          end: endDate,
          backgroundColor: this.getEventColor(appointment.type),
          borderColor: this.getEventColor(appointment.type),
          textColor: '#ffffff',
          extendedProps: {
            appointment: appointment,
            patientName: patientName,
            type: appointmentType,
            notes: appointment.notes
          }
        });
      });
    }
  }
  
  // Méthode pour attribuer des couleurs selon le type de RDV
  getEventColor(type: string): string {
    switch (type) {
      case 'Consultation': return '#2e7d32';
      case 'Soins': return '#1976d2';
      case 'Suivi': return '#f57c00';
      case 'Urgence': return '#d32f2f';
      default: return '#6a1b9a';
    }
  }
  
  // Helper method to extract patient name from populated patient object
  getPatientNameFromPopulated(appointment: any): string {
    if (appointment.patient && typeof appointment.patient === 'object') {
      return `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim();
    }
    return '';
  }

  loadAppointments() {
    // Charger les RDV pour tout le mois visible, pas seulement la date sélectionnée
    const startDate = new Date(this.selectedDate);
    startDate.setDate(1); // Premier jour du mois
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(this.selectedDate);
    endDate.setMonth(endDate.getMonth() + 1); // Mois suivant
    endDate.setDate(0); // Dernier jour du mois actuel
    endDate.setHours(23, 59, 59, 999);

    // Convert to UTC for API request
    const startUTC = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
    const endUTC = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);

    console.log('Loading appointments for date range:', { startUTC, endUTC });
    this.appointmentService.getAppointments({
      doctorId: this.currentDoctor,
      startDate: startUTC,
      endDate: endUTC
    }).subscribe({
      next: (appointments) => {
        console.log('Loaded appointments:', appointments);
        this.appointments = appointments;
        this.updateCalendarEvents();
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
      }
    });
  }

  getAppointmentsForDate(date: Date): Appointment[] {
    const targetDate = date.toDateString();
    return this.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const localDate = new Date(appointmentDate.getTime() + appointmentDate.getTimezoneOffset() * 60000);
      return localDate.toDateString() === targetDate;
    });
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
    this.loadAppointments();
  }

  getTimeSlots(): string[] {
    const slots = [];
    let hour = 9; // Start at 9 AM
    let minutes = 0;
    
    while (hour < 18) { // End at 6 PM
      slots.push(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      minutes += 30;
      if (minutes === 60) {
        minutes = 0;
        hour += 1;
      }
    }
    
    return slots;
  }

  getAppointmentForSlot(timeSlot: string): Appointment | undefined {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    return this.appointments.find(appointment => {
      // Convertir de UTC vers local pour la comparaison
      const utcDate = new Date(appointment.date);
      const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
      return localDate.getHours() === hours && 
             Math.floor(localDate.getMinutes() / 30) * 30 === minutes;
    });
  }

  addAppointment(timeSlot?: string) {
    const date = new Date(this.selectedDate);
    if (timeSlot) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
    }

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: { date }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result);
        const appointment: Partial<Appointment> = {
          patient: result.patientId,
          doctor: this.currentDoctor,
          date: result.date,
          duration: result.duration,
          type: result.type,
          notes: result.notes,
          status: 'scheduled'
        };

        this.appointmentService.createAppointment(appointment).subscribe({
          next: (createdAppointment) => {
            console.log('Appointment created:', createdAppointment);
            this.loadAppointments();
            this.snackBar.open('Appointment créé avec succès', 'Fermer', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error creating appointment:', error);
            const message = error.error?.message || 'Une erreur s\'est produite lors de la création du rendez-vous';
            this.snackBar.open(message, 'Fermer', { duration: 5000 });
          }
        });
      }
    });
  }

  editAppointment(appointment: Appointment) {
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: { appointment, date: new Date(appointment.date) }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result);
        const updatedAppointment: Partial<Appointment> = {
          patient: result.patientId,
          doctor: this.currentDoctor,
          date: result.date,
          duration: result.duration,
          type: result.type,
          notes: result.notes
        };

        this.appointmentService.updateAppointment(appointment._id!, updatedAppointment).subscribe({
          next: (updated) => {
            console.log('Appointment updated:', updated);
            this.loadAppointments();
            this.snackBar.open('Rendez-vous mis à jour avec succès', 'Fermer', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error updating appointment:', error);
            this.snackBar.open('Erreur lors de la mise à jour du rendez-vous', 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteAppointment(appointment: Appointment) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous?')) {
      return;
    }
    
    const appointmentId = typeof appointment === 'string' ? appointment : appointment._id;
    
    if (!appointmentId) {
      this.snackBar.open('ID de rendez-vous invalide', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.appointmentService.deleteAppointment(appointmentId).subscribe({
      next: () => {
        console.log(`Appointment ${appointmentId} deleted`);
        
        // Remove from appointments array
        this.appointments = this.appointments.filter(a => a._id !== appointmentId);
        
        // Remove from calendar if it exists there
        if (this.calendar && this.calendar.getApi) {
          const calendarApi = this.calendar.getApi();
          const event = calendarApi.getEventById(appointmentId);
          if (event) {
            event.remove();
          }
        }
        
        this.snackBar.open('Rendez-vous supprimé avec succès', 'Fermer', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error deleting appointment:', error);
        this.snackBar.open('Erreur lors de la suppression du rendez-vous', 'Fermer', { 
          duration: 3000 
        });
      }
    });
  }

  showAppointmentDetails(appointment: Appointment) {
    const dialogRef = this.dialog.open(AppointmentDetailsComponent, {
      data: { appointment }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'edit') {
        this.editAppointment(appointment);
      } else if (result?.action === 'delete') {
        this.deleteAppointment(appointment);
      }
    });
  }

  handleEventClick(info: any) {
    const appointment = info.event.extendedProps.appointment;
    this.showAppointmentDetails(appointment);
  }

  handleEventDrop(info: any) {
    const appointment = info.event.extendedProps.appointment;
    const newStart = info.event.start;
    
    // Convertir la nouvelle date de local vers UTC pour la base de données
    const localDate = new Date(newStart);
    const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
    
    // Mettre à jour le RDV en base
    const updatedAppointment: Partial<Appointment> = {
      date: utcDate
    };

    this.appointmentService.updateAppointment(appointment._id, updatedAppointment).subscribe({
      next: (updated) => {
        console.log('Appointment moved:', updated);
        this.snackBar.open('Rendez-vous déplacé avec succès', 'Fermer', { duration: 3000 });
        
        // Mettre à jour les données de l'événement dans FullCalendar
        const updatedAppointmentData = { ...appointment, date: utcDate };
        info.event.setExtendedProp('appointment', updatedAppointmentData);
        
        // Mettre à jour aussi dans notre tableau local
        const index = this.appointments.findIndex(apt => apt._id === appointment._id);
        if (index !== -1) {
          this.appointments[index] = { ...this.appointments[index], date: utcDate };
        }
      },
      error: (error) => {
        console.error('Error moving appointment:', error);
        this.snackBar.open('Erreur lors du déplacement du rendez-vous', 'Fermer', { duration: 3000 });
        // Remettre l'événement à sa position d'origine
        info.revert();
      }
    });
  }

  handleEventResize(info: any) {
    const appointment = info.event.extendedProps.appointment;
    const newStart = info.event.start;
    const newEnd = info.event.end;
    
    // Calculer la nouvelle durée en minutes
    const newDuration = Math.round((newEnd.getTime() - newStart.getTime()) / 60000);
    
    // Convertir la nouvelle date de local vers UTC pour la base de données
    const localDate = new Date(newStart);
    const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
    
    // Mettre à jour le RDV en base
    const updatedAppointment: Partial<Appointment> = {
      date: utcDate,
      duration: newDuration
    };

    this.appointmentService.updateAppointment(appointment._id, updatedAppointment).subscribe({
      next: (updated) => {
        console.log('Appointment resized:', updated);
        this.snackBar.open('Durée du rendez-vous modifiée avec succès', 'Fermer', { duration: 3000 });
        
        // Mettre à jour les données de l'événement dans FullCalendar
        const updatedAppointmentData = { ...appointment, date: utcDate, duration: newDuration };
        info.event.setExtendedProp('appointment', updatedAppointmentData);
        
        // Mettre à jour aussi dans notre tableau local
        const index = this.appointments.findIndex(apt => apt._id === appointment._id);
        if (index !== -1) {
          this.appointments[index] = { ...this.appointments[index], date: utcDate, duration: newDuration };
        }
      },
      error: (error) => {
        console.error('Error resizing appointment:', error);
        this.snackBar.open('Erreur lors de la modification de la durée', 'Fermer', { duration: 3000 });
        // Remettre l'événement à sa taille d'origine
        info.revert();
      }
    });
  }
}
