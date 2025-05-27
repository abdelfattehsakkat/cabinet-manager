import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
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
    MatInputModule
  ]
})
export class PatientListComponent implements OnInit {
  displayedColumns: string[] = ['lastName', 'firstName', 'dateOfBirth', 'phone', 'email', 'actions'];
  dataSource: MatTableDataSource<Patient>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private patientService: PatientService
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

  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
}
