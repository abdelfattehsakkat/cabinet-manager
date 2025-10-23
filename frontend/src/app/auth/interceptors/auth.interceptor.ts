import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from the service
    const authToken = this.authService.getAuthToken();
    
    // Clone the request and add the authorization header if token exists
    let authReq = req;
    if (authToken) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${authToken}`)
      });
    }

    // Handle the request and catch any auth errors
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // If we get a 401 unauthorized error, logout the user and redirect to login
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
}