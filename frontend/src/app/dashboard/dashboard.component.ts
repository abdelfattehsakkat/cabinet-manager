import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { SharedModule } from '../shared/shared.module';
import { User } from '../auth/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="dashboard-container">
      <mat-card class="welcome-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>dashboard</mat-icon>
            Tableau de bord - Administration
          </mat-card-title>
          <mat-card-subtitle>
            Bienvenue {{ currentUser?.firstName }} {{ currentUser?.lastName }}
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="dashboard-stats">
            <div class="stat-card">
              <mat-icon>people</mat-icon>
              <div class="stat-content">
                <h3>Patients</h3>
                <p>Gestion des dossiers patients</p>
                <button mat-raised-button color="primary" routerLink="/patients">
                  Accéder
                </button>
              </div>
            </div>
            
            <div class="stat-card">
              <mat-icon>medical_services</mat-icon>
              <div class="stat-content">
                <h3>Soins</h3>
                <p>Gestion des traitements</p>
                <button mat-raised-button color="accent" routerLink="/treatments">
                  Accéder
                </button>
              </div>
            </div>
            
            <div class="stat-card">
              <mat-icon>event</mat-icon>
              <div class="stat-content">
                <h3>Calendrier</h3>
                <p>Gestion des rendez-vous</p>
                <button mat-raised-button routerLink="/calendar">
                  Accéder
                </button>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .mat-mdc-card-header {
      background: linear-gradient(135deg, #20c997 0%, #0dcaf0 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px 12px 0 0;
    }

    .mat-mdc-card-title {
      color: white !important;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }

    .mat-mdc-card-subtitle {
      color: rgba(255, 255, 255, 0.8) !important;
      margin-top: 8px;
    }

    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      padding: 24px;
    }

    .stat-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      transition: transform 0.2s ease;
      border: 1px solid #e9ecef;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #20c997;
      margin-bottom: 16px;
    }

    .stat-content h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-weight: 600;
    }

    .stat-content p {
      color: #666;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    .stat-content button {
      min-width: 120px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}