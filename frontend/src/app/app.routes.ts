import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/patients', pathMatch: 'full' }, // Change default route to patients
  { path: 'patients', loadChildren: () => import('./patients/patients.module').then(m => m.PatientsModule) },
  { path: 'calendar', loadChildren: () => import('./calendar/calendar.module').then(m => m.CalendarModule) },
  { path: '**', redirectTo: '/patients' }
];
