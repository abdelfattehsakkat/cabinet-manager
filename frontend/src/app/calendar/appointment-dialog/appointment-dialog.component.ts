import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { PatientService, Patient } from '../../patients/services/patient.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

interface AppointmentDialogData {
  date: Date;
  appointment?: any;
}

@Component({
  selector: 'app-appointment-dialog',
  templateUrl: './appointment-dialog.component.html',
  styleUrls: ['./appointment-dialog.component.scss'],
  standalone: true,
  imports: [SharedModule, MatAutocompleteModule]
})
export class AppointmentDialogComponent implements OnInit {
  appointmentForm: FormGroup;
  patients: Patient[] = [];
  filteredPatients: Observable<Patient[]> = new Observable<Patient[]>();
  
  appointmentTypes = [
    'Consultation',
    'Soins',
    'Suivi',
    'Urgence',
    'Autre'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentDialogData,
    private patientService: PatientService
  ) {
    console.log('Appointment dialog data:', data);
    
    const defaultAppointment = {
      patientId: '',
      patientName: '',
      date: data.date,
      duration: 30,
      type: 'Consultation générale',
      notes: ''
    };

    const appointment = data.appointment || defaultAppointment;
    console.log('Appointment data:', appointment);
    
    // Extract patient information properly
    let patientId = '';
    let patientName = '';
    
    if (appointment) {
      // Handle case where we have a patient ID directly
      if (appointment.patient && typeof appointment.patient === 'string') {
        patientId = appointment.patient;
      } else if (appointment.patientId) {
        patientId = appointment.patientId;
      }
      
      // Set patient name from patientName field if it exists
      if (appointment.patientName) {
        patientName = appointment.patientName;
      } 
      // Try to extract name from patient object if it exists
      else if (appointment.patient && typeof appointment.patient === 'object') {
        const patient = appointment.patient as any;
        if (patient.firstName && patient.lastName) {
          patientName = `${patient.firstName} ${patient.lastName}`;
        }
      }
    }
    
    console.log('Extracted patient info:', { patientId, patientName });

    this.appointmentForm = this.fb.group({
      patientId: [patientId, [Validators.required]],
      patientName: [patientName],
      date: [appointment.date, [Validators.required]],
      time: [this.getTimeString(appointment.date), [Validators.required]],
      duration: [appointment.duration, [Validators.required, Validators.min(15), Validators.max(120)]],
      type: [appointment.type || 'Consultation générale', [Validators.required]],
      notes: [appointment.notes]
    });
  }

  ngOnInit() {
    this.loadPatients();
    this.setupPatientAutocomplete();
    
    // If we have a patientId but no patientName, fetch the patient details
    const patientId = this.appointmentForm.get('patientId')?.value;
    const patientName = this.appointmentForm.get('patientName')?.value;
    
    if (patientId && (!patientName || patientName === 'undefined undefined')) {
      console.log('Fetching patient details for ID:', patientId);
      this.patientService.getPatient(patientId).subscribe({
        next: (patient) => {
          console.log('Patient details fetched:', patient);
          this.appointmentForm.patchValue({
            patientName: `${patient.firstName} ${patient.lastName}`
          });
        },
        error: (error) => {
          console.error('Error fetching patient details:', error);
        }
      });
    }
  }

  private loadPatients() {
    this.patientService.getPatients().subscribe(patients => {
      this.patients = patients;
      this.setupPatientAutocomplete();
    });
  }

  private setupPatientAutocomplete() {
    this.filteredPatients = this.appointmentForm.get('patientName')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPatients(value))
    );
  }

  private _filterPatients(value: string): Patient[] {
    const filterValue = value.toLowerCase();
    return this.patients.filter(patient => 
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(filterValue)
    );
  }

  onPatientSelected(patient: Patient) {
    console.log('Patient selected:', patient);
    if (patient && patient._id) {
      this.appointmentForm.patchValue({
        patientId: patient._id,
        patientName: `${patient.firstName} ${patient.lastName}`
      });
      console.log('Form values after patient selection:', this.appointmentForm.value);
    }
  }

  displayPatientFn(patient: Patient | string): string {
    // Handle case when input is already a string
    if (typeof patient === 'string') {
      return patient;
    }
    
    // Handle case when patient is null or undefined
    if (!patient) {
      return '';
    }
    
    // Check if firstName and lastName properties exist
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`;
    }
    
    // Fallback if we have a patient object but missing name properties
    return patient._id ? `Patient ${patient._id}` : '';
  }

  private getTimeString(date: Date): string {
    return date.toTimeString().substring(0, 5);
  }

  onSubmit() {
    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;
      const appointmentDate = new Date(formValue.date);
      const [hours, minutes] = formValue.time.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Convert to UTC
      const dateUTC = new Date(appointmentDate.getTime() - appointmentDate.getTimezoneOffset() * 60000);

      // Find the selected patient to get first name and last name
      const patientId = formValue.patientId;
      const selectedPatient = this.patients.find(patient => patient._id === patientId);
      
      // Include patient first name and last name in the result
      const result = {
        ...formValue,
        date: dateUTC
      };
      
      // Add patient first and last name if found
      if (selectedPatient) {
        result.patientFirstName = selectedPatient.firstName;
        result.patientLastName = selectedPatient.lastName;
      }

      this.dialogRef.close(result);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    if (field?.hasError('required')) {
      switch (fieldName) {
        case 'patientId': return 'Le patient est requis';
        case 'date': return 'La date est requise';
        case 'time': return 'L\'heure est requise';
        case 'duration': return 'La durée est requise';
        case 'type': return 'Le type de rendez-vous est requis';
        default: return 'Ce champ est requis';
      }
    }
    if (field?.hasError('min')) {
      return 'La durée minimale est de 15 minutes';
    }
    if (field?.hasError('max')) {
      return 'La durée maximale est de 120 minutes';
    }
    return '';
  }
}