import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/services/auth.service';
import { User } from './auth/models/user.model';
import { Observable } from 'rxjs';
import { MenuPermissionService, MenuItem } from './shared/services/menu-permission.service';
import { HasPermissionDirective } from './shared/directives/has-permission.directive';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    HasPermissionDirective
  ]
})
export class AppComponent implements OnInit {
  title = 'Cabinet Médical';
  currentUser$: Observable<User | null>;
  visibleMenuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    public menuPermissionService: MenuPermissionService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    
    // S'abonner aux changements d'utilisateur pour mettre à jour le menu
    this.currentUser$.subscribe(user => {
      this.updateVisibleMenuItems();
    });
  }

  ngOnInit(): void {
    this.updateVisibleMenuItems();
  }

  private updateVisibleMenuItems(): void {
    this.visibleMenuItems = this.menuPermissionService.getVisibleMenuItems();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getUserDisplayName(user: any): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email?.split('@')[0] || 'Utilisateur';
  }

  getUserInitials(user: any): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    const email = user.email || '';
    return email.charAt(0).toUpperCase();
  }

  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'DOCTOR': 'Médecin',
      'SECRETARY': 'Secrétaire'
    };
    return roleMap[role] || role;
  }
}
