import { Component, OnInit, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService, Patient, PaginatedResponse } from '../services/patient.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule
  ]
})
export class PatientListComponent implements OnInit, OnDestroy {
  @ViewChild('patientDetailsDialog') patientDetailsDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  displayedColumns: string[] = ['patientNumber', 'lastName', 'firstName', 'dateOfBirth', 'phone', 'actions'];
  dataSource: MatTableDataSource<Patient>;
  selectedPatient: Patient | null = null;
  private patientDetailsDialogRef: MatDialogRef<any> | null = null;
  
  // Pagination et recherche
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';
  isLoading = false;
  
  // Subject pour gérer le debounce de recherche
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  constructor(
    private router: Router,
    private patientService: PatientService,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<Patient>([]);
  }

  ngOnInit() {
    // Configuration du debounce pour la recherche
    this.searchSubject
      .pipe(
        debounceTime(300), // Attendre 300ms après la dernière frappe
        distinctUntilChanged(), // Ignorer si la valeur n'a pas changé
        takeUntil(this.destroy$) // Se désabonner lors de la destruction
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        this.currentPage = 1; // Reset à la première page lors d'une nouvelle recherche
        this.loadPatients();
      });

    // Charger les patients initiaux
    this.loadPatients();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPatients() {
    this.isLoading = true;
    this.patientService.searchPatients(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: PaginatedResponse) => {
          console.log('Loaded patients:', response);
          this.dataSource.data = response.patients;
          this.totalCount = response.pagination.totalCount;
          this.totalPages = response.pagination.totalPages;
          this.isLoading = false;
          
          // Mettre à jour le paginator avec les nouvelles données
          if (this.paginator) {
            this.paginator.length = this.totalCount;
            this.paginator.pageIndex = this.currentPage - 1;
            this.paginator.pageSize = this.pageSize;
          }
        },
        error: (error) => {
          console.error('Error loading patients:', error);
          this.isLoading = false;
        }
      });
  }

  // Nouvelle méthode pour gérer la recherche
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue.trim());
  }

  // Gestion du changement de page
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPatients();
  }

  addNewPatient() {
    this.router.navigate(['/patients/new']);
  }

  editPatient(id: string) {
    this.router.navigate(['/patients/edit', id]);
  }

  viewPatient(patient: Patient) {
    this.selectedPatient = patient;
    this.patientDetailsDialogRef = this.dialog.open(this.patientDetailsDialog, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'patient-details-dialog-panel',
      disableClose: false,
      autoFocus: false
    });
  }

  editPatientFromDialog() {
    if (this.selectedPatient && this.patientDetailsDialogRef) {
      this.patientDetailsDialogRef.close();
      this.editPatient(this.selectedPatient._id);
    }
  }

  deletePatient(patient: Patient) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      this.patientService.deletePatient(patient._id).subscribe(() => {
        this.loadPatients();
      });
    }
  }

  calculateAge(dateOfBirth: Date | undefined): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  viewPatientTreatments(): void {
    if (this.selectedPatient && this.patientDetailsDialogRef) {
      this.patientDetailsDialogRef.close();
      this.router.navigate(['/treatments/patient', this.selectedPatient._id]);
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
}
