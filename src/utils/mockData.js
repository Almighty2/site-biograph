export const CURRENT_USER = {
  id: "clxUSR001", fullName: "Aïssatou Kaboré", email: "aissatou.kabore@example.com",
  avatarUrl: null, bio: "Auteure ivoirienne, passionnée par la transmission orale.",
  language: "fr", timezone: "Africa/Abidjan", plan: "PRO", code: "USR000142",
  createdAt: "2024-08-12",
};

export const BOOKS = [
  { id: "clxBOOK001", title: "L'Héritage du Baobab", subtitle: "Mémoires d'une enfance à Bouaké", slug: "l-heritage-du-baobab",
    description: "Un retour sur les années de mon enfance dans le centre de la Côte d'Ivoire, entre traditions ancestrales et modernité naissante.",
    genre: "AUTOBIOGRAPHY", status: "IN_PROGRESS", visibility: "PRIVATE", language: "fr",
    coverColor: "#B8553B", coverPattern: "stripes", wordCount: 28450, pageCount: 114,
    targetWordCount: 60000, progressPct: 47, chapters: 9, isPremium: true,
    updatedAt: "2026-04-22", createdAt: "2025-11-08" },
  { id: "clxBOOK002", title: "Les Voix de Grand-Mère Adjoua", subtitle: "Contes et sagesses du pays Akan", slug: "voix-grand-mere-adjoua",
    description: "Recueil des récits de ma grand-mère, gardienne de la mémoire familiale.",
    genre: "FAMILY_ARCHIVE", status: "DRAFT", visibility: "RESTRICTED", language: "fr",
    coverColor: "#5A7A4A", coverPattern: "dots", wordCount: 6820, pageCount: 28,
    targetWordCount: 30000, progressPct: 22, chapters: 4, isPremium: false,
    updatedAt: "2026-04-18", createdAt: "2026-01-15" },
  { id: "clxBOOK003", title: "Sahel — A Community's Story", subtitle: "Voices from the northern villages", slug: "sahel-community-story",
    description: "An oral history project documenting community life across three generations.",
    genre: "COMMUNITY_HISTORY", status: "PUBLISHED", visibility: "PUBLIC", language: "en",
    coverColor: "#3D5470", coverPattern: "wave", wordCount: 54200, pageCount: 218,
    targetWordCount: 50000, progressPct: 100, chapters: 16, isPremium: true,
    updatedAt: "2026-03-12", createdAt: "2025-06-20", publishedAt: "2026-03-10" },
  { id: "clxBOOK004", title: "Le Marché du Vendredi", subtitle: null, slug: "marche-du-vendredi",
    description: "Vignettes sur les commerçantes du marché de Bouaké.",
    genre: "MEMOIR", status: "REVIEW", visibility: "PRIVATE", language: "fr",
    coverColor: "#C9974A", coverPattern: "diagonal", wordCount: 18900, pageCount: 76,
    targetWordCount: 25000, progressPct: 76, chapters: 12, isPremium: false,
    updatedAt: "2026-04-15", createdAt: "2026-02-01" },
];

export const CHAPTERS = [
  { id: "clxCH001", bookId: "clxBOOK001", title: "Avant ma naissance", position: 1, wordCount: 3420, isComplete: true, hasImages: 2 },
  { id: "clxCH002", bookId: "clxBOOK001", title: "Le village de Tiébissou", position: 2, wordCount: 4180, isComplete: true, hasImages: 4 },
  { id: "clxCH003", bookId: "clxBOOK001", title: "L'école sous le manguier", position: 3, wordCount: 3890, isComplete: true, hasImages: 3 },
  { id: "clxCH004", bookId: "clxBOOK001", title: "Le marigot et les femmes", position: 4, wordCount: 2940, isComplete: true, hasImages: 1 },
  { id: "clxCH005", bookId: "clxBOOK001", title: "Mon père forgeron", position: 5, wordCount: 4720, isComplete: true, hasImages: 2 },
  { id: "clxCH006", bookId: "clxBOOK001", title: "Les pagnes de ma mère", position: 6, wordCount: 3850, isComplete: false, hasImages: 0 },
  { id: "clxCH007", bookId: "clxBOOK001", title: "Le départ pour Abidjan", position: 7, wordCount: 3210, isComplete: false, hasImages: 0 },
  { id: "clxCH008", bookId: "clxBOOK001", title: "Le lycée des grandes filles", position: 8, wordCount: 2240, isComplete: false, hasImages: 0 },
  { id: "clxCH009", bookId: "clxBOOK001", title: "Premier emploi", position: 9, wordCount: 0, isComplete: false, hasImages: 0 },
];

export const TAGS = [
  { id: "tag1", name: "mémoire familiale" }, { id: "tag2", name: "histoire orale" },
  { id: "tag3", name: "côte d'ivoire" }, { id: "tag4", name: "patrimoine" },
];

export const COLLABORATORS = [
  { id: "col1", userId: "clxUSR002", fullName: "Jean Konan", email: "jean@example.com", role: "EDITOR", bookId: "clxBOOK001", acceptedAt: "2026-02-10" },
  { id: "col2", userId: "clxUSR003", fullName: "Marie Diomandé", email: "marie@example.com", role: "COMMENTER", bookId: "clxBOOK001", acceptedAt: "2026-03-05" },
  { id: "col3", userId: "clxUSR004", fullName: "Paul N'Guessan", email: "paul@example.com", role: "READER", bookId: "clxBOOK001", acceptedAt: null },
];

export const VERSIONS = [
  { id: "v1", versionNumber: 5, label: "Avant relecture finale", createdAt: "2026-04-20" },
  { id: "v2", versionNumber: 4, label: "Ajout du chapitre 8", createdAt: "2026-04-12" },
  { id: "v3", versionNumber: 3, label: "Première version complète", createdAt: "2026-03-28" },
];

export const AI_SUGGESTIONS = [
  { id: "ai1", bookId: "clxBOOK001", chapterId: "clxCH006", chapterTitle: "Les pagnes de ma mère", type: "NARRATIVE_ADVICE",
    prompt: "Comment améliorer le rythme du chapitre ?",
    response: "Le chapitre gagnerait à insérer un dialogue direct entre vous et votre mère lors de la scène du choix du pagne. Cela ancrerait le lecteur dans une expérience sensorielle plutôt que descriptive. Considérez aussi un retour en arrière de quelques lignes au début pour évoquer la première fois que vous l'avez vue tisser.",
    isAccepted: null, createdAt: "il y a 2h" },
  { id: "ai2", bookId: "clxBOOK001", chapterId: "clxCH004", chapterTitle: "Le marigot et les femmes", type: "CORRECTION",
    prompt: "Vérifie le style",
    response: "Trois suggestions stylistiques : 1) Remplacer « j'allais » répété par des verbes de mouvement variés. 2) La phrase ligne 12 mériterait d'être scindée. 3) L'image du marigot est belle mais légèrement clichée — essayez « la mare endormie » ou « le miroir des femmes ».",
    isAccepted: true, createdAt: "il y a 1j" },
  { id: "ai3", bookId: "clxBOOK002", chapterId: null, chapterTitle: null, type: "BOOK_PLAN",
    prompt: "Plan pour les contes de ma grand-mère",
    response: "Structure suggérée : Partie I — Les origines (création du monde Akan, fondation du clan). Partie II — Les héros (récits initiatiques, figures héroïques). Partie III — La sagesse (proverbes, énigmes, leçons morales). Partie IV — La famille (histoires personnelles transmises).",
    isAccepted: null, createdAt: "il y a 3j" },
];

export const COVERS = [
  { id: "cv1", bookId: "clxBOOK001", style: "vintage", isSelected: true, prompt: "Baobab et savane au coucher du soleil" },
  { id: "cv2", bookId: "clxBOOK001", style: "minimaliste", isSelected: false, prompt: "Silhouette d'arbre stylisée" },
  { id: "cv3", bookId: "clxBOOK001", style: "africain", isSelected: false, prompt: "Motifs traditionnels akan" },
  { id: "cv4", bookId: "clxBOOK001", style: "aquarelle", isSelected: false, prompt: "Aquarelle douce d'un village" },
];

export const MEDIA_PROJECTS = [
  { id: "mp1", bookId: "clxBOOK003", bookTitle: "Sahel — A Community's Story", title: "Narration audio — Sahel", type: "AUDIO_NARRATION", language: "en", voiceGender: "FEMALE", status: "DONE", durationSec: 15780, completedAt: "2026-03-15" },
  { id: "mp2", bookId: "clxBOOK001", bookTitle: "L'Héritage du Baobab", title: "Audio des 5 premiers chapitres", type: "AUDIO_NARRATION", language: "fr", voiceGender: "FEMALE", status: "PROCESSING", durationSec: null, completedAt: null },
  { id: "mp3", bookId: "clxBOOK004", bookTitle: "Le Marché du Vendredi", title: "Vidéo souvenir — Le marché", type: "VIDEO_STORY", language: "fr", voiceGender: "MALE", status: "PENDING", durationSec: null, completedAt: null },
];

export const ORDERS = [
  { id: "ord1", bookId: "clxBOOK003", bookTitle: "Sahel — A Community's Story", status: "DELIVERED", printFormat: "A5", coverType: "HARDCOVER", copies: 5, pageCount: 218, totalCents: 4750000, currency: "XOF", paidAt: "2026-03-10", deliveredAt: "2026-03-22" },
  { id: "ord2", bookId: "clxBOOK001", bookTitle: "L'Héritage du Baobab", status: "PRINTING", printFormat: "A5", coverType: "PAPERBACK", copies: 2, pageCount: 114, totalCents: 1820000, currency: "XOF", paidAt: "2026-04-15", deliveredAt: null },
  { id: "ord3", bookId: "clxBOOK004", bookTitle: "Le Marché du Vendredi", status: "PENDING", printFormat: "POCKET", coverType: "PAPERBACK", copies: 1, pageCount: 76, totalCents: 580000, currency: "XOF", paidAt: null, deliveredAt: null },
];

export const ANCHORS = [
  { id: "anc1", contentHash: "8f3a4b9c2e1d7f5a8b2c9e4f1d6a3b7e", txHash: "0xa7b2c9e4f1d6a3b7e8f3a4b9c2e1d7f5", network: "polygon", anchoredAt: "2026-03-10", isConfirmed: true, bookIds: ["clxBOOK003"] },
];

export const NOTIFICATIONS = [
  { id: "n1", type: "AI_SUGGESTION", title: "Nouvelle suggestion IA", body: "Une suggestion narrative pour le chapitre 6 est prête.", isRead: false, createdAt: "il y a 12 min" },
  { id: "n2", type: "COLLABORATION_INVITE", title: "Invitation acceptée", body: "Marie Diomandé a accepté votre invitation à collaborer.", isRead: false, createdAt: "il y a 2 h" },
  { id: "n3", type: "ORDER_UPDATE", title: "Commande en impression", body: "Votre commande #ord2 est passée à l'impression.", isRead: false, createdAt: "il y a 6 h" },
  { id: "n4", type: "WRITING_REMINDER", title: "Rappel d'écriture", body: "Vous n'avez pas écrit aujourd'hui. Reprenez votre plume !", isRead: true, createdAt: "hier" },
  { id: "n5", type: "ORDER_UPDATE", title: "Livre livré", body: "Votre commande Sahel a été livrée.", isRead: true, createdAt: "il y a 4 jours" },
  { id: "n6", type: "SYSTEM", title: "Bienvenue sur Biograf AI", body: "Découvrez tous nos outils pour écrire votre histoire.", isRead: true, createdAt: "il y a 12 jours" },
];

export const REMINDERS = [
  { id: "r1", bookId: "clxBOOK001", bookTitle: "L'Héritage du Baobab", frequency: "DAILY", time: "07:30", isActive: true },
  { id: "r2", bookId: null, bookTitle: null, frequency: "WEEKLY", time: "09:00", isActive: true },
  { id: "r3", bookId: "clxBOOK002", bookTitle: "Les Voix de Grand-Mère Adjoua", frequency: "EVERY_2_DAYS", time: "20:00", isActive: false },
];

export const WRITING_STATS = {
  weekly: [
    { day: "Lun", date: "2026-04-21", words: 420, minutes: 35 },
    { day: "Mar", date: "2026-04-22", words: 680, minutes: 52 },
    { day: "Mer", date: "2026-04-23", words: 290, minutes: 22 },
    { day: "Jeu", date: "2026-04-24", words: 950, minutes: 78 },
    { day: "Ven", date: "2026-04-25", words: 540, minutes: 41 },
    { day: "Sam", date: "2026-04-26", words: 1240, minutes: 95 },
    { day: "Dim", date: "2026-04-27", words: 380, minutes: 30 },
  ],
  totalWords: 4500, totalMinutes: 353, totalDays: 7,
  bestDay: { date: "2026-04-26", wordsWritten: 1240 },
  currentStreak: 12,
  byBook: [
    { bookId: "clxBOOK001", title: "L'Héritage du Baobab", words: 3120, minutes: 248 },
    { bookId: "clxBOOK002", title: "Les Voix de Grand-Mère Adjoua", words: 980, minutes: 75 },
    { bookId: "clxBOOK004", title: "Le Marché du Vendredi", words: 400, minutes: 30 },
  ],
};

export const SUPPORT_THREADS = [
  { id: "th1", subject: "Problème export PDF page 50", status: "IN_PROGRESS", messages: 5, lastMessage: "Notre équipe technique investigue.", createdAt: "il y a 2j" },
  { id: "th2", subject: "Question sur le forfait Pro", status: "RESOLVED", messages: 8, lastMessage: "Merci pour votre retour.", createdAt: "il y a 1 sem." },
];

export const SUPPORT_MESSAGES = {
  th1: [
    { id: "m1", senderType: "USER", content: "Bonjour, lorsque j'exporte mon livre en PDF, la page 50 contient des caractères corrompus.", createdAt: "Il y a 2 jours, 14:23" },
    { id: "m2", senderType: "BOT", content: "Votre demande a été reçue et assignée à un agent.", createdAt: "Il y a 2 jours, 14:23" },
    { id: "m3", senderType: "AGENT", content: "Bonjour Aïssatou, merci pour votre signalement. Pouvez-vous me confirmer le navigateur que vous utilisez ?", createdAt: "Il y a 2 jours, 15:40" },
    { id: "m4", senderType: "USER", content: "J'utilise Chrome sur macOS. J'ai retenté plusieurs fois, le souci reste identique.", createdAt: "Hier, 09:15" },
    { id: "m5", senderType: "AGENT", content: "Merci pour ces précisions. Je transmets à notre équipe technique. Vous recevrez un retour dans les 24h.", createdAt: "Hier, 11:02" },
  ],
};

export const PRICING = {
  pricePerPage: { A4: 25, A5: 18, POCKET: 15, SQUARE: 22 },
  hardcoverSurcharge: 1500,
};

export const formatXOF = (cents) => `${(cents / 100).toLocaleString('fr-FR')} XOF`;

export const STATUS_LABELS = {
  DRAFT: "Brouillon", IN_PROGRESS: "En cours", REVIEW: "En relecture", PUBLISHED: "Publié", ARCHIVED: "Archivé",
  PRIVATE: "Privé", RESTRICTED: "Lien sécurisé", PUBLIC: "Public",
  PENDING: "En attente", CONFIRMED: "Confirmée", PRINTING: "Impression", SHIPPED: "Expédiée", DELIVERED: "Livrée", CANCELLED: "Annulée", REFUNDED: "Remboursée",
  OPEN: "Ouverte", RESOLVED: "Résolue", CLOSED: "Fermée",
  PROCESSING: "En cours", DONE: "Terminé", FAILED: "Échec",
  AUTOBIOGRAPHY: "Autobiographie", BIOGRAPHY: "Biographie", FAMILY_ARCHIVE: "Archive familiale", COMMUNITY_HISTORY: "Histoire communautaire", MEMOIR: "Mémoire", OTHER: "Autre",
  READER: "Lecteur", COMMENTER: "Commentateur", EDITOR: "Éditeur", ADMIN: "Administrateur",
  DAILY: "Quotidienne", EVERY_2_DAYS: "Tous les 2 jours", WEEKLY: "Hebdomadaire",
};

export const STATUS_COLORS = {
  DRAFT: "neutral", IN_PROGRESS: "ochre", REVIEW: "indigo", PUBLISHED: "moss", ARCHIVED: "neutral",
  PRIVATE: "neutral", RESTRICTED: "ochre", PUBLIC: "moss",
  PENDING: "ochre", CONFIRMED: "indigo", PRINTING: "ochre", SHIPPED: "indigo", DELIVERED: "moss", CANCELLED: "terracotta", REFUNDED: "neutral",
  OPEN: "indigo", RESOLVED: "moss", CLOSED: "neutral",
  PROCESSING: "ochre", DONE: "moss", FAILED: "terracotta",
};
