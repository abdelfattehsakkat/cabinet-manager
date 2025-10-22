import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

// Material imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PatientService, Patient, PaginatedResponse } from '../../patients/services/patient.service';

@Component({
  selector: 'app-patient-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-selector.component.html',
  styleUrls: ['./patient-selector.component.scss']
})
export class PatientSelectorComponent implements OnInit {
  patients: Patient[] = [];
  isLoading = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;

  displayedColumns: string[] = ['patientNumber', 'name', 'phoneNumber', 'actions'];

  constructor(
    private patientService: PatientService,
    private dialogRef: MatDialogRef<PatientSelectorComponent>
  ) {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadPatients();
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    
    this.patientService.searchPatients(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: PaginatedResponse) => {
          this.patients = response.patients;
          this.totalCount = response.pagination.totalCount;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading patients:', error);
          this.isLoading = false;
        }
      });
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  selectPatient(patient: Patient): void {
    this.dialogRef.close(patient);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  loadMore(): void {
    if (this.currentPage * this.pageSize < this.totalCount) {
      this.currentPage++;
      this.loadPatients();
    }
  }

  getPatientFullName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }
}