import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '../../shared/services/config.service';

export interface Treatment {
  _id: string;
  patientId: string;
  patientNumber: number;
  patientName: string;
  treatmentDate: Date;
  dent: number; // Numéro de la dent
  description: string;
  honoraire: number; // Montant des honoraires
  recu: number; // Montant reçu
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentPaginatedResponse {
  treatments: Treatment[];
  patient?: {
    _id: string;
    patientNumber: number;
    firstName: string;
    lastName: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface TreatmentStats {
  totalTreatments: number;
  totalCost: number;
  lastTreatmentDate: Date | null;
  firstTreatmentDate: Date | null;
}


@Injectable({
  providedIn: 'root'
})
export class TreatmentService {
  constructor(private http: HttpClient, private configService: ConfigService) { }

  get apiUrl(): string {
    return this.configService.apiUrl + '/treatments';
  }

  // Get all treatments with pagination and search
  getAllTreatments(page: number = 1, limit: number = 10, search: string = ''): Observable<TreatmentPaginatedResponse> {
    console.log(`Fetching all treatments: page=${page}, limit=${limit}, search="${search}"`);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    
    return this.http.get<TreatmentPaginatedResponse>(this.apiUrl, { params }).pipe(
      tap(response => console.log('All treatments received:', response))
    );
  }

  // Get treatments for a specific patient
  getPatientTreatments(patientId: string, page: number = 1, limit: number = 10): Observable<TreatmentPaginatedResponse> {
    console.log(`Fetching treatments for patient ${patientId}: page=${page}, limit=${limit}`);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<TreatmentPaginatedResponse>(`${this.apiUrl}/patient/${patientId}`, { params }).pipe(
      tap(response => console.log('Patient treatments received:', response))
    );
  }

  // Get single treatment
  getTreatment(id: string): Observable<Treatment> {
    console.log(`Fetching treatment with ID: ${id}`);
    return this.http.get<Treatment>(`${this.apiUrl}/${id}`).pipe(
      tap(treatment => console.log('Treatment details received:', treatment))
    );
  }

  // Create a new treatment
  createTreatment(treatment: Partial<Treatment>): Observable<Treatment> {
    console.log('Creating new treatment:', treatment);
    return this.http.post<Treatment>(this.apiUrl, treatment).pipe(
      tap(createdTreatment => console.log('Treatment created successfully:', createdTreatment))
    );
  }

  // Update treatment
  updateTreatment(id: string, treatment: Partial<Treatment>): Observable<Treatment> {
    console.log(`Updating treatment ${id}:`, treatment);
    return this.http.put<Treatment>(`${this.apiUrl}/${id}`, treatment).pipe(
      tap(updatedTreatment => console.log('Treatment updated successfully:', updatedTreatment))
    );
  }

  // Delete treatment
  deleteTreatment(id: string): Observable<void> {
    console.log(`Deleting treatment with ID: ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Treatment deleted successfully'))
    );
  }

  // Get treatment statistics for a patient
  getPatientTreatmentStats(patientId: string): Observable<TreatmentStats> {
    console.log(`Fetching treatment stats for patient: ${patientId}`);
    return this.http.get<TreatmentStats>(`${this.apiUrl}/patient/${patientId}/stats`).pipe(
      tap(stats => console.log('Treatment stats received:', stats))
    );
  }
}