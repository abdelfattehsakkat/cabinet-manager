import { NgModule } from '@angular/core';
import { PatientsRoutingModule } from './patients-routing.module';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientFormComponent } from './patient-form/patient-form.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    PatientsRoutingModule,
    PatientListComponent,
    PatientFormComponent
  ]
})
export class PatientsModule { }
