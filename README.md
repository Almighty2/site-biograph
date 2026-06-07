# Biograf AI — Frontend

Application React complète pour la plateforme **Biograf AI** : écriture de mémoires/biographies assistée par IA, audio narration, impression à la demande et ancrage blockchain.

## 🎨 Design

**Direction artistique : "Modern Editorial Light"**

- Palette : terre cuite (#B8553B) + verts mousse (#5A7A4A) + ocre + crème
- Typographie : **Fraunces** (serif moderne) pour les titres + **Geist** (sans-serif) pour le corps
- Style : éditorial magazine, professionnel, naturel — sans esthétique générique d'IA

## 📦 Stack

- React 18 + Vite 5
- Aucune dépendance UI externe (tout est custom : icônes SVG, composants, animations)
- CSS-in-JS via fichiers `.css` + styles inline

## 🚀 Installation

```bash
npm install
npm run dev
# → http://localhost:3001
```

## 🔐 Connexion de test

Sur la page de connexion, cliquez simplement sur **"Se connecter"** (les champs sont pré-remplis).

## 📂 Structure

```
src/
├── App.jsx              → Routeur + Sidebar + Topbar
├── index.jsx            → Entry ReactDOM
├── styles/
│   ├── tokens.css       → Variables CSS (palette, fonts, animations)
│   ├── components.css   → btn, input, card, badge, modal, table...
│   └── layout.css       → Shell + sidebar + topbar + grids
├── components/
│   ├── Icon.jsx         → 50 icônes SVG inline
│   ├── BookCover.jsx    → Couverture stylisée du livre
│   └── Shared.jsx       → StatusBadge, Modal, ProgressRing, Avatar, EmptyState, Spinner
├── utils/
│   └── mockData.js      → Données alignées sur le schéma Prisma
└── pages/
    ├── AuthPage.jsx           → Login + Register + Forgot/Reset (6 vues)
    ├── DashboardPage.jsx      → Tableau de bord
    ├── BooksPage.jsx          → Bibliothèque (grid/list)
    ├── BookDetailPage.jsx     → Détail livre (5 onglets)
    ├── EditorPage.jsx         → Éditeur de chapitres + IA
    ├── AIPage.jsx             → Assistant IA (3 onglets)
    ├── MediaPage.jsx          → Audio & vidéo
    ├── OrdersPage.jsx         → Commandes (modal 3 étapes)
    ├── StatsPage.jsx          → Statistiques d'écriture
    ├── BlockchainPage.jsx     → Ancrage blockchain
    ├── NotificationsPage.jsx  → Centre de notifications
    ├── SupportPage.jsx        → Chat de support
    └── SettingsPage.jsx       → Profil + Rappels + Forfait + Sécurité
```

## 🔌 Connexion à l'API NestJS

Toutes les pages utilisent les données mock dans `src/utils/mockData.js`. Pour brancher l'API NestJS :

```js
// Exemple — remplacer dans BooksPage.jsx
import { useEffect, useState } from "react";

const [books, setBooks] = useState([]);
useEffect(() => {
  fetch(`/books?userId=${userId}`)
    .then(r => r.json())
    .then(data => setBooks(data.data));
}, []);
```

Routes API attendues (déjà implémentées en NestJS) :

| Page | Endpoints utilisés |
|---|---|
| Auth | `POST /users/register`, `POST /users/login`, `POST /users/forgot-password`, `POST /users/reset-password` |
| Books | `GET /books`, `POST /books`, `GET /books/:id`, `PATCH /books/:id`, `DELETE /books/:id` |
| BookDetail | `GET /books/:id` (avec chapters, collaborators, versions), `POST /books/:id/collaborators` |
| Editor | `GET /books/:id/chapters/:chId`, `PATCH /books/:id/chapters/:chId`, `POST .../images` |
| AI | `POST /ai/suggestions`, `PATCH /ai/suggestions/:id/accept`, `POST /books/:id/covers/generate` |
| Media | `POST /books/:id/media`, `GET /media/my-projects` |
| Orders | `GET /orders/simulate-price`, `POST /orders`, `GET /orders` |
| Blockchain | `POST /blockchain/anchor`, `GET /blockchain/verify/:bookId` |
| Notifications | `GET /notifications`, `PATCH /notifications/mark-all-read` |
| Support | `GET /support/threads`, `POST /support/threads`, `POST /support/threads/:id/messages` |
| Stats | `GET /writing-stats/summary`, `GET /writing-stats/by-book`, `GET /writing-stats/streak` |
| Settings | `PATCH /users/:id`, `PATCH /users/:id/change-password`, CRUD `/notifications/reminders` |

## ✨ Fonctionnalités

- **13 pages** complètes
- **6 vues d'authentification** (login, register 2 étapes, forgot, sent, new password, done)
- **Animations CSS** : `fadeUp`, `scaleIn`, `slideR/L`, `shimmer`, `spin`, stagger d'apparition
- **Responsive** : breakpoints 1024px et 768px (sidebar masquée)
- **Accessibilité** : touches Escape pour fermer les modales, contrastes AA

## 📝 Notes

Toutes les données sont alignées sur le schéma Prisma :
- Modèles : User, Book, Chapter, Collaboration, BookVersion, BookTag, AiSuggestion, CoverGeneration, MediaProject, Order, BlockchainAnchor, Notification, WritingReminder, WritingStat, SupportThread, SupportMessage
- Enums : BookStatus, BookGenre, Visibility, OrderStatus, SupportStatus, SenderType, MediaType, ReminderFrequency, etc.
