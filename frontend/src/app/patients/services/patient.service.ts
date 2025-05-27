import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  email: string;
  phoneNumber: string;
  address: string;
  medicalHistory?: {
    conditions: string[];
    allergies: string[];
    medications: string[];
    notes: string;
  };
  documents: any[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:3000/api/patients';

  constructor(private http: HttpClient) { }

  getPatients(): Observable<Patient[]> {
    console.log('Fetching patients from API');
    return this.http.get<Patient[]>(this.apiUrl).pipe(
      tap(patients => console.log('Patients received:', patients))
    );
  }

  getPatient(id: string): Observable<Patient> {
    console.log(`Fetching patient with ID: ${id}`);
    return this.http.get<Patient>(`${this.apiUrl}/${id}`).pipe(
      tap(patient => console.log('Patient details received:', patient))
    );
  }

  createPatient(patient: Partial<Patient>): Observable<Patient> {
    console.log('Creating new patient:', patient);
    return this.http.post<Patient>(this.apiUrl, patient).pipe(
      tap(createdPatient => console.log('Patient created successfully:', createdPatient))
    );
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    console.log(`Updating patient ${id}:`, patient);
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient).pipe(
      tap(updatedPatient => console.log('Patient updated successfully:', updatedPatient))
    );
  }

  deletePatient(id: string): Observable<void> {
    console.log(`Deleting patient with ID: ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Patient deleted successfully'))
    );
  }
}