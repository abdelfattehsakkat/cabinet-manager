import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

// Material imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import { TreatmentService, Treatment, TreatmentPaginatedResponse } from '../services/treatment.service';
import { PatientService, Patient, PaginatedResponse } from '../../patients/services/patient.service';
// import { TreatmentFormComponent } from '../treatment-form/treatment-form.component';

@Component({
  selector: 'app-treatment-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './treatment-list.component.html',
  styleUrls: ['./treatment-list.component.scss']
})
export class TreatmentListComponent implements OnInit {
  patients: Patient[] = [];
  isLoading = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  hasNextPage = false;
  hasPrevPage = false;

  displayedColumns: string[] = [
    'patientNumber', 
    'firstName', 
    'lastName', 
    'phoneNumber',
    'actions'
  ];

  constructor(
    private treatmentService: TreatmentService,
    private patientService: PatientService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
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
          this.totalPages = response.pagination.totalPages;
          this.hasNextPage = response.pagination.hasNextPage;
          this.hasPrevPage = response.pagination.hasPrevPage;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading patients:', error);
          this.snackBar.open('Erreur lors du chargement des patients', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPatients();
  }

  addTreatmentForPatient(patient: Patient): void {
    // TODO: Ouvrir le formulaire d'ajout de soin pour ce patient
    this.snackBar.open(`Ajouter un soin pour ${patient.firstName} ${patient.lastName}`, 'Fermer', { duration: 3000 });
  }

  manageTreatments(patient: Patient): void {
    // En cours de construction - feature à développer plus tard
    this.snackBar.open(`Édition des soins pour ${patient.firstName} ${patient.lastName} - En cours de construction`, 'Fermer', { 
      duration: 3000 
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-TN', { 
      style: 'currency', 
      currency: 'TND' 
    }).format(amount);
  }
}