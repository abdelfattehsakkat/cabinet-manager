import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PatientService } from '../services/patient.service';

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class PatientFormComponent implements OnInit {
  patientForm: FormGroup;
  isEditMode = false;
  patientId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService
  ) {
    console.log('Initializing patient form');
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern(/^[0-9]*$/)]],  // Suppression de required
      email: ['', [Validators.email]],
      address: [''],  // Suppression de required
      medicalHistory: this.fb.group({
        conditions: [[]],
        allergies: [[]],
        medications: [[]],
        notes: ['']
      })
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      console.log('Edit mode - loading patient with ID:', id);
      this.isEditMode = true;
      this.patientId = id;
      this.loadPatient(id);
    }
  }

  private loadPatient(id: string) {
    console.log('Fetching patient data for ID:', id);
    this.patientService.getPatient(id).subscribe({
      next: (patient) => {
        console.log('Patient data received:', patient);
        this.patientForm.patchValue(patient);
      },
      error: (error) => {
        console.error('Error loading patient:', error);
      }
    });
  }

  onSubmit() {
    if (this.patientForm.valid) {
      console.log('Form submitted with values:', this.patientForm.value);

      if (this.isEditMode && this.patientId) {
        console.log('Updating existing patient');
        this.patientService.updatePatient(this.patientId, this.patientForm.value).subscribe({
          next: (patient) => {
            console.log('Patient updated successfully:', patient);
            this.router.navigate(['/patients']);
          },
          error: (error) => {
            console.error('Error updating patient:', error);
          }
        });
      } else {
        console.log('Creating new patient');
        this.patientService.createPatient(this.patientForm.value).subscribe({
          next: (patient) => {
            console.log('Patient created successfully:', patient);
            this.router.navigate(['/patients']);
          },
          error: (error) => {
            console.error('Error creating patient:', error);
          }
        });
      }
    } else {
      console.log('Form is invalid:', this.getFormValidationErrors());
    }
  }

  onCancel() {
    this.router.navigate(['/patients']);
  }

  getErrorMessage(controlName: string): string {
    const control = this.patientForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control?.hasError('email')) {
      return 'Email invalide';
    }
    if (control?.hasError('pattern')) {
      return 'Format invalide';
    }
    return '';
  }

  private getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.patientForm.controls).forEach(key => {
      const controlErrors = this.patientForm.get(key)?.errors;
      if (controlErrors != null) {
        errors[key] = controlErrors;
      }
    });
    return errors;
  }
}
