import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { PatientService, Patient } from '../services/patient.service';

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
    MatTooltipModule
  ]
})
export class PatientListComponent implements OnInit {
  @ViewChild('patientDetailsDialog') patientDetailsDialog!: TemplateRef<any>;
  
  displayedColumns: string[] = ['lastName', 'firstName', 'dateOfBirth', 'phone', 'email', 'actions'];
  dataSource: MatTableDataSource<Patient>;
  selectedPatient: Patient | null = null;
  private patientDetailsDialogRef: MatDialogRef<any> | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private patientService: PatientService,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<Patient>([]);
  }

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    this.patientService.getPatients().subscribe(patients => {
      console.log('Loaded patients:', patients); // Debug log
      this.dataSource.data = patients;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'patient-details-dialog-panel'
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

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
}
