import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Appointment, AppointmentService } from '../services/appointment.service';

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class AppointmentDetailsComponent {
  constructor(
    public dialogRef: MatDialogRef<AppointmentDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { appointment: Appointment },
    private appointmentService: AppointmentService
  ) {}

  getPatientName(): string {
    return this.appointmentService.getPatientFullName(this.data.appointment);
  }

  getFormattedDate(): string {
    // Convertir correctement de UTC vers l'heure locale comme dans calendar-view
    const utcDate = new Date(this.data.appointment.date);
    const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    
    // Formatter la date en français
    return localDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + localDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  edit() {
    console.log('Edit button clicked');
    this.dialogRef.close({ action: 'edit' });
  }

  delete() {
    console.log('Delete button clicked');
    this.dialogRef.close({ action: 'delete' });
  }

  close() {
    this.dialogRef.close();
  }

  deleteAppointment(): void {
    this.dialogRef.close({ action: 'delete' });
  }
}
