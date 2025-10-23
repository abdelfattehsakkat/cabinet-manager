import { ROLE_PERMISSIONS, RolePermissions } from '../config/role-permissions.config';
import { UserRole } from '../../auth/models/user.model';

/**
 * Service de validation de la cohérence des permissions
 */
export class PermissionValidator {
  
  /**
   * Valide la cohérence entre les menus et les actions pour tous les rôles
   */
  static validateAllRoles(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    (Object.values(ROLE_PERMISSIONS) as RolePermissions[]).forEach(rolePermissions => {
      const roleErrors = this.validateRolePermissions(rolePermissions);
      errors.push(...roleErrors.map(error => `${rolePermissions.role}: ${error}`));
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valide la cohérence d'un rôle spécifique
   */
  static validateRolePermissions(rolePermissions: RolePermissions): string[] {
    const errors: string[] = [];
    
    // Vérification: si dashboard menu = true, alors viewDashboard action doit être true
    if (rolePermissions.menus.dashboard && !rolePermissions.actions.viewDashboard) {
      errors.push('Menu dashboard activé mais action viewDashboard désactivée');
    }
    
    // Vérification: si userManagement menu = true, alors manageUsers action doit être true
    if (rolePermissions.menus.userManagement && !rolePermissions.actions.manageUsers) {
      errors.push('Menu userManagement activé mais action manageUsers désactivée');
    }
    
    // Vérification: si treatments menu = true, alors au moins une action treatment doit être true
    if (rolePermissions.menus.treatments) {
      const hasAnyTreatmentAction = rolePermissions.actions.viewTreatments ||
                                   rolePermissions.actions.createTreatments ||
                                   rolePermissions.actions.editTreatments ||
                                   rolePermissions.actions.deleteTreatments;
      if (!hasAnyTreatmentAction) {
        errors.push('Menu treatments activé mais aucune action treatment autorisée');
      }
    }
    
    // Vérification: si patients menu = true, alors viewPatients doit être true
    if (rolePermissions.menus.patients && !rolePermissions.actions.viewPatients) {
      errors.push('Menu patients activé mais action viewPatients désactivée');
    }
    
    // Vérification: si calendar menu = true, alors viewAppointments doit être true
    if (rolePermissions.menus.calendar && !rolePermissions.actions.viewAppointments) {
      errors.push('Menu calendar activé mais action viewAppointments désactivée');
    }
    
    // Vérification logique: on ne peut pas créer sans pouvoir voir
    if (rolePermissions.actions.createPatients && !rolePermissions.actions.viewPatients) {
      errors.push('Permission createPatients sans viewPatients');
    }
    
    if (rolePermissions.actions.createTreatments && !rolePermissions.actions.viewTreatments) {
      errors.push('Permission createTreatments sans viewTreatments');
    }
    
    if (rolePermissions.actions.createAppointments && !rolePermissions.actions.viewAppointments) {
      errors.push('Permission createAppointments sans viewAppointments');
    }
    
    // Vérification logique: on ne peut pas éditer sans pouvoir voir
    if (rolePermissions.actions.editPatients && !rolePermissions.actions.viewPatients) {
      errors.push('Permission editPatients sans viewPatients');
    }
    
    if (rolePermissions.actions.editTreatments && !rolePermissions.actions.viewTreatments) {
      errors.push('Permission editTreatments sans viewTreatments');
    }
    
    if (rolePermissions.actions.editAppointments && !rolePermissions.actions.viewAppointments) {
      errors.push('Permission editAppointments sans viewAppointments');
    }
    
    // Vérification logique: on ne peut pas supprimer sans pouvoir voir
    if (rolePermissions.actions.deletePatients && !rolePermissions.actions.viewPatients) {
      errors.push('Permission deletePatients sans viewPatients');
    }
    
    if (rolePermissions.actions.deleteTreatments && !rolePermissions.actions.viewTreatments) {
      errors.push('Permission deleteTreatments sans viewTreatments');
    }
    
    if (rolePermissions.actions.deleteAppointments && !rolePermissions.actions.viewAppointments) {
      errors.push('Permission deleteAppointments sans viewAppointments');
    }
    
    return errors;
  }
  
  /**
   * Affiche un rapport de validation dans la console
   */
  static printValidationReport(): void {
    const validation = this.validateAllRoles();
    
    if (validation.valid) {
      console.log('✅ Configuration des permissions validée avec succès');
    } else {
      console.error('❌ Erreurs de configuration détectées:');
      validation.errors.forEach(error => {
        console.error(`  - ${error}`);
      });
    }
  }
  
  /**
   * Retourne un résumé des permissions par rôle
   */
  static getPermissionsSummary(): Record<UserRole, { menus: string[]; actions: string[] }> {
    const summary: Record<string, { menus: string[]; actions: string[] }> = {};
    
    (Object.entries(ROLE_PERMISSIONS) as [UserRole, RolePermissions][]).forEach(([role, permissions]) => {
      summary[role] = {
        menus: Object.entries(permissions.menus)
          .filter(([, enabled]) => enabled)
          .map(([menu]) => menu),
        actions: Object.entries(permissions.actions)
          .filter(([, enabled]) => enabled)
          .map(([action]) => action)
      };
    });
    
    return summary as Record<UserRole, { menus: string[]; actions: string[] }>;
  }
}