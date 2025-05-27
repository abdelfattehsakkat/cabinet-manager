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
    const defaultAppointment = {
      patientId: '',
      patientName: '',
      date: data.date,
      duration: 30,
      type: 'Consultation',
      notes: ''
    };

    const appointment = data.appointment || defaultAppointment;

    this.appointmentForm = this.fb.group({
      patientId: [appointment.patientId, [Validators.required]],
      patientName: [appointment.patientName],
      date: [appointment.date, [Validators.required]],
      time: [this.getTimeString(appointment.date), [Validators.required]],
      duration: [appointment.duration, [Validators.required, Validators.min(15), Validators.max(120)]],
      type: [appointment.type, [Validators.required]],
      notes: [appointment.notes]
    });
  }

  ngOnInit() {
    this.loadPatients();
    this.setupPatientAutocomplete();
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
    this.appointmentForm.patchValue({
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`
    });
  }

  displayPatientFn(patient: Patient): string {
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
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

      this.dialogRef.close({
        ...formValue,
        date: dateUTC
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}