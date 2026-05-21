/**
 * Flag "vient de se connecter" — stocké au niveau module JS.
 *
 * Propriétés :
 *  • Survit aux navigations React (SPA) et aux re-renders.
 *  • Détruit au rechargement de page (F5) car le module JS est réinitialisé.
 *  • Non affecté par StrictMode (le flag est consommé une seule fois).
 */

let _freshLogin = false;

/** Appelé juste après un login réussi. */
export function markFreshLogin(): void {
  _freshLogin = true;
}

/**
 * Lit et consomme le flag (one-shot).
 * Le deuxième appel retourne toujours false.
 */
export function consumeFreshLogin(): boolean {
  const value = _freshLogin;
  _freshLogin = false;
  return value;
}

/** Pour les tests / dev uniquement. */
export function isFreshLogin(): boolean {
  return _freshLogin;
}
