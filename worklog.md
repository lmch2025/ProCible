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
