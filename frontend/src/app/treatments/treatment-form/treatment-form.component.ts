import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TreatmentService, Treatment } from '../services/treatment.service';
import { Patient } from '../../patients/services/patient.service';

interface DialogData {
  patient?: Patient;
  treatment?: Treatment;
  isEdit?: boolean;
}

@Component({
  selector: 'app-treatment-form',
  templateUrl: './treatment-form.component.html',
  styleUrls: ['./treatment-form.component.scss']
})
export class TreatmentFormComponent implements OnInit {
  treatmentForm: FormGroup;
  isEdit = false;
  isLoading = false;
  patient?: Patient;

  constructor(
    private fb: FormBuilder,
    private treatmentService: TreatmentService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<TreatmentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEdit = data.isEdit || false;
    this.patient = data.patient;

    this.treatmentForm = this.fb.group({
      treatmentDate: [new Date(), Validators.required],
      description: ['', [Validators.required, Validators.minLength(3)]],
      notes: [''],
      cost: ['', [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.treatment) {
      this.populateForm(this.data.treatment);
    }
  }

  populateForm(treatment: Treatment): void {
    this.treatmentForm.patchValue({
      treatmentDate: new Date(treatment.treatmentDate),
      description: treatment.description,
      notes: treatment.notes || '',
      cost: treatment.cost || ''
    });
  }

  onSubmit(): void {
    if (this.treatmentForm.valid) {
      this.isLoading = true;
      
      const formValue = this.treatmentForm.value;
      const treatmentData = {
        ...formValue,
        patientId: this.patient?._id || this.data.treatment?.patientId,
        cost: formValue.cost ? Number(formValue.cost) : undefined
      };

      const operation = this.isEdit && this.data.treatment
        ? this.treatmentService.updateTreatment(this.data.treatment._id, treatmentData)
        : this.treatmentService.createTreatment(treatmentData);

      operation.subscribe({
        next: (result) => {
          this.isLoading = false;
          this.dialogRef.close(result);
          
          const message = this.isEdit 
            ? 'Soin modifié avec succès' 
            : 'Soin ajouté avec succès';
          this.snackBar.open(message, 'Fermer', { duration: 3000 });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving treatment:', error);
          this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.treatmentForm.controls).forEach(key => {
      const control = this.treatmentForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getPatientDisplayName(): string {
    if (this.patient) {
      return `${this.patient.firstName} ${this.patient.lastName} (N°${this.patient.patientNumber})`;
    }
    if (this.data.treatment) {
      return `${this.data.treatment.patientName} (N°${this.data.treatment.patientNumber})`;
    }
    return 'Patient non spécifié';
  }

  getFormTitle(): string {
    return this.isEdit ? 'Modifier le Soin' : 'Nouveau Soin';
  }
}