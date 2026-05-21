/**
 * Module de sécurité frontend - ARCANA TECH
 *
 * Utilitaires pour :
 * - Sanitisation des entrées (prévention XSS)
 * - Validation des tokens JWT
 * - Gestion sécurisée du stockage
 * - Protection contre les injections
 */

// ═══════════════════════════════════════════════════════
// ═══ SANITISATION XSS ════════════════════════════════
// ═══════════════════════════════════════════════════════

/**
 * Échappe les caractères HTML dangereux
 * Utilisé pour tout texte affiché dynamiquement
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Supprime toutes les balises HTML d'une chaîne
 */
export function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitise une entrée utilisateur (trim + strip tags)
 */
export function sanitizeInput(value: string): string {
  return stripTags(value.trim());
}

/**
 * Sanitise un objet complet (toutes les valeurs string)
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(sanitized[key] as string);
    }
  }
  return sanitized;
}

// ═══════════════════════════════════════════════════════
// ═══ JWT UTILITIES ════════════════════════════════════
// ═══════════════════════════════════════════════════════

interface JwtPayload {
  sub: number;
  exp: number;
  iat: number;
  typ: string;
  uid: number;
  rol: string;
  jti: string;
}

/**
 * Décode le payload d'un JWT (sans vérifier la signature - c'est le backend qui vérifie)
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Vérifie si un token JWT est expiré côté client
 * Marge de 30 secondes pour anticiper les délais réseau
 */
export function isTokenExpired(token: string, marginSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - marginSeconds <= now;
}

/**
 * Retourne le temps restant avant expiration (en secondes)
 */
export function tokenTimeRemaining(token: string): number {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

// ═══════════════════════════════════════════════════════
// ═══ SECURE STORAGE ══════════════════════════════════
// ═══════════════════════════════════════════════════════

const STORAGE_PREFIX = 'uniaccess_';

/**
 * Stockage sécurisé avec préfixe et try/catch
 * (localStorage peut être désactivé ou plein)
 */
export const secureStorage = {
  set(key: string, value: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
  },

  get(key: string): string | null {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (e) {
      console.warn('Storage remove failed:', e);
    }
  },

  /**
   * Efface toutes les données ARCANA TECH du storage
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Storage clear failed:', e);
    }
  },
};

// ═══════════════════════════════════════════════════════
// ═══ URL VALIDATION ══════════════════════════════════
// ═══════════════════════════════════════════════════════

/**
 * Valide qu'une URL est sûre (pas de javascript:, data:, etc.)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Nettoie une URL de redirection pour éviter les open redirect
 */
export function sanitizeRedirectUrl(url: string, allowedPaths: string[] = ['/']): string {
  try {
    const parsed = new URL(url, window.location.origin);

    // Seules les URL du même origin sont autorisées
    if (parsed.origin !== window.location.origin) {
      return '/dashboard';
    }

    // Vérifier que le path commence par un des chemins autorisés
    if (allowedPaths.some((p) => parsed.pathname.startsWith(p))) {
      return parsed.pathname + parsed.search;
    }

    return '/dashboard';
  } catch {
    return '/dashboard';
  }
}

// ═══════════════════════════════════════════════════════
// ═══ RATE LIMITING CLIENT ════════════════════════════
// ═══════════════════════════════════════════════════════

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiter côté client (protection supplémentaire)
 */
export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxAttempts;
}
