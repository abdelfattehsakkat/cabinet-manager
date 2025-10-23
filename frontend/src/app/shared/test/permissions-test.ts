import { PermissionValidator } from '../services/permission-validator.service';

/**
 * Script de test de la configuration des permissions
 * Exécute la validation et affiche un rapport détaillé
 */

console.log('🔍 Validation de la configuration des permissions...\n');

// Validation globale
PermissionValidator.printValidationReport();

console.log('\n📊 Résumé des permissions par rôle:\n');

// Affichage du résumé
const summary = PermissionValidator.getPermissionsSummary();

Object.entries(summary).forEach(([role, permissions]) => {
  console.log(`\n👤 ${role}:`);
  console.log(`  📋 Menus (${permissions.menus.length}): ${permissions.menus.join(', ')}`);
  console.log(`  ⚡ Actions (${permissions.actions.length}): ${permissions.actions.join(', ')}`);
});

console.log('\n✅ Test de validation terminé');

export { }; // Pour que ce soit un module