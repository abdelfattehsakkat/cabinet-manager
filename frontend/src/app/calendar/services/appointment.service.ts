import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '../../shared/services/config.service';

export interface Appointment {
  _id?: string;
  patient?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    [key: string]: any;
  };
  doctor: string | {
    _id: string;
    firstName: string;
    lastName: string;
    [key: string]: any;
  };
  patientFirstName: string;
  patientLastName: string;
  patientName?: string;
  patientNumber?: string;
  date: Date;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'noShow';
  type: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(private http: HttpClient, private configService: ConfigService) {}
  private get apiUrl(): string {
    return this.configService.apiUrl + '/appointments';
  }

  // Utility method to ensure backward compatibility with appointments
  // that may not have the new patientFirstName/patientLastName fields
  getPatientFullName(appointment: Appointment): string {
    // First try to use the dedicated fields
    if (appointment.patientFirstName && appointment.patientLastName) {
      return `${appointment.patientFirstName} ${appointment.patientLastName}`;
    }
    
    // Fall back to the patient object if it's populated
    if (typeof appointment.patient === 'object' && appointment.patient) {
      return `${appointment.patient.firstName} ${appointment.patient.lastName}`;
    }
    
    // Return a placeholder if no name is available
    return 'Unknown Patient';
  }

  // doctorId désactivé (application monopratique)
  getAppointments(params?: { 
    // doctorId?: string; 
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Observable<Appointment[]> {
    console.log('Fetching appointments with params:', params);
    return this.http.get<Appointment[]>(this.apiUrl, { params: params as any }).pipe(
      tap((appointments: Appointment[]) => console.log('Received appointments:', appointments))
    );
  }

  getAppointment(id: string): Observable<Appointment> {
    console.log('Fetching appointment:', id);
  return this.http.get<Appointment>(`${this.apiUrl}/${id}`).pipe(
      tap(appointment => console.log('Received appointment:', appointment))
    );
  }

  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    console.log('Creating appointment:', appointment);
  return this.http.post<Appointment>(this.apiUrl, appointment).pipe(
      tap(createdAppointment => console.log('Created appointment:', createdAppointment))
    );
  }

  updateAppointment(id: string, appointment: Partial<Appointment>): Observable<Appointment> {
    console.log('Updating appointment:', id, appointment);
  return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment).pipe(
      tap(updatedAppointment => console.log('Updated appointment:', updatedAppointment))
    );
  }

  deleteAppointment(id: string): Observable<void> {
    console.log('Deleting appointment:', id);
  return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Deleted appointment:', id))
    );
  }

  updateStatus(id: string, status: Appointment['status']): Observable<Appointment> {
    console.log('Updating appointment status:', id, status);
  return this.http.patch<Appointment>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      tap(updatedAppointment => console.log('Updated appointment status:', updatedAppointment))
    );
  }
}