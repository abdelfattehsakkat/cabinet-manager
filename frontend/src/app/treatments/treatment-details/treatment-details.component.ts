import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';

import { TreatmentService, Treatment, TreatmentPaginatedResponse, TreatmentStats } from '../services/treatment.service';
import { TreatmentFormComponent } from '../treatment-form/treatment-form.component';

interface PatientInfo {
  _id: string;
  patientNumber: number;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-treatment-details',
  templateUrl: './treatment-details.component.html',
  styleUrls: ['./treatment-details.component.scss']
})
export class TreatmentDetailsComponent implements OnInit {
  treatments: Treatment[] = [];
  patient?: PatientInfo;
  stats?: TreatmentStats;
  isLoading = false;
  isLoadingStats = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  hasNextPage = false;
  hasPrevPage = false;

  displayedColumns: string[] = ['treatmentDate', 'description', 'cost', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private treatmentService: TreatmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const patientId = params['patientId'];
      if (patientId) {
        this.loadTreatments(patientId);
        this.loadStats(patientId);
      }
    });
  }

  loadTreatments(patientId: string): void {
    this.isLoading = true;
    
    this.treatmentService.getPatientTreatments(patientId, this.currentPage, this.pageSize)
      .subscribe({
        next: (response: TreatmentPaginatedResponse) => {
          this.treatments = response.treatments;
          this.patient = response.patient;
          this.totalCount = response.pagination.totalCount;
          this.totalPages = response.pagination.totalPages;
          this.hasNextPage = response.pagination.hasNextPage;
          this.hasPrevPage = response.pagination.hasPrevPage;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading treatments:', error);
          this.snackBar.open('Erreur lors du chargement des soins', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  loadStats(patientId: string): void {
    this.isLoadingStats = true;
    
    this.treatmentService.getPatientTreatmentStats(patientId)
      .subscribe({
        next: (stats: TreatmentStats) => {
          this.stats = stats;
          this.isLoadingStats = false;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.isLoadingStats = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    if (this.patient) {
      this.loadTreatments(this.patient._id);
    }
  }

  addTreatment(): void {
    if (!this.patient) return;

    // Create a minimal patient object for the form
    const patientForForm = {
      _id: this.patient._id,
      patientNumber: this.patient.patientNumber,
      firstName: this.patient.firstName,
      lastName: this.patient.lastName,
      dateOfBirth: new Date(), // Placeholder
      email: '',
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const dialogRef = this.dialog.open(TreatmentFormComponent, {
      width: '600px',
      data: { patient: patientForForm, isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTreatments(this.patient!._id);
        this.loadStats(this.patient!._id);
        this.snackBar.open('Soin ajouté avec succès', 'Fermer', { duration: 3000 });
      }
    });
  }

  editTreatment(treatment: Treatment): void {
    const dialogRef = this.dialog.open(TreatmentFormComponent, {
      width: '600px',
      data: { treatment, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.patient) {
        this.loadTreatments(this.patient._id);
        this.loadStats(this.patient._id);
        this.snackBar.open('Soin modifié avec succès', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteTreatment(treatment: Treatment): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce soin du ${this.formatDate(treatment.treatmentDate)} ?`)) {
      this.treatmentService.deleteTreatment(treatment._id).subscribe({
        next: () => {
          if (this.patient) {
            this.loadTreatments(this.patient._id);
            this.loadStats(this.patient._id);
          }
          this.snackBar.open('Soin supprimé avec succès', 'Fermer', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting treatment:', error);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/treatments']);
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

  getPatientDisplayName(): string {
    if (!this.patient) return '';
    return `${this.patient.firstName} ${this.patient.lastName}`;
  }
}