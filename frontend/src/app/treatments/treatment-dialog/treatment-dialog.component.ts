import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TreatmentService } from '../services/treatment.service';
import { Patient } from '../../patients/services/patient.service';

@Component({
  selector: 'app-treatment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './treatment-dialog.component.html',
  styleUrls: ['./treatment-dialog.component.scss']
})
export class TreatmentDialogComponent {
  treatmentForm: FormGroup;
  patient: Patient;

  constructor(
    private fb: FormBuilder,
    private treatmentService: TreatmentService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TreatmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { patient: Patient }
  ) {
    this.patient = data.patient;
    
    this.treatmentForm = this.fb.group({
      treatmentDate: [new Date(), Validators.required],
      dent: ['', [Validators.required, Validators.min(1), Validators.max(48)]],
      description: ['', Validators.required],
      honoraire: ['', [Validators.required, Validators.min(0)]],
      recu: ['', [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.treatmentForm.valid) {
      const treatmentData = {
        ...this.treatmentForm.value,
        patientId: this.patient._id,
        dent: Number(this.treatmentForm.value.dent),
        honoraire: Number(this.treatmentForm.value.honoraire),
        recu: Number(this.treatmentForm.value.recu)
      };

      this.treatmentService.createTreatment(treatmentData).subscribe({
        next: (treatment) => {
          this.snackBar.open('Soin ajouté avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(treatment);
        },
        error: (error) => {
          console.error('Error creating treatment:', error);
          this.snackBar.open('Erreur lors de l\'ajout du soin', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}