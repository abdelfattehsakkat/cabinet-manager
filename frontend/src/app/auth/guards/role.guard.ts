import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const requiredRoles = route.data['roles'] as UserRole[];
        if (!requiredRoles || requiredRoles.length === 0) {
          return true; // No specific roles required
        }

        const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);
        
        if (!hasRequiredRole) {
          // User doesn't have required role, redirect based on their role
          switch (user.role) {
            case 'SECRETARY':
              this.router.navigate(['/patients']);
              break;
            case 'DOCTOR':
              this.router.navigate(['/dashboard']);
              break;
            case 'ADMIN':
              this.router.navigate(['/dashboard']);
              break;
            default:
              this.router.navigate(['/unauthorized']);
          }
          return false;
        }

        return true;
      })
    );
  }
}