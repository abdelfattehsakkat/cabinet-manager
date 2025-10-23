import { Injectable } from '@angular/core';
import { UserRole } from '../../auth/models/user.model';
import { AuthService } from '../../auth/services/auth.service';
import { User } from '../../auth/models/user.model';
import { RolePermissionHelper, MENU_ITEMS, ACTIONS } from '../config/role-permissions.config';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles: UserRole[];
  visible: boolean;
  order: number;
}

export interface MenuSection {
  id: string;
  label: string;
  items: MenuItem[];
  roles: UserRole[];
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuPermissionService {
  
  private menuStructure: MenuSection[] = [
    {
      id: 'admin',
      label: 'Administration',
      roles: ['ADMIN'],
      visible: false,
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: 'dashboard',
          route: '/dashboard',
          roles: ['ADMIN'],
          visible: false,
          order: 1
        },
        {
          id: 'user-management',
          label: 'Gestion des utilisateurs',
          icon: 'group',
          route: '/auth/user-management',
          roles: ['ADMIN'],
          visible: false,
          order: 2
        }
      ]
    },
    {
      id: 'medical',
      label: 'Médical',
      roles: ['ADMIN', 'DOCTOR', 'SECRETARY'],
      visible: false,
      items: [
        {
          id: 'patients',
          label: 'Patients',
          icon: 'people',
          route: '/patients',
          roles: ['ADMIN', 'DOCTOR', 'SECRETARY'],
          visible: false,
          order: 10
        },
        {
          id: 'treatments',
          label: 'Soins',
          icon: 'medical_services',
          route: '/treatments',
          roles: ['ADMIN', 'DOCTOR'],
          visible: false,
          order: 20
        }
      ]
    },
    {
      id: 'planning',
      label: 'Planning',
      roles: ['ADMIN', 'DOCTOR', 'SECRETARY'],
      visible: false,
      items: [
        {
          id: 'calendar',
          label: 'Calendrier',
          icon: 'calendar_today',
          route: '/calendar',
          roles: ['ADMIN', 'DOCTOR', 'SECRETARY'],
          visible: false,
          order: 30
        }
      ]
    }
  ];

  constructor(private authService: AuthService) {
    // S'abonner aux changements d'utilisateur pour mettre à jour les permissions
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.updateMenuVisibility(user?.role || null);
    });
  }

  /**
   * Met à jour la visibilité des éléments de menu selon le rôle utilisateur
   */
  private updateMenuVisibility(userRole: UserRole | null): void {
    this.menuStructure.forEach(section => {
      // Vérifier si la section est visible pour ce rôle
      section.visible = userRole ? this.hasRoleAccess(userRole, section.roles) : false;
      
      // Mettre à jour la visibilité de chaque élément
      section.items.forEach(item => {
        item.visible = userRole ? this.hasRoleAccess(userRole, item.roles) : false;
      });
    });
  }

  /**
   * Vérifie si un rôle a accès à une liste de rôles autorisés
   */
  private hasRoleAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    // L'admin a accès à tout
    if (userRole === 'ADMIN') return true;
    
    // Vérifier si le rôle utilisateur est dans la liste des rôles autorisés
    return allowedRoles.includes(userRole);
  }

  /**
   * Retourne tous les éléments de menu visibles, triés par ordre
   */
  getVisibleMenuItems(): MenuItem[] {
    const visibleItems: MenuItem[] = [];
    
    this.menuStructure.forEach(section => {
      if (section.visible) {
        section.items.forEach(item => {
          if (item.visible) {
            visibleItems.push(item);
          }
        });
      }
    });
    
    // Trier par ordre
    return visibleItems.sort((a, b) => a.order - b.order);
  }

  /**
   * Retourne les sections de menu visibles
   */
  getVisibleMenuSections(): MenuSection[] {
    return this.menuStructure.filter(section => section.visible);
  }

  /**
   * Vérifie si un élément de menu spécifique est visible
   */
  isMenuItemVisible(itemId: string): boolean {
    for (const section of this.menuStructure) {
      const item = section.items.find(i => i.id === itemId);
      if (item) {
        return item.visible;
      }
    }
    return false;
  }

  /**
   * Vérifie si une section de menu est visible
   */
  isMenuSectionVisible(sectionId: string): boolean {
    const section = this.menuStructure.find(s => s.id === sectionId);
    return section ? section.visible : false;
  }

  /**
   * Retourne la route par défaut selon le rôle utilisateur
   */
  getDefaultRoute(userRole: UserRole): string {
    switch (userRole) {
      case 'ADMIN':
        return '/dashboard';
      case 'DOCTOR':
        return '/patients';
      case 'SECRETARY':
        return '/patients';
      default:
        return '/patients';
    }
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une route spécifique
   */
  canAccessRoute(route: string, userRole: UserRole): boolean {
    for (const section of this.menuStructure) {
      for (const item of section.items) {
        if (item.route === route) {
          return this.hasRoleAccess(userRole, item.roles);
        }
      }
    }
    return false;
  }

  /**
   * Retourne les permissions détaillées pour un rôle donné
   */
  getRolePermissions(role: UserRole): { sections: string[], items: string[], routes: string[] } {
    const permissions = {
      sections: [] as string[],
      items: [] as string[],
      routes: [] as string[]
    };

    this.menuStructure.forEach(section => {
      if (this.hasRoleAccess(role, section.roles)) {
        permissions.sections.push(section.id);
        
        section.items.forEach(item => {
          if (this.hasRoleAccess(role, item.roles)) {
            permissions.items.push(item.id);
            permissions.routes.push(item.route);
          }
        });
      }
    });

    return permissions;
  }

  /**
   * Vérifie si l'utilisateur actuel peut effectuer une action spécifique
   */
  canPerformAction(action: string): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    const permissions = RolePermissionHelper.getPermissions(currentUser.role);
    
    switch (action) {
      case 'viewPatients':
        return permissions.actions.viewPatients;
      case 'createPatients':
        return permissions.actions.createPatients;
      case 'editPatients':
        return permissions.actions.editPatients;
      case 'deletePatients':
        return permissions.actions.deletePatients;
      case 'viewTreatments':
        return permissions.actions.viewTreatments;
      case 'createTreatments':
        return permissions.actions.createTreatments;
      case 'editTreatments':
        return permissions.actions.editTreatments;
      case 'deleteTreatments':
        return permissions.actions.deleteTreatments;
      case 'viewAppointments':
        return permissions.actions.viewAppointments;
      case 'createAppointments':
        return permissions.actions.createAppointments;
      case 'editAppointments':
        return permissions.actions.editAppointments;
      case 'deleteAppointments':
        return permissions.actions.deleteAppointments;
      case 'manageUsers':
        return permissions.actions.manageUsers;
      case 'viewDashboard':
        return permissions.actions.viewDashboard;
      case 'accessReports':
        return permissions.actions.accessReports;
      case 'manageSettings':
        return permissions.actions.manageSettings;
      default:
        return false;
    }
  }

  /**
   * Vérifie si l'utilisateur actuel peut accéder à un menu spécifique
   */
  canAccessMenu(menu: string): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    const permissions = RolePermissionHelper.getPermissions(currentUser.role);
    
    switch (menu) {
      case 'dashboard':
        return permissions.menus.dashboard;
      case 'patients':
        return permissions.menus.patients;
      case 'treatments':
        return permissions.menus.treatments;
      case 'calendar':
        return permissions.menus.calendar;
      case 'userManagement':
        return permissions.menus.userManagement;
      case 'settings':
        return permissions.menus.settings;
      case 'reports':
        return permissions.menus.reports;
      default:
        return false;
    }
  }

  /**
   * Retourne la route par défaut pour l'utilisateur actuel
   */
  getCurrentUserDefaultRoute(): string {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return '/auth/login';
    
    return RolePermissionHelper.getDefaultRoute(currentUser.role);
  }

  /**
   * Retourne les détails des permissions pour l'utilisateur actuel
   */
  getCurrentUserPermissions() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return null;
    
    return RolePermissionHelper.getPermissions(currentUser.role);
  }
}