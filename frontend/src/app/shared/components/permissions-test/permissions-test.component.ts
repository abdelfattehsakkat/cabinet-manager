import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../auth/services/auth.service';
import { MenuPermissionService } from '../../services/menu-permission.service';
import { PermissionValidator } from '../../services/permission-validator.service';
import { ROLE_PERMISSIONS, RolePermissions } from '../../config/role-permissions.config';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-permissions-test',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  template: `
    <div class="permissions-test-container">
      <mat-card class="test-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>verified_user</mat-icon>
            Test des Permissions
          </mat-card-title>
          <mat-card-subtitle>
            Utilisateur actuel: {{ currentUserDisplay }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Validation de la configuration -->
          <div class="validation-section">
            <h3>Validation de la Configuration</h3>
            <div [ngClass]="validationResult.valid ? 'validation-success' : 'validation-error'">
              <mat-icon>{{ validationResult.valid ? 'check_circle' : 'error' }}</mat-icon>
              {{ validationResult.valid ? 'Configuration valide' : 'Erreurs détectées' }}
            </div>
            <ul *ngIf="!validationResult.valid" class="error-list">
              <li *ngFor="let error of validationResult.errors">{{ error }}</li>
            </ul>
          </div>

          <!-- Test des menus -->
          <div class="menu-test-section">
            <h3>Test des Menus</h3>
            <div class="menu-grid">
              <div *ngFor="let menu of menuTests" class="menu-item">
                <mat-icon [ngClass]="menu.canAccess ? 'accessible' : 'restricted'">
                  {{ menu.canAccess ? 'check' : 'block' }}
                </mat-icon>
                <span>{{ menu.name }}</span>
                <small>{{ menu.canAccess ? 'Accessible' : 'Restreint' }}</small>
              </div>
            </div>
          </div>

          <!-- Test des actions -->
          <div class="actions-test-section">
            <h3>Test des Actions</h3>
            <div class="actions-grid">
              <div *ngFor="let action of actionTests" class="action-item">
                <mat-icon [ngClass]="action.canPerform ? 'accessible' : 'restricted'">
                  {{ action.canPerform ? 'check' : 'block' }}
                </mat-icon>
                <span>{{ action.name }}</span>
                <small>{{ action.canPerform ? 'Autorisé' : 'Interdit' }}</small>
              </div>
            </div>
          </div>

          <!-- Matrice complète -->
          <div class="matrix-section">
            <h3>Matrice des Permissions par Rôle</h3>
            <table mat-table [dataSource]="permissionsMatrix" class="permissions-table">
              <ng-container matColumnDef="feature">
                <th mat-header-cell *matHeaderCellDef>Fonctionnalité</th>
                <td mat-cell *matCellDef="let element">{{ element.feature }}</td>
              </ng-container>
              
              <ng-container matColumnDef="ADMIN">
                <th mat-header-cell *matHeaderCellDef>Admin</th>
                <td mat-cell *matCellDef="let element">
                  <mat-icon [ngClass]="element.ADMIN ? 'accessible' : 'restricted'">
                    {{ element.ADMIN ? 'check' : 'close' }}
                  </mat-icon>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="DOCTOR">
                <th mat-header-cell *matHeaderCellDef>Médecin</th>
                <td mat-cell *matCellDef="let element">
                  <mat-icon [ngClass]="element.DOCTOR ? 'accessible' : 'restricted'">
                    {{ element.DOCTOR ? 'check' : 'close' }}
                  </mat-icon>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="SECRETARY">
                <th mat-header-cell *matHeaderCellDef>Secrétaire</th>
                <td mat-cell *matCellDef="let element">
                  <mat-icon [ngClass]="element.SECRETARY ? 'accessible' : 'restricted'">
                    {{ element.SECRETARY ? 'check' : 'close' }}
                  </mat-icon>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .permissions-test-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .test-card {
      margin-bottom: 20px;
    }

    .validation-success {
      color: #4caf50;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .validation-error {
      color: #f44336;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-list {
      margin-top: 10px;
      color: #f44336;
    }

    .menu-grid, .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .menu-item, .action-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      flex-direction: column;
      text-align: center;
    }

    .accessible {
      color: #4caf50;
    }

    .restricted {
      color: #f44336;
    }

    .permissions-table {
      width: 100%;
      margin-top: 16px;
    }

    .matrix-section, .menu-test-section, .actions-test-section, .validation-section {
      margin-bottom: 24px;
    }

    h3 {
      color: #1976d2;
      margin-bottom: 12px;
    }
  `]
})
export class PermissionsTestComponent implements OnInit {
  validationResult = { valid: false, errors: [] as string[] };
  currentUserDisplay = 'Aucun utilisateur connecté';
  menuTests: { name: string; key: string; canAccess: boolean }[] = [];
  actionTests: { name: string; key: string; canPerform: boolean }[] = [];
  permissionsMatrix: any[] = [];
  displayedColumns = ['feature', 'ADMIN', 'DOCTOR', 'SECRETARY'];

  constructor(
    private authService: AuthService,
    private menuPermissionService: MenuPermissionService
  ) {}

  ngOnInit(): void {
    this.validateConfiguration();
    this.setupCurrentUser();
    this.setupMenuTests();
    this.setupActionTests();
    this.setupPermissionsMatrix();
  }

  private validateConfiguration(): void {
    this.validationResult = PermissionValidator.validateAllRoles();
  }

  private setupCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserDisplay = `${currentUser.firstName} ${currentUser.lastName} (${currentUser.role})`;
    }
  }

  private setupMenuTests(): void {
    const menus = [
      { name: 'Tableau de bord', key: 'dashboard' },
      { name: 'Patients', key: 'patients' },
      { name: 'Soins', key: 'treatments' },
      { name: 'Calendrier', key: 'calendar' },
      { name: 'Utilisateurs', key: 'userManagement' },
      { name: 'Paramètres', key: 'settings' },
      { name: 'Rapports', key: 'reports' }
    ];

    this.menuTests = menus.map(menu => ({
      ...menu,
      canAccess: this.menuPermissionService.canAccessMenu(menu.key)
    }));
  }

  private setupActionTests(): void {
    const actions = [
      { name: 'Voir patients', key: 'viewPatients' },
      { name: 'Créer patients', key: 'createPatients' },
      { name: 'Supprimer patients', key: 'deletePatients' },
      { name: 'Créer traitements', key: 'createTreatments' },
      { name: 'Supprimer traitements', key: 'deleteTreatments' },
      { name: 'Gérer utilisateurs', key: 'manageUsers' }
    ];

    this.actionTests = actions.map(action => ({
      ...action,
      canPerform: this.menuPermissionService.canPerformAction(action.key)
    }));
  }

  private setupPermissionsMatrix(): void {
    const features = [
      { feature: 'Dashboard', type: 'menu', key: 'dashboard' },
      { feature: 'Patients', type: 'menu', key: 'patients' },
      { feature: 'Soins', type: 'menu', key: 'treatments' },
      { feature: 'Gestion utilisateurs', type: 'menu', key: 'userManagement' },
      { feature: 'Supprimer patients', type: 'action', key: 'deletePatients' },
      { feature: 'Créer traitements', type: 'action', key: 'createTreatments' },
      { feature: 'Gérer utilisateurs', type: 'action', key: 'manageUsers' }
    ];

    this.permissionsMatrix = features.map(feature => {
      const result: any = { feature: feature.feature };
      
      (['ADMIN', 'DOCTOR', 'SECRETARY'] as UserRole[]).forEach(role => {
        const permissions = ROLE_PERMISSIONS[role];
        if (feature.type === 'menu') {
          result[role] = permissions.menus[feature.key as keyof RolePermissions['menus']];
        } else {
          result[role] = permissions.actions[feature.key as keyof RolePermissions['actions']];
        }
      });
      
      return result;
    });
  }
}