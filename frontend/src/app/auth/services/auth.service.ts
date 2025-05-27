import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>({
    id: 1,
    username: 'admin',
    email: 'admin@cabinet.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    createdAt: new Date(),
    lastLogin: new Date()
  });
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Remove session check temporarily
    this.currentUserSubject.next(this.getCurrentUser());
  }

  login(email: string, password: string): Observable<User> {
    // Skip actual login for now and return mock user
    const mockUser = this.getCurrentUser();
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    this.currentUserSubject.next(mockUser);
    return of(mockUser);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User {
    // Return mock admin user
    return {
      id: 1,
      username: 'admin',
      email: 'admin@cabinet.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      createdAt: new Date(),
      lastLogin: new Date()
    };
  }

  hasRole(role: UserRole): boolean {
    return true; // Always return true to bypass role checks
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/auth/users`);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/auth/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/auth/users/${id}`);
  }
}