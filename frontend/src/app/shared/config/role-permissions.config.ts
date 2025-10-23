import { UserRole } from '../../auth/models/user.model';

/**
 * Configuration des permissions par rôle
 * Définit précisément ce que chaque rôle peut voir et faire dans l'application
 */

export interface RolePermissions {
  role: UserRole;
  description: string;
  defaultRoute: string;
  menus: {
    dashboard: boolean;
    patients: boolean;
    treatments: boolean;
    calendar: boolean;
    userManagement: boolean;
    settings: boolean;
    reports: boolean;
  };
  actions: {
    // Patients
    viewPatients: boolean;
    createPatients: boolean;
    editPatients: boolean;
    deletePatients: boolean;
    
    // Traitements
    viewTreatments: boolean;
    createTreatments: boolean;
    editTreatments: boolean;
    deleteTreatments: boolean;
    
    // Rendez-vous
    viewAppointments: boolean;
    createAppointments: boolean;
    editAppointments: boolean;
    deleteAppointments: boolean;
    
    // Administration
    manageUsers: boolean;
    viewDashboard: boolean;
    accessReports: boolean;
    manageSettings: boolean;
  };
}

/**
 * Matrice complète des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    role: 'ADMIN',
    description: 'Administrateur - Accès complet à toutes les fonctionnalités',
    defaultRoute: '/dashboard',
    menus: {
      dashboard: true,
      patients: true,
      treatments: true,
      calendar: true,
      userManagement: true,
      settings: true,
      reports: true
    },
    actions: {
      // Patients
      viewPatients: true,
      createPatients: true,
      editPatients: true,
      deletePatients: true,
      
      // Traitements
      viewTreatments: true,
      createTreatments: true,
      editTreatments: true,
      deleteTreatments: true,
      
      // Rendez-vous
      viewAppointments: true,
      createAppointments: true,
      editAppointments: true,
      deleteAppointments: true,
      
      // Administration
      manageUsers: true,
      viewDashboard: true,
      accessReports: true,
      manageSettings: true
    }
  },

  DOCTOR: {
    role: 'DOCTOR',
    description: 'Médecin - Accès aux patients, traitements et planning',
    defaultRoute: '/dashboard',
    menus: {
      dashboard: true, 
      patients: true,
      treatments: true,
      calendar: true,
      userManagement: false,
      settings: false,
      reports: false
    },
    actions: {
      // Patients
      viewPatients: true,
      createPatients: true,
      editPatients: true,
      deletePatients: true,

      // Traitements
      viewTreatments: true,
      createTreatments: true,
      editTreatments: true,
      deleteTreatments: true,
      
      // Rendez-vous
      viewAppointments: true,
      createAppointments: true,
      editAppointments: true,
      deleteAppointments: true,
      
      // Administration
      manageUsers: true,
      viewDashboard: true,
      accessReports: true,
      manageSettings: true
    }
  },

  SECRETARY: {
    role: 'SECRETARY',
    description: 'Secrétaire - Accès aux patients et planning, consultation des traitements',
    defaultRoute: '/patients',
    menus: {
      dashboard: false, // Pas d'accès au dashboard
      patients: true,
      treatments: false, // Peut voir les traitements dans les dossiers patients mais pas de menu dédié
      calendar: true,
      userManagement: false,
      settings: false,
      reports: false
    },
    actions: {
      // Patients
      viewPatients: true,
      createPatients: true,
      editPatients: true,
      deletePatients: false,
      
      // Traitements
      viewTreatments: true, // Consultation seulement
      createTreatments: false,
      editTreatments: false,
      deleteTreatments: false,
      
      // Rendez-vous
      viewAppointments: true,
      createAppointments: true,
      editAppointments: true,
      deleteAppointments: false,
      
      // Administration
      manageUsers: false,
      viewDashboard: false, // Cohérent avec dashboard: false
      accessReports: false,
      manageSettings: false
    }
  }
};

/**
 * Service helper pour obtenir les permissions d'un rôle
 */
export class RolePermissionHelper {
  static getPermissions(role: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[role];
  }

  static hasMenuAccess(role: UserRole, menuKey: keyof RolePermissions['menus']): boolean {
    return ROLE_PERMISSIONS[role].menus[menuKey];
  }

  static hasActionPermission(role: UserRole, actionKey: keyof RolePermissions['actions']): boolean {
    return ROLE_PERMISSIONS[role].actions[actionKey];
  }

  static getDefaultRoute(role: UserRole): string {
    return ROLE_PERMISSIONS[role].defaultRoute;
  }

  static getRoleDescription(role: UserRole): string {
    return ROLE_PERMISSIONS[role].description;
  }

  static getAccessibleMenus(role: UserRole): string[] {
    const permissions = ROLE_PERMISSIONS[role];
    return Object.keys(permissions.menus).filter(menu => 
      permissions.menus[menu as keyof RolePermissions['menus']]
    );
  }

  static getAccessibleActions(role: UserRole): string[] {
    const permissions = ROLE_PERMISSIONS[role];
    return Object.keys(permissions.actions).filter(action => 
      permissions.actions[action as keyof RolePermissions['actions']]
    );
  }
}

/**
 * Constants pour faciliter l'utilisation dans les templates
 */
export const MENU_ITEMS = {
  DASHBOARD: 'dashboard',
  PATIENTS: 'patients',
  TREATMENTS: 'treatments',
  CALENDAR: 'calendar',
  USER_MANAGEMENT: 'userManagement',
  SETTINGS: 'settings',
  REPORTS: 'reports'
} as const;

export const ACTIONS = {
  VIEW_PATIENTS: 'viewPatients',
  CREATE_PATIENTS: 'createPatients',
  EDIT_PATIENTS: 'editPatients',
  DELETE_PATIENTS: 'deletePatients',
  VIEW_TREATMENTS: 'viewTreatments',
  CREATE_TREATMENTS: 'createTreatments',
  EDIT_TREATMENTS: 'editTreatments',
  DELETE_TREATMENTS: 'deleteTreatments',
  VIEW_APPOINTMENTS: 'viewAppointments',
  CREATE_APPOINTMENTS: 'createAppointments',
  EDIT_APPOINTMENTS: 'editAppointments',
  DELETE_APPOINTMENTS: 'deleteAppointments',
  MANAGE_USERS: 'manageUsers',
  VIEW_DASHBOARD: 'viewDashboard',
  ACCESS_REPORTS: 'accessReports',
  MANAGE_SETTINGS: 'manageSettings'
} as const;