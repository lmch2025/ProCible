---
Task ID: 1
Agent: Main Agent
Task: Build Hermes PWA - Personal prospecting assistant

Work Log:
- Explored existing Next.js project structure (Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Prisma SQLite)
- Designed and implemented Prisma schema with User, Lead, Preference, Notification models
- Pushed schema to SQLite database
- Built complete visual identity: warm-to-cold gradient (#FF7B54 → #6C3FA9), rounded typography, Hermes theme in globals.css
- Created Zustand store for app state management (auth, navigation, leads, notifications, preferences)
- Built 3-screen animated Onboarding (Bienvenue → Préférences → Phone auth)
- Built Home screen with animated "nouveaux prospects" card, stats, recent leads
- Built Mes Leads screen with swipeable card UI (swipe right = save, left = ignore)
- Built Lead Detail screen with giant Appeler / WhatsApp / Sauvegarder buttons
- Built Notifications screen with type-based icons and unread badges
- Built Profile screen with subscription tiers and Mobile Money/Orange Money/MTN Money payment options
- Built Preferences screen with pictogram-based sector/city selection
- Built BottomNav with 4 tabs + notification badge animation
- Built ConfettiEffect for successful actions
- Built SkeletonCard/SkeletonLeadList loaders
- Created API routes: /api/leads, /api/notifications, /api/preferences, /api/seed
- Created PWA: manifest.json, service worker (sw.js), offline support, push notifications
- Generated PWA icons (512x512, 192x192) via AI image generation
- Fixed React Compiler memoization issue in LeadsScreen
- Fixed onboarding step 3 null-safe fallback for currentSlide
- Fixed seed API to prevent duplicate notifications
- Cleaned up unused state variables in page.tsx
- Verified all screens with Agent Browser - all passing

Stage Summary:
- Full Hermes PWA built with 8 screens, all animations, PWA support
- Visual identity: coral-to-violet gradient, rounded corners, skeleton loaders, confetti
- Accessibility: 56px min buttons, one action per screen, audio read option
- PWA: installable, offline-ready, < 2MB, push notification support
- All lint checks pass, all browser verifications pass
