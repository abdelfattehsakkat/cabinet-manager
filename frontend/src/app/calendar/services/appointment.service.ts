import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Appointment {
  _id?: string;
  patient: string;
  doctor: string;
  patientName?: string;
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
  private apiUrl = 'http://localhost:3000/api/appointments';

  constructor(private http: HttpClient) { }

  getAppointments(params?: { 
    doctorId?: string; 
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Observable<Appointment[]> {
    console.log('Fetching appointments with params:', params);
    return this.http.get<Appointment[]>(this.apiUrl, { params: params as any }).pipe(
      tap(appointments => console.log('Received appointments:', appointments))
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