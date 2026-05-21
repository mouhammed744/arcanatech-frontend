# Plan : Adaptation dynamique par université

## Résumé
Quand un admin s'inscrit et choisit son université, l'application s'adapte automatiquement :
- **Design** : couleurs de l'établissement (sidebar, accents, gradients)
- **Filières** : pré-remplies selon l'université choisie
- **Carte étudiant** : nombre de chiffres du matricule limité selon les règles de l'établissement

---

## Étape 1 — Backend : Migration + Seeder des universités

**Fichiers :**
- `database/migrations/xxxx_create_university_config_table.php`
- `database/seeders/UniversitySeeder.php`

**Table `universities`** (nouvelle ou enrichie) :
```
id, name, code, city,
primary_color (hex), secondary_color (hex), accent_preset (indigo|blue|sky|emerald|amber|rose|orange|teal),
student_id_digits (int), student_id_prefix (string nullable),
logo_url (string nullable),
created_at, updated_at
```

**Table `university_filieres`** (seed des filières par défaut) :
```
id, university_id, name, code, level, department, is_active, created_at, updated_at
```

**Seeder avec les 30+ universités** — données récoltées :

| Université | Code | Ville | Couleur primaire | Couleur secondaire | Preset | Digits ID | Préfixe |
|---|---|---|---|---|---|---|---|
| Université d'Abomey-Calavi | UAC | Abomey-Calavi | #1B3A6B (bleu marine) | #FFFFFF | blue | 8 | UAC |
| Université de Parakou | UP | Parakou | #1A6B3A (vert foncé) | #2563EB | emerald | 8 | UP |
| UNSTIM | UNSTIM | Abomey | #E65100 (orange) | #1565C0 | orange | 8 | UST |
| Université Nationale d'Agriculture | UNA | Kétou | #2E7D32 (vert) | #FDD835 | emerald | 8 | UNA |
| Institut National Médico-Sanitaire | INMeS | Cotonou | #C62828 (rouge) | #FFFFFF | rose | 8 | INM |
| ENS de Natitingou | ENS-N | Natitingou | #1565C0 (bleu) | #E8EAF6 | blue | 8 | ENS |
| Univ. Protestante Sandra Brindley | UPSB | Porto-Novo | #4A148C (violet) | #FFFFFF | indigo | 8 | UPS |
| UCAO-UUC | UCAO | Cotonou | #1565C0 (bleu) | #FFD600 (or) | blue | 8 | UCA |
| Institut Univ. du Bénin | IUB | Cotonou | #00838F (teal) | #FFFFFF | teal | 8 | IUB |
| UATM GASA Formation | UATM | Cotonou | #E65100 (orange) | #1565C0 | orange | 8 | UAT |
| HECM | HECM | Cotonou | #1565C0 (bleu) | #FFD600 | blue | 8 | HEC |
| ESGIS | ESGIS | Cotonou | #1565C0 (bleu) | #FF6D00 (orange) | blue | 8 | ESG |
| Institut CERCO | CERCO | Cotonou | #B71C1C (rouge) | #1565C0 | rose | 8 | CRC |
| Pigier Bénin | PIGIER | Cotonou | #D32F2F (rouge) | #FFFFFF | rose | 8 | PIG |
| ISM Adonaï | ISMA | Cotonou | #1B5E20 (vert) | #FFFFFF | emerald | 8 | ISM |
| CFPPS | CFPPS | Cotonou | #0277BD (bleu) | #FFFFFF | sky | 8 | CFP |
| Génie Civil Verechaguine | ESGC | Cotonou | #E65100 (orange) | #37474F | amber | 8 | VER |
| HNAUB | HNAUB | Cotonou | #1A237E (bleu foncé) | #C62828 | indigo | 8 | HNA |
| IRGIB Africa | IRGIB | Cotonou | #00695C (teal) | #FFD600 | teal | 8 | IRG |
| USTB | USTB | Cotonou | #1565C0 (bleu) | #FF6D00 | blue | 8 | USB |
| IUT Lokossa | IUT-L | Lokossa | #1B3A6B (bleu) | #E65100 | blue | 8 | IUT |
| EPAC | EPAC | Abomey-Calavi | #1B3A6B (bleu marine) | #FFD600 | blue | 8 | EPA |
| FSS | FSS | Cotonou | #C62828 (rouge) | #FFFFFF | rose | 8 | FSS |
| IFRI | IFRI | Abomey-Calavi | #1565C0 (bleu) | #00C853 | blue | 8 | IFR |
| ENAM | ENAM | Abomey-Calavi | #1B3A6B (bleu marine) | #B71C1C | indigo | 8 | ENA |
| ENEAM | ENEAM | Cotonou | #1B3A6B (bleu marine) | #FFD600 | blue | 8 | ENE |
| Sup'Management | SUPMA | Cotonou | #4A148C (violet) | #FFD600 | indigo | 8 | SUP |
| IMSP | IMSP | Porto-Novo | #1565C0 (bleu) | #FFFFFF | blue | 8 | IMS |
| Université de Lokossa | UL | Lokossa | #2E7D32 (vert) | #1565C0 | emerald | 8 | ULK |
| CBRST | CBRST | Cotonou | #0277BD (bleu clair) | #FFFFFF | sky | 8 | CBR |
| ISTI | ISTI | Cotonou | #E65100 (orange) | #37474F | amber | 8 | IST |
| ESTBA | ESTBA | Cotonou | #2E7D32 (vert) | #FFFFFF | emerald | 8 | EST |

Chaque université aura aussi ses **filières pré-remplies** (ex: UAC → Droit, Médecine, FAST, FSA, FLASH, EPAC... ; ESGIS → Informatique, Gestion, Commerce International...).

---

## Étape 2 — Backend : API University Config

**Fichier :** `app/Http/Controllers/Api/UniversityController.php`

Endpoints :
- `GET /api/universities` → Liste (pour le dropdown inscription)
- `GET /api/universities/{id}` → Détails + config thème
- `GET /api/universities/{id}/filieres` → Filières (existe déjà)

La réponse de `/api/auth/profile` doit inclure les données université :
```json
{
  "user": { ... },
  "university": {
    "id": 1,
    "name": "Université d'Abomey-Calavi",
    "code": "UAC",
    "primaryColor": "#1B3A6B",
    "secondaryColor": "#FFFFFF",
    "accentPreset": "blue",
    "studentIdDigits": 8,
    "studentIdPrefix": "UAC",
    "logoUrl": null
  }
}
```

---

## Étape 3 — Frontend : Types + Service université

**Fichier :** `src/types/university.types.ts` (nouveau)
```typescript
interface UniversityConfig {
  id: number;
  name: string;
  code: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  accentPreset: AccentColor;
  studentIdDigits: number;
  studentIdPrefix: string | null;
  logoUrl: string | null;
}
```

**Fichier :** `src/services/university.service.ts` (nouveau)

**Fichier :** `src/types/auth.types.ts` — Ajouter `universityId` et `university` au type `User`

---

## Étape 4 — Frontend : Theming dynamique au login

**Mécanisme :**
1. L'admin se connecte → `fetchProfileThunk` récupère user + university config
2. Le `accentPreset` de l'université est appliqué via `dispatch(setAccentColor(preset))`
3. Les couleurs custom (`primaryColor`, `secondaryColor`) sont injectées en CSS variables additionnelles
4. Le sidebar, header, et tous les composants s'adaptent automatiquement

**Fichier modifié :** `src/store/slices/authSlice.ts`
- Stocker `universityConfig` dans le state auth
- Après fetch profile, appliquer le thème automatiquement

**Fichier modifié :** `src/index.css`
- Ajouter de nouveaux presets d'accent : `orange`, `rose`, `teal` (pour couvrir toutes les universités)
- Ajouter des variables CSS custom : `--uni-primary`, `--uni-secondary`

**Fichier modifié :** `src/components/layout/Sidebar.tsx`
- Utiliser `--uni-primary` pour le fond si disponible, ou garder le preset accent

---

## Étape 5 — Frontend : Validation matricule étudiant

**Fichier modifié :** `src/pages/students/StudentFormPage.tsx`

- Récupérer `universityConfig` depuis Redux
- Le champ `studentNumber` :
  - Placeholder : `{prefix}-{0 × digits}` (ex: "UAC-00000000")
  - Validation Zod dynamique : `z.string().max(digits + prefix.length + 1)`
  - Compteur de caractères visible sous le champ
  - Message d'erreur : "Le matricule ne peut pas dépasser {n} chiffres"

---

## Étape 6 — Frontend : Filières auto-populées

**Déjà en place** grâce au service `filiereService.getAll(universityId)`.
Le seeder (étape 1) peuplera les filières par défaut pour chaque université.
Le select dans `StudentFormPage.tsx` affichera automatiquement les bonnes filières.

---

## Ordre d'implémentation

1. **Backend** : Migration table universities enrichie + seeder 30 universités avec couleurs/filières
2. **Backend** : API endpoint + inclusion dans profile response
3. **Frontend** : Types + service université
4. **Frontend** : Nouveaux presets CSS (orange, rose, teal) + variables uni-primary/uni-secondary
5. **Frontend** : Auth slice → stocker config + auto-appliquer thème au login
6. **Frontend** : Validation matricule dynamique dans StudentFormPage
7. **Test** : Vérifier inscription → login → dashboard s'adapte aux couleurs de l'université choisie

---

## Ce qui ne change PAS
- L'architecture Redux existante
- Les routes API existantes pour filières
- Le système de thème clair/sombre (l'admin peut toujours choisir)
- Le composant ConfigPage (l'accent sera pré-rempli mais modifiable)
