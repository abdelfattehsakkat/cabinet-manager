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
          
          return user;
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
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
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout(); // Clear invalid data
      }
    }
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