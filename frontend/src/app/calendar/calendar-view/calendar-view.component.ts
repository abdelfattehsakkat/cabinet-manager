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
    initialView: 'dayGridMonth',
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    eventClick: this.handleEventClick.bind(this),
    eventContent: this.handleEventContent.bind(this)
  };

  constructor(
    private dialog: MatDialog,
    private appointmentService: AppointmentService,
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
        calendarApi.addEvent({
          id: appointment._id,
          title: appointment.patientName || 'Patient',
          start: new Date(appointment.date),
          end: new Date(new Date(appointment.date).getTime() + appointment.duration * 60000),
          extendedProps: {
            appointment: appointment
          }
        });
      });
    }
  }

  loadAppointments() {
    const startDate = new Date(this.selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(this.selectedDate);
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
    console.log('Date selected:', date);
    this.selectedDate = date;
    this.loadAppointments();
  }

  getTimeSlots(): string[] {
    const slots = [];
    let hour = 8; // Start at 8 AM
    
    while (hour < 18) { // End at 6 PM
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
      hour++;
    }
    
    return slots;
  }

  getAppointmentForSlot(timeSlot: string): Appointment | null {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDate = new Date(this.selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);
    
    // Convert to UTC for comparison
    const slotUTC = new Date(slotDate.getTime() - slotDate.getTimezoneOffset() * 60000);

    return this.appointments.find(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.getTime() === slotUTC.getTime();
    }) || null;
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
            const message = error.error?.message || 'Une erreur s\'est produite lors de la mise à jour du rendez-vous';
            this.snackBar.open(message, 'Fermer', { duration: 5000 });
          }
        });
      }
    });
  }

  deleteAppointment(appointmentOrId: Appointment | string) {
    const appointmentId = typeof appointmentOrId === 'string' ? appointmentOrId : appointmentOrId._id!;
    
    this.appointmentService.deleteAppointment(appointmentId).subscribe({
      next: () => {
        // Remove from appointments array if it exists there
        if (typeof appointmentOrId !== 'string') {
          const index = this.appointments.findIndex(a => a._id === appointmentId);
          if (index !== -1) {
            this.appointments.splice(index, 1);
          }
        }
        
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

  handleEventContent(arg: any) {
    return {
      html: `
        <div class="event-content">
          <span>${arg.event.title}</span>
          <button class="delete-btn" data-event-id="${arg.event.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `
    };
  }

  handleEventClick(info: any) {
    if (info.jsEvent.target.closest('.delete-btn')) {
      // Handle delete button click
      const eventId = info.event.id;
      this.deleteAppointment(eventId);
      return;
    }
    
    // Show appointment details if not clicking delete button
    const appointment = info.event.extendedProps.appointment;
    if (appointment) {
      this.showAppointmentDetails(appointment);
    }
  }
}
