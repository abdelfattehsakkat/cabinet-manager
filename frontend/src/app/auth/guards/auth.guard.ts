import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

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
        const isAuthenticated = this.authService.isAuthenticated();
        
        if (!isAuthenticated) {
          // User is not authenticated, redirect to login
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }

        // Check if specific roles are required for this route
        const requiredRoles = route.data['roles'] as UserRole[];
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);
          
          if (!hasRequiredRole) {
            // User doesn't have required role, redirect to unauthorized page
            this.router.navigate(['/unauthorized']);
            return false;
          }
        }

        return true;
      })
    );
  }
}