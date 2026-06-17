# ProCible

<p align="center">
  <strong>Votre assistant personnel de prospection IA</strong><br>
  Trouve des clients pour vous chaque nuit 🌙
</p>

---

## Aperçu

ProCible est une application PWA de prospection commerciale intelligente conçue pour les entrepreneurs camerounais. Elle combine un CRM léger avec l'intelligence artificielle pour automatiser la recherche de prospects et la rédaction de messages de prospection.

**Les données de démonstration sont automatiquement peuplées au premier accès** — vos investisseurs verront immédiatement 8 leads, 5 notifications et les préférences configurées.

### Identité visuelle

- **Gradient principal** : `#FF7B54` (coral) → `#6C3FA9` (violet)
- **Couleurs sémantiques** : Teal `#2EC4B6`, Amber `#FFB347`, Vert `#4CAF50`
- **Design** : Mobile-first, arrondis généreux, animations fluides

---

## Fonctionnalités

### 🏠 Accueil
- Dashboard avec statistiques CRM en temps réel
- Nombre de nouveaux prospects trouvés par ProCible
- Campagnes de prospection actives avec indicateur de statut
- Alertes de relance et suivi à faire
- Pipeline visuel (Nouveau → Contacté → En discussion → À relancer → Gagné/Perdu)
- Score moyen des leads et leads gagnés

### 🔍 Prospection
- Formulaire intuitif en bottom sheet pour lancer une prospection
- Saisie du produit/service avec description
- Upload de photos du produit (max 5, base64)
- **Ville de prospection avec saisie prédictive** — seules les villes du système sont sélectionnables
- 16 villes camerounaises disponibles (Douala, Yaoundé, Bafoussam, etc. + quartiers)
- Animation de succès à la création

### 👥 Leads / CRM
- Liste des leads avec filtres par étape du pipeline
- Fiche lead détaillée avec score visuel (jauge circulaire)
- Historique des contacts (appels, WhatsApp, emails, visites, notes)
- Changement d'étape avec animation confetti pour les leads gagnés
- Synthèse vocale du profil lead

### 🤖 Intelligence Artificielle
- **Génération de brouillons IA** (WhatsApp, script d'appel, email)
- **7 modèles gratuits OpenRouter avec fallback automatique** :
  1. DeepSeek R1
  2. Qwen 3 32B
  3. Gemma 3 27B
  4. Llama 4 Maverick
  5. Mistral Small 3.1
  6. Gemma 3 12B
  7. Phi-4 Reasoning
- **Analyse IA des leads** avec score et suggestion d'action
- **Fallback local** sans clé API — l'app fonctionne entièrement hors ligne
- Copier-coller des brouillons en un tap

### 🔔 Notifications
- Alertes de nouveaux prospects
- Rappels de suivi et relances
- Conseils IA personnalisés
- Navigation directe vers le lead concerné

### 👤 Profil & Abonnement
- Gestion du profil utilisateur
- Plans : Gratuit (5 leads/nuit), Starter (20 leads/nuit), Pro (50 leads/nuit)
- Crédits et historique
- Méthodes de paiement Mobile Money (MTN, Orange)

### ⚙️ Préférences
- Sélection des secteurs d'activité cibles (12 secteurs)
- Zones géographiques (16 villes/quartiers)
- Sauvegarde des préférences pour les recherches nocturnes

### 📱 PWA
- Installable sur mobile (manifest.json, icônes)
- Mode standalone, orientation portrait
- Thème couleur ProCible

---

## Stack technique

| Technologie | Usage |
|---|---|
| **Next.js 16** | Framework React avec App Router + Turbopack |
| **TypeScript** | Typage statique |
| **Tailwind CSS 4** | Styles utilitaires + design system custom |
| **Framer Motion** | Animations et transitions fluides |
| **Zustand** | State management léger |
| **Prisma** | ORM pour PostgreSQL (Neon) |
| **Neon** | PostgreSQL serverless (compatible Vercel) |
| **shadcn/ui** | Composants UI accessibles |
| **Lucide React** | Icônes |
| **OpenRouter** | API IA multi-modèles avec fallback |

---

## Installation locale

### Prérequis

- **Node.js** 18+ (recommandé : 20+)
- **PostgreSQL** local OU une base Neon
- **npm** ou **bun**

### Étapes

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd procible

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditez .env avec votre DATABASE_URL PostgreSQL

# 4. Créer la base et pousser le schéma
npx prisma db push

# 5. Lancer en développement
npm run dev
```

L'application est accessible sur **http://localhost:3000**

Les données de démo sont automatiquement créées au premier chargement (8 leads, 5 notifications, préférences).

### Build de production

```bash
npm run build
npm start
```

---

## Déploiement sur Vercel (recommandé)

### Étape 1 : Créer une base Neon PostgreSQL

1. Allez sur [neon.tech](https://neon.tech) et créez un compte gratuit
2. Créez un nouveau projet → nommez-le `procible`
3. Copiez la **connection string** fournie (format : `postgresql://username:password@ep-xxx.neon.tech/hermes?sslmode=require`)

### Étape 2 : Déployer sur Vercel

1. Poussez le code sur GitHub
2. Allez sur [vercel.com](https://vercel.com) et importez le repo
3. Dans **Settings → Environment Variables**, ajoutez :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | Votre connection string Neon |
| `OPENROUTER_API_KEY` | (optionnel) Votre clé OpenRouter |

4. Cliquez **Deploy**

### Étape 3 : Initialiser les données de démo

Une fois déployé, visitez simplement votre URL Vercel. Les données de démo (8 leads camerounais, notifications, préférences) sont **automatiquement peuplées au premier accès** via le mécanisme d'auto-seed.

> **Note** : Si vous voulez re-réinitialiser les données, vous pouvez appeler `POST /api/seed` manuellement.

### Configuration Vercel alternative (CLI)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ajouter les variables d'environnement
vercel env add DATABASE_URL
vercel env add OPENROUTER_API_KEY

# Redéployer avec les variables
vercel --prod
```

---

## Configuration IA (optionnel)

ProCible fonctionne **sans clé API** grâce à un système de fallback local qui génère des messages de prospection basiques.

Pour activer l'IA complète :

1. Créez un compte sur [openrouter.ai](https://openrouter.ai)
2. Générez une clé API (gratuite pour les modèles gratuits)
3. Ajoutez-la dans les variables d'environnement Vercel ou dans `.env` :

```env
OPENROUTER_API_KEY=sk-or-v1-votre-cle-ici
```

L'app essaiera automatiquement les 7 modèles gratuits dans l'ordre, et passera au suivant si l'un échoue.

---

## Structure du projet

```
procible/
├── prisma/
│   └── schema.prisma          # Modèles PostgreSQL (User, Lead, ContactHistory, etc.)
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon-192.png           # Icône PWA
│   ├── icon-512.png           # Icône PWA
│   └── sw.js                  # Service Worker
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── analyze/   # Analyse IA d'un lead
│   │   │   │   └── draft/     # Génération de brouillon IA
│   │   │   ├── crm/
│   │   │   │   ├── contact/   # Historique de contacts
│   │   │   │   └── leads/     # CRUD leads
│   │   │   ├── leads/         # API leads simplifiée
│   │   │   ├── notifications/ # Notifications
│   │   │   ├── preferences/   # Préférences utilisateur
│   │   │   ├── prospection/   # Campagnes de prospection
│   │   │   └── seed/          # Auto-seed des données démo
│   │   ├── globals.css        # Styles globaux + thème ProCible
│   │   ├── layout.tsx         # Layout racine (meta, PWA, fonts)
│   │   └── page.tsx           # Page principale (routing + seed)
│   ├── components/
│   │   ├── procible/
│   │   │   ├── BottomNav.tsx          # Navigation basse
│   │   │   ├── ConfettiEffect.tsx     # Animation confetti
│   │   │   ├── HomeScreen.tsx         # Écran d'accueil
│   │   │   ├── LeadDetail.tsx         # Détail d'un lead
│   │   │   ├── LeadsScreen.tsx        # Liste des leads
│   │   │   ├── NotificationsScreen.tsx # Notifications
│   │   │   ├── Onboarding.tsx         # Onboarding 3 étapes
│   │   │   ├── PreferencesScreen.tsx  # Préférences
│   │   │   ├── ProfileScreen.tsx      # Profil utilisateur
│   │   │   ├── ProspectionForm.tsx    # Formulaire de prospection
│   │   │   └── SkeletonLoaders.tsx    # États de chargement
│   │   └── ui/                # Composants shadcn/ui
│   ├── hooks/
│   ├── lib/
│   │   ├── ai-service.ts     # Service IA OpenRouter + fallback
│   │   ├── constants.ts      # Villes, secteurs, helpers
│   │   ├── db.ts             # Instance Prisma + auto-seed
│   │   └── utils.ts          # Utilitaires
│   └── store/
│       └── procible-store.ts   # Store Zustand (state global)
├── .env.example               # Variables d'environnement template
├── vercel.json                # Configuration Vercel
├── next.config.ts             # Configuration Next.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Données de démonstration

Au premier accès, ProCible crée automatiquement :

### Utilisateur démo
- **Téléphone** : +237 600 000 000
- **Plan** : Starter (12 crédits)
- **Onboarded** : true (pas d'onboarding à refaire)

### 8 leads camerounais
| Nom | Entreprise | Secteur | Ville | Étape | Score |
|---|---|---|---|---|---|
| Marie Ndongo | Restaurant Le Palmier | Restauration | Douala | Nouveau | 55 |
| Jean-Pierre Fotso | Fotso Electronics | Commerce | Yaoundé | Contacté | 60 |
| Fatou Amadou | Salon Beauté Fatou | Beauté | Douala | En discussion | 75 |
| Paul Essomba | Cyber Cafe Digital | Services | Bafoussam | À relancer | 40 |
| Chloé Mbarga | Mbarga Fashion House | Mode | Douala | Nouveau | 50 |
| Alain Toukam | Toukam Auto Parts | Automobile | Yaoundé | Contacté | 65 |
| Sylvie Ngassa | Ngassa Catering | Restauration | Douala | Gagné | 95 |
| Ibrahim Haman | Haman Tech Solutions | Technologie | Garoua | Nouveau | 52 |

### 5 notifications
- Nouveaux prospects trouvés par ProCible
- Suivi requis pour Paul Essomba
- Conseil IA pour Fatou Amadou
- Relance urgente
- Message de bienvenue

### Préférences
- Secteurs : Restauration, Commerce, Beauté, Technologie, Mode
- Villes : Douala, Yaoundé

---

## Modèles de données

### User
Utilisateur de l'application avec plan d'abonnement et crédits.

### Lead
Prospect commercial avec pipeline complet (nouveau → contacté → en discussion → à relancer → gagné/perdu), score IA, source (Maps, Facebook, Instagram, LinkedIn).

### ContactHistory
Historique des interactions avec un lead (appels, WhatsApp, emails, visites, notes). Les messages générés par l'IA sont marqués.

### ProspectionCampaign
Campagne de prospection lancée par l'utilisateur. Contient le produit/service, les images, la ville cible et le nombre de leads trouvés.

### Preference
Préférences de recherche de l'utilisateur (secteurs, villes, type d'entreprise).

### Notification
Alertes et rappels (nouveaux leads, suivis, relances, conseils IA).

---

## Villes disponibles

16 villes et quartiers camerounais :

| Ville | Région |
|---|---|
| Douala | Littoral |
| Yaoundé | Centre |
| Bafoussam | Ouest |
| Garoua | Nord |
| Buea | Sud-Ouest |
| Maroua | Extrême-Nord |
| Bamenda | Nord-Ouest |
| Ebolowa | Sud |
| Akwa (Douala) | Littoral |
| Bonapriso (Douala) | Littoral |
| Deido (Douala) | Littoral |
| Bonamoussadi (Douala) | Littoral |
| Bastos (Yaoundé) | Centre |
| Centre-Ville Yaoundé | Centre |
| Nlongkak (Yaoundé) | Centre |
| Centre-Ville Bafoussam | Ouest |

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Génère le client Prisma + build de production |
| `npm start` | Serveur de production |
| `npm run lint` | Vérification ESLint |
| `npm run db:push` | Synchroniser le schéma Prisma avec la DB |
| `npm run db:generate` | Générer le client Prisma |
| `npm run db:migrate` | Créer une migration |
| `npm run db:reset` | Réinitialiser la DB |

---

## Licence

Projet privé — tous droits réservés.
