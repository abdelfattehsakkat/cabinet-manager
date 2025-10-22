import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';

// Components - Now standalone components
import { TreatmentListComponent } from './treatment-list/treatment-list.component';
import { PatientTreatmentsComponent } from './patient-treatments/patient-treatments.component';
// import { TreatmentFormComponent } from './treatment-form/treatment-form.component';
// import { TreatmentDetailsComponent } from './treatment-details/treatment-details.component';

const routes = [
  { path: '', component: TreatmentListComponent },
  { path: 'patient/:id', component: PatientTreatmentsComponent }
  // { path: 'patient/:patientId', component: TreatmentDetailsComponent }
];

@NgModule({
  declarations: [
    // Tous les composants sont maintenant standalone
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    
    // Material Modules
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    MatListModule
  ]
})
export class TreatmentsModule { }