import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { PatientService, Patient, PaginatedResponse } from '../../patients/services/patient.service';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
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
  appointmentForm!: FormGroup;
  filteredPatients: Observable<Patient[]> = new Observable<Patient[]>();
  selectedPatient: Patient | null = null;
  isNewPatient: boolean = false;
  
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
      date: this.data.date,
      time: '',
      duration: 30,
      type: '',
      notes: ''
    };

    const appointment = this.data.appointment || defaultAppointment;
    this.initForm(appointment);
  }

  private initForm(appointment: any) {
    console.log('Raw appointment data:', appointment);
    
    // Extract patient information
    let patientId = appointment.patientId || appointment.patient?._id || appointment.patient || '';
    let patientName = appointment.patientName || '';
    
    // If patientName is undefined or "undefined undefined", try to construct it
    if (!patientName || patientName === 'undefined undefined') {
      const firstName = appointment.patientFirstName || appointment.patient?.firstName || '';
      const lastName = appointment.patientLastName || appointment.patient?.lastName || '';
      if (firstName || lastName) {
        patientName = `${firstName} ${lastName}`.trim();
      }
    }
    
    console.log('Extracted patient info:', { patientId, patientName });

    // S'assurer que la date est un objet Date correct
    let appointmentDate = appointment.date;
    if (typeof appointmentDate === 'string') {
      // Convertir de UTC vers local pour l'affichage dans le formulaire
      const utcDate = new Date(appointmentDate);
      appointmentDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    } else if (!(appointmentDate instanceof Date)) {
      appointmentDate = new Date();
    }

    this.appointmentForm = this.fb.group({
      patientId: [patientId], // Optional - only required for existing patients
      patientName: [patientName, [Validators.required]], // Required for all appointments
      date: [appointmentDate, [Validators.required]],
      time: [this.getTimeString(appointment.date), [Validators.required]],
      duration: [appointment.duration, [Validators.required, Validators.min(15), Validators.max(120)]],
      type: [appointment.type || 'Consultation générale', [Validators.required]],
      notes: [appointment.notes]
    });

    // Set patient selection mode based on whether we have a patientId
    this.isNewPatient = !patientId;
  }

  ngOnInit() {
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
          this.selectedPatient = patient;
        },
        error: (error) => {
          console.error('Error fetching patient details:', error);
          // If we can't fetch patient details, allow user to edit the name
          this.appointmentForm.patchValue({
            patientName: ''
          });
        }
      });
    }
  }

  private setupPatientAutocomplete() {
    const patientNameControl = this.appointmentForm.get('patientName');
    if (patientNameControl) {
      this.filteredPatients = patientNameControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          if (!value || typeof value !== 'string' || value.length < 2) {
            return of([] as Patient[]);
          }
          return this.searchPatients(value);
        })
      );
    }
  }

  private searchPatients(query: string): Observable<Patient[]> {
    if (!query || query.length < 2) {
      return of([]);
    }

    return this.patientService.searchPatients(1, 10, query).pipe(
      map((response: PaginatedResponse) => response.patients),
      catchError((error) => {
        console.error('Error searching patients:', error);
        return of([]);
      })
    );
  }

  onPatientSelected(patient: Patient): void {
    this.selectedPatient = patient;
    this.isNewPatient = false;
    this.appointmentForm.patchValue({
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`
    });
  }

  onPatientInput(): void {
    // If user is typing a new name, reset selected patient
    this.selectedPatient = null;
    this.isNewPatient = true;
    this.appointmentForm.patchValue({
      patientId: null
    });
  }

  displayPatient(patient: Patient | string): string {
    if (typeof patient === 'string') {
      return patient;
    }
    
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

  private getTimeString(dateInput: Date | string): string {
    if (!dateInput) return '';
    
    // S'assurer qu'on a un objet Date
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Vérifier que c'est une date valide
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Appliquer la correction de fuseau horaire si nécessaire (UTC vers local)
    const utcDate = new Date(date);
    const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    
    // Forcer le format 24h en français
    const hours = localDate.getHours().toString().padStart(2, '0');
    const minutes = localDate.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }

  onSubmit() {
    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;
      const appointmentDate = new Date(formValue.date);
      const [hours, minutes] = formValue.time.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Convert to UTC
      const dateUTC = new Date(appointmentDate.getTime() - appointmentDate.getTimezoneOffset() * 60000);

      // Prepare the result
      const result = {
        ...formValue,
        date: dateUTC
      };

      // If we have a selected patient, include their details
      if (this.selectedPatient) {
        result.patientFirstName = this.selectedPatient.firstName;
        result.patientLastName = this.selectedPatient.lastName;
        result.patientNumber = this.selectedPatient.patientNumber || '';
      } else if (formValue.patientName) {
        // For new patients, extract first and last name from the input
        const nameParts = formValue.patientName.trim().split(' ');
        result.patientFirstName = nameParts[0] || '';
        result.patientLastName = nameParts.slice(1).join(' ') || '';
        result.patientNumber = ''; // Pas de numéro de fiche pour les nouveaux patients
        // No patientId for new patients
        result.patientId = null;
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
        case 'patientName': return 'Le nom du patient est requis';
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
