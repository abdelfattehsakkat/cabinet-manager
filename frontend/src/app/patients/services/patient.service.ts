import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap } from 'rxjs';

export interface Patient {
  _id: string;
  patientNumber?: number;
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

  // Create a new patient
  createPatient(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiUrl}`, patient);
  }

  generateNextPatientNumber(): Observable<number> {
    // Pour l'instant, on simule la génération
    // Plus tard, on remplacera par un appel API
    return new Observable(observer => {
      // Simuler un appel async
      setTimeout(() => {
        // Pour le moment, on génère un numéro aléatoire
        // En production, ce sera récupéré du backend
        const nextNumber = Math.floor(Math.random() * 1000) + 1;
        observer.next(nextNumber);
        observer.complete();
      }, 100);
    });
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