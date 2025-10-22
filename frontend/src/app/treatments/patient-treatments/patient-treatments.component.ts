import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { TreatmentService, Treatment } from '../services/treatment.service';
import { Patient, PatientService } from '../../patients/services/patient.service';

@Component({
  selector: 'app-patient-treatments',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './patient-treatments.component.html',
  styleUrls: ['./patient-treatments.component.scss']
})
export class PatientTreatmentsComponent implements OnInit {
  patient: Patient | null = null;
  treatments: Treatment[] = [];
  isLoading = false;
  patientId: string = '';
  
  displayedColumns: string[] = [
    'treatmentDate', 
    'dent', 
    'description', 
    'honoraire', 
    'recu',
    'balance'
  ];

  totalHonoraires = 0;
  totalRecu = 0;
  totalBalance = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private treatmentService: TreatmentService,
    private patientService: PatientService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.patientId = params['id'];
      if (this.patientId) {
        this.loadPatientData();
        this.loadTreatments();
      }
    });
  }

  loadPatientData(): void {
    this.isLoading = true;
    this.patientService.getPatient(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.snackBar.open('Erreur lors du chargement du patient', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadTreatments(): void {
    this.isLoading = true;
    this.treatmentService.getPatientTreatments(this.patientId).subscribe({
      next: (response) => {
        this.treatments = response.treatments.sort((a, b) => 
          new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime()
        );
        this.calculateTotals();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading treatments:', error);
        this.snackBar.open('Erreur lors du chargement des soins', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  calculateTotals(): void {
    this.totalHonoraires = this.treatments.reduce((sum, t) => sum + t.honoraire, 0);
    this.totalRecu = this.treatments.reduce((sum, t) => sum + t.recu, 0);
    this.totalBalance = this.totalRecu - this.totalHonoraires;
  }

  getBalance(treatment: Treatment): number {
    return treatment.recu - treatment.honoraire;
  }

  getBalanceColor(balance: number): string {
    if (balance < 0) return 'warn';  // Impayé (rouge/orange)
    if (balance === 0) return 'primary';  // Payé (bleu)
    return 'accent';  // Trop-perçu (vert)
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-TN', { 
      style: 'currency', 
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  goBack(): void {
    this.router.navigate(['/treatments']);
  }

  getPaymentStatus(treatment: Treatment): string {
    const balance = this.getBalance(treatment);
    if (balance === 0) return 'Payé';
    if (balance < 0) return 'Impayé';  // reçu < honoraire
    return 'Trop-perçu';  // reçu > honoraire
  }

  getPaymentStatusColor(treatment: Treatment): string {
    const balance = this.getBalance(treatment);
    if (balance === 0) return 'primary';
    if (balance < 0) return 'warn';  // Impayé
    return 'accent';  // Trop-perçu
  }

  formatPatientName(firstName: string, lastName: string): string {
    const toCamelCase = (str: string): string => {
      return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const formattedFirstName = toCamelCase(firstName || '');
    const formattedLastName = toCamelCase(lastName || '');
    
    return `${formattedFirstName} ${formattedLastName}`.trim();
  }

  calculateAge(dateOfBirth: Date | string): number | null {
    if (!dateOfBirth) return null;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Si l'anniversaire n'a pas encore eu lieu cette année
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  }

  getPatientDisplayName(): string {
    if (!this.patient) return '';
    
    const fullName = this.formatPatientName(this.patient.firstName, this.patient.lastName);
    const age = this.calculateAge(this.patient.dateOfBirth);
    
    if (age !== null) {
      return `${fullName}, ${age} ans`;
    }
    
    return fullName;
  }

  getPatientDisplayNameHtml(): string {
    if (!this.patient) return '';
    
    const fullName = this.formatPatientName(this.patient.firstName, this.patient.lastName);
    const age = this.calculateAge(this.patient.dateOfBirth);
    
    if (age !== null) {
      return `${fullName}, <span class="age">${age} ans</span>`;
    }
    
    return fullName;
  }
}