import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';

interface AuthResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  token: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'current_user';
  private tokenCheckInterval?: number;

  constructor(private http: HttpClient) {
    // Check for existing session on service initialization
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<User> {
    const loginData: LoginRequest = { email, password };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData)
      .pipe(
        map(response => {
          // Store token and user data
          localStorage.setItem(this.tokenKey, response.token);
          
          const user: User = {
            id: response._id,
            username: response.email, // Using email as username
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            role: response.role,
            lastLogin: new Date()
          };
          
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUserSubject.next(user);
          
          // Démarrer la vérification d'expiration du token
          this.startTokenExpirationMonitoring();
          
          return user;
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.stopTokenExpirationMonitoring();
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  hasRole(role: UserRole): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    // Admin has access to everything
    if (currentUser.role === 'ADMIN') return true;
    
    // Check specific role
    return currentUser.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    // Admin has access to everything
    if (currentUser.role === 'ADMIN') return true;
    
    // Check if user has any of the specified roles
    return roles.includes(currentUser.role);
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userJson = localStorage.getItem(this.userKey);
    
    if (token && userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        // Démarrer la surveillance d'expiration pour une session existante
        this.startTokenExpirationMonitoring();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout(); // Clear invalid data
      }
    }
  }

  // Méthodes de gestion de l'expiration du token
  private startTokenExpirationMonitoring(): void {
    // Arrêter toute surveillance existante
    this.stopTokenExpirationMonitoring();
    
    // Vérifier toutes les minutes
    this.tokenCheckInterval = window.setInterval(() => {
      this.checkTokenExpiration();
    }, 60000);
  }

  private stopTokenExpirationMonitoring(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = undefined;
    }
  }

  private checkTokenExpiration(): void {
    const token = this.getAuthToken();
    
    if (!token) {
      return;
    }

    const payload = this.parseJwt(token);
    
    if (payload && payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = payload.exp - currentTime;
      
      // Si le token est expiré, déconnecter automatiquement
      if (timeUntilExpiration <= 0) {
        console.warn('Token expiré, déconnexion automatique');
        this.logout();
      }
    }
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  // Méthode publique pour obtenir le temps restant
  getTimeUntilExpiration(): number | null {
    const token = this.getAuthToken();
    
    if (!token) {
      return null;
    }

    const payload = this.parseJwt(token);
    
    if (payload && payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp - currentTime;
    }
    
    return null;
  }

  // API methods for user management
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/auth/users`);
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/auth/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/auth/users/${id}`);
  }

  register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    phoneNumber?: string;
    specialization?: string;
  }): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        map(response => ({
          id: response._id,
          username: response.email,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          role: response.role,
          createdAt: new Date()
        }))
      );
  }
}