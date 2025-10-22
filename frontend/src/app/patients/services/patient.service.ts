import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface PaginatedResponse {
  patients: Patient[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface PaginatedResponse {
  patients: Patient[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
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

  // Get patients with pagination and search
  searchPatients(page: number = 1, limit: number = 10, search: string = ''): Observable<PaginatedResponse> {
    console.log(`Searching patients: page=${page}, limit=${limit}, search="${search}"`);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    
    return this.http.get<PaginatedResponse>(`${this.apiUrl}/search`, { params }).pipe(
      tap(response => console.log('Search results received:', response))
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