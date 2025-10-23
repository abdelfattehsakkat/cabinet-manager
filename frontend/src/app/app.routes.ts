import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { RoleGuard } from './auth/guards/role.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/patients', 
    pathMatch: 'full' 
  },
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'patients', 
    loadChildren: () => import('./patients/patients.module').then(m => m.PatientsModule),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR', 'SECRETARY'] }
  },
  { 
    path: 'calendar', 
    loadChildren: () => import('./calendar/calendar.module').then(m => m.CalendarModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'DOCTOR'] }
  },
  { 
    path: 'treatments', 
    loadChildren: () => import('./treatments/treatments.module').then(m => m.TreatmentsModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'DOCTOR'] }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'DOCTOR'] }
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(c => c.UnauthorizedComponent)
  },
  { 
    path: '**', 
    redirectTo: '/patients' 
  }
];
