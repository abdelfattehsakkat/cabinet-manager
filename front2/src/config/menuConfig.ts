/**
 * Configuration centralisée des menus de l'application
 * Permet une gestion facile des permissions et de l'extensibilité
 */

export type MenuItemConfig = {
  key: string;
  label: string;
  icon: string;
  requiredPermission?: string; // Pour future gestion des permissions
  showInTabBar: boolean; // Si true, affiché dans le tab bar principal
  showInHamburger?: boolean; // Si true, affiché dans le menu hamburger (overflow)
  order: number; // Ordre d'affichage
};

/**
 * Configuration de tous les menus de l'application
 * 
 * Pour ajouter un nouveau menu :
 * 1. Ajouter une entrée ici avec showInTabBar=true (max 4 recommandés pour mobile car Profil prend 1 place)
 * 2. Si plus de 4 menus, mettre showInTabBar=false et showInHamburger=true
 * 3. Le menu apparaîtra automatiquement dans le menu "Plus"
 * 
 * Note: Le TabBar mobile affiche max 4 menus + Profil (= 5 items total)
 *       ou 3 menus + Plus + Profil si des menus sont dans hamburger
 */
export const MENU_CONFIG: MenuItemConfig[] = [
  {
    key: 'home',
    label: 'Accueil',
    icon: '🏠',
    showInTabBar: true,
    order: 1,
  },
  {
    key: 'patients',
    label: 'Patients',
    icon: '👥',
    showInTabBar: true,
    order: 2,
  },
  {
    key: 'treatments',
    label: 'Soins',
    icon: '💉',
    showInTabBar: true,
    order: 3,
  },
  {
    key: 'calendar',
    label: 'Agenda',
    icon: '📅',
    showInTabBar: true,
    order: 4,
  },
  {
    key: 'manager',
    label: 'Manager',
    icon: '⚙️',
    requiredPermission: 'ADMIN', // Seuls les admins peuvent voir ce menu
    showInTabBar: false, // Mis dans "Plus" car on a déjà 4 items (+ Profil = 5)
    showInHamburger: true,
    order: 5,
  },
  // Exemples de menus futurs (commentés pour l'instant)
  // {
  //   key: 'statistics',
  //   label: 'Statistiques',
  //   icon: '📊',
  //   showInTabBar: false,
  //   showInHamburger: true,
  //   order: 6,
  // },
  // {
  //   key: 'settings',
  //   label: 'Paramètres',
  //   icon: '⚙️',
  //   showInTabBar: false,
  //   showInHamburger: true,
  //   order: 7,
  // },
  // {
  //   key: 'users',
  //   label: 'Utilisateurs',
  //   icon: '👤',
  //   requiredPermission: 'admin',
  //   showInTabBar: false,
  //   showInHamburger: true,
  //   order: 8,
  // },
];

/**
 * Récupère les menus à afficher dans le tab bar
 * @param userPermissions Permissions de l'utilisateur (optionnel, pour future implémentation)
 * Note: Max 4 items retournés pour laisser place au bouton Profil (5e position)
 */
export function getTabBarMenus(userPermissions?: string[]): MenuItemConfig[] {
  return MENU_CONFIG
    .filter(item => item.showInTabBar)
    .filter(item => !item.requiredPermission || userPermissions?.includes(item.requiredPermission))
    .sort((a, b) => a.order - b.order)
    .slice(0, 4); // Maximum 4 items dans le tab bar (+ 1 pour Profil = 5 total)
}

/**
 * Récupère les menus à afficher dans le menu hamburger (overflow)
 * @param userPermissions Permissions de l'utilisateur (optionnel)
 */
export function getHamburgerMenus(userPermissions?: string[]): MenuItemConfig[] {
  const tabBarMenus = getTabBarMenus(userPermissions);
  const tabBarKeys = tabBarMenus.map(m => m.key);
  
  return MENU_CONFIG
    .filter(item => 
      // Soit explicitement marqué showInHamburger
      item.showInHamburger || 
      // Soit un menu showInTabBar mais qui n'est pas dans les 4 premiers (overflow automatique)
      (item.showInTabBar && !tabBarKeys.includes(item.key))
    )
    .filter(item => !item.requiredPermission || userPermissions?.includes(item.requiredPermission))
    .sort((a, b) => a.order - b.order);
}

/**
 * Vérifie si on doit afficher le bouton "Plus" dans le tab bar
 */
export function shouldShowMoreButton(): boolean {
  return MENU_CONFIG.filter(item => item.showInHamburger || item.order > 5).length > 0;
}
