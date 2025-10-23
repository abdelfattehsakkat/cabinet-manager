import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-content>
          <div class="unauthorized-content">
            <mat-icon class="unauthorized-icon">block</mat-icon>
            <h1>Accès non autorisé</h1>
            <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <div class="actions">
              <button mat-raised-button color="primary" (click)="goBack()">
                <mat-icon>arrow_back</mat-icon>
                Retour
              </button>
              <button mat-stroked-button (click)="logout()">
                <mat-icon>logout</mat-icon>
                Se déconnecter
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .unauthorized-card {
      max-width: 500px;
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .unauthorized-content {
      text-align: center;
      padding: 40px 20px;
    }

    .unauthorized-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 20px;
    }

    h1 {
      color: #333;
      margin-bottom: 16px;
      font-weight: 500;
    }

    p {
      color: #666;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    button {
      min-width: 140px;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goBack(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      // Redirect based on user role
      switch (user.role) {
        case 'SECRETARY':
          this.router.navigate(['/patients']);
          break;
        case 'DOCTOR':
          this.router.navigate(['/patients']);
          break;
        case 'ADMIN':
          this.router.navigate(['/dashboard']);
          break;
        default:
          this.router.navigate(['/patients']);
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}