---
Task ID: 2
Agent: Main Agent
Task: Implement intelligent CRM with AI-powered features

Work Log:
- Updated Prisma schema: added LeadStage (nouveau/contacte/en_discussion/a_relancer/gagne/perdu), ContactHistory model, lead scoring, AI suggestions, follow-up dates
- Built OpenRouter AI service with 7 free models + automatic fallback chain
- Created /api/ai/draft endpoint for AI message generation (WhatsApp, call script, email)
- Created /api/ai/analyze endpoint for lead scoring and AI suggestions
- Created /api/crm/leads endpoint with stage filtering and updates
- Created /api/crm/contact endpoint for contact history logging with auto-stage-advance
- Rebuilt Hermes store with full CRM state: LeadStage, ContactEntry, AI draft management
- Rebuilt LeadsScreen with 6 stage tabs + "Tous" filter, lead cards with score and stage badges
- Rebuilt LeadDetail with: score ring visualization, stage dropdown selector, AI draft generation panel, contact history timeline, action buttons
- Rebuilt HomeScreen with CRM pipeline stats, follow-up alerts, average score
- Rebuilt NotificationsScreen with CRM notification types (follow_up, relance, ai_suggestion)
- Updated seed data with diverse stages, contact counts, scores, and AI suggestions
- All lint checks pass, browser verification confirms all CRM features working

Stage Summary:
- Full CRM with 6-stage pipeline: Nouveau → Contacté → En Discussion → À Relancer → Gagné → Perdu
- AI service: 7 OpenRouter free models with automatic fallback + local fallback
- AI features: message drafting (WhatsApp/call/email), lead scoring, smart suggestions
- Auto stage advancement: nouveau→contacté after 1st contact, contacte→en_discussion after 2nd
- Contact history timeline per lead with AI-generated flag
- Follow-up tracking with nextFollowUpAt dates
- CRM notifications: follow-up reminders, relance alerts, AI suggestions

---
Task ID: 3
Agent: Main Agent
Task: Fix admin panel 500/503 errors on Vercel production (SQLite unreachable on serverless)

Work Log:
- Diagnosed root cause: app uses SQLite via Prisma with file:/home/z/my-project/db/custom.db. On Vercel's serverless environment the filesystem is read-only and the file doesn't exist, so every db.* call threw and routes returned 500/503. Frontend then crashed on `stats.users.total` because the error response had no `users` field.
- Created src/lib/mock-db.ts: in-memory Prisma-compatible client implementing findMany, findUnique, count, create, update, updateMany, delete, deleteMany, upsert. Supports where (equality, contains, OR, AND, NOT, gt/lt/in), select, include (with _count, user, lead, preferences), orderBy, skip, take. Seeded with realistic Cameroun-FR demo data: 6 users, 8 leads across all 6 stages, 5 contacts, 4 campaigns, 5 notifications, 5 audit logs, 3 settings, 2 preferences, 1 admin.
- Updated src/lib/db.ts: detects Vercel/serverless + file: DB URL, falls back to mock automatically. Also exposes withDbFallback() helper that retries on real Prisma, then mock, then returns safe default — used by all admin routes.
- Hardened all 9 admin API routes (stats, health, users, leads, campaigns, notifications, settings, audit, contacts, credits, export) so they return 200 with safe empty shapes on DB failure instead of 500/503. Health now reports `status: "degraded"` (HTTP 200) when forced to use mock.
- Hardened DashboardTab.tsx: defensive optional-chaining accessors for users/leads/campaigns/notifications; never crashes on missing fields. Added amber "Mode démo" banner when health.status === 'degraded' to inform the user that data shown is demo data and how to fix it (configure Postgres/Turso DATABASE_URL).
- Added vercel.json with 30s function timeout for API routes.
- Verified locally: build succeeds, server runs in VERCEL=1 mode and returns full valid JSON for all admin routes; write ops (PATCH lead, POST audit) persist within the in-memory session; export CSV works for all 4 entities; local non-Vercel mode still uses real SQLite (157 contacts in dev DB visible).
- Lint: no new errors introduced. Pre-existing react-hooks lint errors in AuditLogTab/ContactsTab/CampaignsTab/LeadsTab/UsersTab are unrelated to this fix.

Stage Summary:
- All admin API routes now return 200 with valid JSON in all environments (local SQLite OR serverless fallback to in-memory mock). The "Cannot read properties of undefined (reading 'total')" crash is fixed.
- Production behavior on Vercel: dashboard renders with seeded demo data and shows a banner explaining how to wire up a real hosted DB (Postgres/Turso) for persistence.
- Local dev behavior: unchanged — real Prisma + SQLite, real data, no banner.
- No data migration required; no schema change; no env var change needed for the fix to land. To enable real persistence on Vercel later, set DATABASE_URL to a hosted Postgres/Turso connection string (the mock auto-disables when DATABASE_URL is no longer a file: URL).

---
Task ID: 4
Agent: Main Agent
Task: Permettre à l'utilisateur de saisir plusieurs villes pour une campagne + sélectionner tout un pays

Work Log:
- Étendu le schéma Prisma ProspectionCampaign : ajout du champ `locations String @default("")` (format CSV "ISO2:CityName" ou "ISO2:all" pour tout un pays). Le champ `city` legacy est conservé pour la rétro-compat des vues admin et peuplé automatiquement depuis la première ville.
- Créé src/lib/locations.ts : liste hiérarchique de 13 pays (Cameroun, CI, SN, GA, CG, CD, TG, BJ, BF, ML, GN, FR, BE) avec drapeaux, indicatifs téléphoniques et 5–15 villes par pays. Fonctions utilitaires parseLocations(), formatLocations() (résumé humain lisible "🇨🇲 Douala, Yaoundé + 🇸🇳 tout le pays"), countLocations().
- Mis à jour src/store/procible-store.ts : ProspectionCampaign interface étendue avec le champ `locations`.
- Mis à jour src/lib/mock-db.ts : les 4 campagnes de démo ont maintenant des `locations` variés (multi-villes, tout pays). Le mock garantit que `city` est toujours dérivé de `locations` à la création et l'update.
- Réécrit src/components/procible/ProspectionForm.tsx : nouveau sélecteur hiérarchique avec recherche, accordéon par pays, chips pour les sélections, bouton "Tout le pays" par pays, compteur de zones, total recall de l'UX (un seul pays pouvait être choisi avant ; maintenant plusieurs villes de plusieurs pays + "tout le pays" coexistent). Le bouton submit affiche le nombre de zones.
- Créé src/app/api/prospection/route.ts : la route manquante ! Avant, le form postait vers /api/prospection qui n'existait pas. Maintenant la route : valide productName + locations, résout/crée un user démo, crée la ProspectionCampaign avec `locations` + `city` legacy, génère 3–8 leads par ville (4–8 par ville quand "tout le pays" sélectionné, sur 3 villes représentatives du pays), update leadsFound, log audit, envoie notification à l'utilisateur. Retourne campaign + 10 premiers leads pour feedback UI immédiat.
- Mis à jour src/app/admin/components/CampaignsTab.tsx : la liste affiche maintenant le résumé locations (formatLocations) + badge "X zones" si >1, et la bottom sheet de détail affiche les chips de chaque zone (drapeau + ville ou "Tout le pays"). Rétro-compatible : si locations absent, affiche l'ancien champ city.
- Mis à jour src/app/admin/api/export/route.ts : l'export CSV des campagnes inclut maintenant une colonne "Localisations" et une colonne "Ville (legacy)" séparée pour ne pas perdre d'info.
- Lint : aucune nouvelle erreur introduite (5 erreurs pré-existantes dans AuditLogTab/ContactsTab/CampaignsTab/LeadsTab/UsersTab sont dues à un pattern useEffect/setState React 19 et ne sont pas liées à ce changement).
- Build : OK, nouvelle route /api/prospection visible.
- Tests locaux en mode Vercel : POST /api/prospection avec locations="CM:Douala,CM:Yaounde,SN::all,CI:Abidjan" a créé 27 leads répartis sur 4 villes (Douala 6, Yaounde 3, Abidjan 4) + 3 villes du Sénégal (Dakar 6, Thiès 7, Saint-Louis 4 = 17 leads pour "tout le pays"). Les 35 leads visibles côté admin sont bien groupés par ville. Export CSV inclut les localisations.

Stage Summary:
- L'utilisateur peut maintenant sélectionner plusieurs villes (potentiellement dans plusieurs pays) + "Tout le pays" pour n'importe quel pays disponible, le tout dans la même campagne. Les sélections apparaissent comme chips supprimables individuellement.
- 13 pays disponibles (focus Afrique centrale/occidentale + France/Belgique pour la diaspora).
- Backend : nouvelle route /api/prospection robuste avec fallback mock DB, génération de leads réalistes par zone, notifications automatiques.
- Admin : vue liste + détail mises à jour pour exploiter le champ multi-zones ; export CSV mis à jour.
- Rétro-compat : le champ `city` continue d'être peuplé pour ne pas casser les vues admin existantes.

---
Task ID: 5
Agent: Main Agent
Task: Remplacer la liste fixe de pays par une saisie prédictive couvrant TOUS les pays et villes mondiales

Work Log:
- Récupéré la liste des 250 pays via countriesnow.space API (REST Countries est déprécié). Généré src/lib/all-countries.ts avec iso2, name (EN), dialCode normalisé. Fonctions utilitaires iso2ToFlag() (emoji depuis ISO2 via regional indicators) et countryNameFR() (utilise Intl.DisplayNames(['fr'], { type: 'region' }) — built-in Node.js 14+ et tous les navigateurs modernes, fallback sur le nom anglais).
- Réécrit src/lib/locations.ts pour utiliser all-countries comme source unique (suppression de la liste hardcodée à 13 pays). Re-exports ALL_COUNTRIES, COUNTRY_BY_ISO, iso2ToFlag, countryNameFR. parseLocations/formatLocations/countLocations inchangés en signature, mais supportent maintenant n'importe quel ISO2 mondial.
- Créé src/app/api/cities/route.ts : proxy serveur pour l'API Nominatim d'OpenStreetMap (gratuite, sans clé). Pourquoi un proxy : (1) ajoute le User-Agent obligatoire selon la politique d'usage Nominatim, (2) évite les problèmes CORS côté navigateur, (3) cache en mémoire 24h pour respecter la limite de 1 req/sec, (4) normalise la réponse en JSON compact [{ name, country, countryName, state, county, lat, lon }]. Filtre les résultats pour ne garder que les types city/town/village/municipality/county/hamlet, déduplique par nom.
- Réécrit src/components/procible/ProspectionForm.tsx avec deux champs autocomplete indépendants :
  • Pays : filtre ALL_COUNTRIES par nom EN, nom FR (via Intl.DisplayNames) ou ISO2, dropdown avec drapeau + nom FR + nom EN si différent + indicatif téléphonique. Sélection au clavier (flèches + Entrée). Cliquer un pays l'ajoute comme "Tout le pays" et pré-sélectionne ce pays comme filtre pour la recherche de villes.
  • Villes : requête /api/cities avec debounce 350ms + AbortController pour annuler les requêtes en vol. Fonctionne dans un pays spécifique (si sélectionné) ou dans le monde entier. Dropdown avec drapeau + nom + contexte (county, state, pays). Validation : minimum 2 caractères.
  • Chips supprimables individuellement (drapeau + ville ou "Tout {Pays}").
  • Bouton "Ajouter Tout {Pays}" qui apparaît quand un pays est actif mais pas encore ajouté comme "tout le pays".
  • Compteur de zones dans le label.
- Mis à jour /api/prospection/route.ts : suppression de la dépendance à COUNTRY_BY_ISO[iso2].cities (qui n'existe plus). Quand "tout le pays" est sélectionné, génère 6-11 leads taggés avec le nom FR du pays (au lieu d'essayer d'échantillonner des villes qu'on ne connaît pas pour les 250 pays). Quand une ville spécifique est sélectionnée, génère 3-7 leads taggés avec cette ville.
- Lint : aucune nouvelle erreur (5 erreurs pré-existantes non liées).
- Build : OK, nouvelle route /api/cities visible.
- Tests locaux en mode Vercel :
  • /api/cities?q=douala&country=cm → 2 résultats (Douala + Communauté urbaine de Douala, Wouri, Région du Littoral)
  • /api/cities?q=paris → 2 résultats (Paris, France + Paris, Texas, USA) — recherche mondiale fonctionne
  • /api/cities?q=marseille&country=fr → 1 résultat
  • /api/cities?q=d → liste vide (validation < 2 chars fonctionne)
  • POST /api/prospection avec locations="FR:Paris,JP::all" → 13 leads générés (Paris + Japon entier), campaign.locations="FR:Paris,JP::all", campaign.city="Paris" (legacy).

Stage Summary:
- L'utilisateur peut maintenant rechercher n'importe quel pays (250) et n'importe quelle ville mondiale via Nominatim/OpenStreetMap, sans limitation géographique.
- UX : deux champs autocomplete indépendants (pays + ville) + chips multi-sélection + bouton "Tout le pays" + compteur de zones. Navigation clavier complète (flèches + Entrée + Escape).
- Backend : nouveau proxy /api/cities avec cache 24h pour respecter la politique Nominatim. /api/prospection génère des leads pour n'importe quelle combinaison de pays/villes.
- Aucune clé API requise (Nominatim est gratuit et open source).
- Rétro-compat : les anciennes campagnes avec locations au format "ISO2:CityName" continuent de s'afficher correctement dans l'admin.

---
Task ID: 6
Agent: Main Agent
Task: Composant CTA sticky « Nouvelle recherche » + comportement ultra-agréable au scroll

Work Log:
- Créé src/components/procible/ProspectionCTA.tsx : composant CTA autonome qui ouvre le ProspectionForm via `setShowProspectionForm(true)`. Design : pill arrondi full-width avec gradient coral→violet, halo flou glow, streak shimmer animé (motion x: 0%→450%), icône Plus dans cercle blanc/tanslucent avec rotation 360° sur 6s, texte « Nouvelle recherche » + icône Sparkles. Animation float continue y: [0,-2,0] sur 3.5s. whileTap scale 0.97.
- Stratégie sticky bulletproof : le composant mesure dynamiquement la hauteur du header frère précédent (previousElementSibling) via ResizeObserver, et applique `style={{ top: headerHeight - 1 + 'px' }}` sur le wrapper sticky. Ainsi le CTA se cale exactement sous le header quel que soit l'écran (Home ~88px, Leads ~148px avec tabs, Notifications ~96px). z-30 (sous header z-40, au-dessus du contenu). Fond dégradé from-background via-background/95 to-transparent pour fondre visuellement avec le header au-dessus et le contenu en dessous.
- Placé `<ProspectionCTA />` juste après le header sticky dans 3 écrans :
  • src/components/procible/HomeScreen.tsx — après le header « Bonjour ProCible »
  • src/components/procible/LeadsScreen.tsx — après le header + tabs « Mes Clients »
  • src/components/procible/NotificationsScreen.tsx — après le header « Notifications »
- Pas placé sur Profile/Preferences/Credits/LeadDetail/Onboarding car ces écrans ne contiennent pas de données issues de recherches.
- Comportement au scroll vérifié par browser automation (iPhone 14 emulation) :
  • Home scrollé 800px : header « Bonjour ProCible 5 crédits » pinned top:0, CTA « Nouvelle recherche » pinned juste en-dessous, contenu (cartes statut, performance, Actions récentes) défile sous les deux.
  • Leads scrollé 500px : header « Mes Clients » + tabs pinned top:0, CTA pinned juste en-dessous, liste clients défile.
  • Notifications scrollé 300px : header « Notifications 3 non lues » pinned, CTA pinned juste en-dessous, liste notifs défile.
  • Profile : aucun CTA visible (comportement attendu).
- Clic sur le CTA ouvre bien le bottom-sheet ProspectionForm (vérifié : snapshot montre le header « Nouvelle campagne » + champ produit + zones cibles + bouton « Lancer la campagne »).
- Lint : aucune nouvelle erreur (5 pré-existantes dans admin tabs non liées).
- Build : OK.

Stage Summary:
- Le bouton « + » central du BottomNav reste comme accès rapide permanent.
- Le nouveau CTA « Nouvelle recherche » est un second point d'entrée plus visible et contextuel, placé juste sous le header sur les 3 écrans à données (Home/Leads/Notifications).
- Au scroll, header + CTA restent tous les deux pinned en haut (header z-40 au-dessus, CTA z-30 juste en-dessous), tout le reste du contenu défile sous eux. Animation continue float + shimmer + halo glow donne un effet « vivant » très agréable.
- La hauteur du header est mesurée dynamiquement (ResizeObserver), donc le CTA reste correctement positionné même si les headers changent de hauteur (par exemple quand le nombre de tabs change, ou si l'utilisateur redimensionne la fenêtre).
