# Sélénia Nocturne — Frontend

## Démarrage rapide
1. Placez les fichiers dans un même dossier.
2. Ouvrez `index.html` dans un navigateur moderne.
3. (Optionnel IA live) Ajoutez votre clé OpenAI dans la console:
   - `localStorage.setItem('openai_api_key', 'sk-...')`
4. Naviguez entre les routes via le menu (`#/, #/onboarding, #/dashboard, #/chat`).

## Pages incluses
- `/` Landing mystique (Header, Hero, UniverseVisual, Features)
- `/onboarding` Formulaire profil spirituel (BirthData + Consent)
- `/dashboard` Hub quotidien (Oracle, Transit, Numérologie)
- `/chat` Conversation privée avec audio playback et mémoire locale

## Stack
- HTML/CSS/JS vanilla (SPA hash routing)
- Design glassmorphism style Apple
- API externe: Quotable (dashboard)
- API OpenAI (chat) avec gestion d'erreurs
- Stockage local: `localStorage`

## Notes sécurité
- Ceci est un prototype frontend.
- Ne mettez jamais de secrets sensibles en production côté client.
- Utilisez un backend pour gérer les clés API de manière sécurisée.