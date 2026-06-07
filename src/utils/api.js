// ─── Biograf AI — API Client ───────────────────────────────────────────────
// Centralise tous les appels vers synergy-biograf (NestJS @ :8092)

const BASE_URL = 'https://biograph-3.onrender.com/api/v1';


function getToken() {
  return localStorage.getItem('biograf_token');
}

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('biograf_user') || '{}');
    return u.id || u.userId || null;
  } catch { return null; }
}

function withUserId(path) {
  const uid = getUserId();
  if (!uid) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}userId=${uid}`;
}

// ─── Requête générique ─────────────────────────────────────────────────────

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  console.log('${BASE_URL}${path}', `${BASE_URL}${path}`)
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => ({}));
  console.log('data from api ', data)

  if (!res.ok) {
    const raw = data.message;
    const message = Array.isArray(raw) ? raw[0] : raw ?? `Erreur ${res.status}`;
    throw Object.assign(new Error(message), { status: res.status, data });
  }

  return data;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload) => request('POST', '/users/register', payload),
  login: (payload) => request('POST', '/users/login', payload),
  logout: (userId) => request('POST', `/users/logout/${userId}`, null, getToken()),
  verifyAccount: (token) => request('POST', '/users/verify-account', { token }),
  resendVerification: (email) => request('POST', '/users/resend-verification', { email }),
  forgotPassword: (email) => request('POST', '/users/forgot-password', { email }),
  resetPassword: (payload) => request('POST', '/users/reset-password', payload),
  validateResetToken: (token) => request('GET', `/users/reset-password?token=${encodeURIComponent(token)}`),
  getUser: (id) => request('GET', `/users/${id}`, null, getToken()),
  updateUser: (id, payload) => request('PATCH', `/users/${id}`, payload, getToken()),
  changePassword: (id, payload) => request('PATCH', `/users/${id}/change-password`, payload, getToken()),
};

// ─── Books ─────────────────────────────────────────────────────────────────

export const bookApi = {

  // ── CRUD ────────────────────────────────────────────────────────────────
  create: (payload) =>
    request('POST', withUserId('/books/create'), payload, getToken()),

  list: (params = {}) => {
    const uid = getUserId();
    const merged = uid ? { userId: uid, ...params } : params;
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(merged).filter(([, v]) => v != null))
    ).toString();
    return request('GET', `/books/list${q ? '?' + q : ''}`, null, getToken());
  },


  getById: (id) =>
    request('GET', withUserId(`/books/${id}`), null, getToken()),

  update: (id, payload) =>
    request('PATCH', withUserId(`/books/${id}`), payload, getToken()),

  delete: (id) =>
    request('DELETE', withUserId(`/books/${id}`), null, getToken()),

  publish: (id) =>
    request('PATCH', withUserId(`/books/${id}/publish`), null, getToken()),

  archive: (id) =>
    request('PATCH', withUserId(`/books/${id}/archive`), null, getToken()),

  getBySlug: (slug) =>
    request('GET', `/books/slug/${slug}`, null, getToken()),

  getByShareToken: (shareToken) =>
    request('GET', `/books/share/${shareToken}`),

  updateVisibility: (id, payload) =>
    request('PATCH', withUserId(`/books/${id}/visibility`), payload, getToken()),

  // ── Chapitres ────────────────────────────────────────────────────────────
  createChapter: (bookId, payload) =>
    request('POST', withUserId(`/books/${bookId}/chapters`), payload, getToken()),

  updateChapter: (bookId, chapterId, payload) =>
    request('PATCH', withUserId(`/books/${bookId}/chapters/${chapterId}`), payload, getToken()),

  deleteChapter: (bookId, chapterId) =>
    request('DELETE', withUserId(`/books/${bookId}/chapters/${chapterId}`), null, getToken()),

  reorderChapters: (bookId, payload) =>
    request('PATCH', withUserId(`/books/${bookId}/chapters/2/reorder`), payload, getToken()),

  // ── Sous-chapitres ───────────────────────────────────────────────────────
  createSubChapter: (bookId, chapterId, payload) =>
    request('POST', withUserId(`/books/${bookId}/chapters/${chapterId}/sub-chapters`), payload, getToken()),

  updateSubChapter: (bookId, chapterId, subChapterId, payload) =>
    request('PATCH', withUserId(`/books/${bookId}/chapters/${chapterId}/sub-chapters/${subChapterId}`), payload, getToken()),

  deleteSubChapter: (bookId, chapterId, subChapterId) =>
    request('DELETE', withUserId(`/books/${bookId}/chapters/${chapterId}/sub-chapters/${subChapterId}`), null, getToken()),

  // ── Images de chapitre ───────────────────────────────────────────────────
  addChapterImage: (bookId, chapterId, payload) =>
    request('POST', withUserId(`/books/${bookId}/chapters/${chapterId}/images`), payload, getToken()),

  listChapterImages: (bookId, chapterId) =>
    request('GET', `/books/${bookId}/chapters/${chapterId}/images`, null, getToken()),

  updateChapterImage: (bookId, chapterId, imageId, payload) =>
    request('PATCH', withUserId(`/books/${bookId}/chapters/${chapterId}/images/${imageId}`), payload, getToken()),

  deleteChapterImage: (bookId, chapterId, imageId) =>
    request('DELETE', withUserId(`/books/${bookId}/chapters/${chapterId}/images/${imageId}`), null, getToken()),

  reorderChapterImages: (bookId, chapterId, payload) =>
    request('PATCH', withUserId(`/books/${bookId}/chapters/${chapterId}/images/reorder`), payload, getToken()),

  // ── Collaborateurs ───────────────────────────────────────────────────────
  listCollaborators: (bookId) =>
    request('GET', `/books/${bookId}/collaborators`, null, getToken()),

  inviteCollaborator: (bookId, payload) =>
    request('POST', withUserId(`/books/${bookId}/collaborators`), payload, getToken()),

  updateCollaboratorRole: (bookId, collaboratorId, payload) =>
    request('PATCH', withUserId(`/books/${bookId}/collaborators/${collaboratorId}/role`), payload, getToken()),

  removeCollaborator: (bookId, collaboratorId) =>
    request('DELETE', withUserId(`/books/${bookId}/collaborators/${collaboratorId}`), null, getToken()),

  // ── Versions ─────────────────────────────────────────────────────────────
  listVersions: (bookId) =>
    request('GET', `/books/${bookId}/versions`, null, getToken()),

  createVersion: (bookId, payload) =>
    request('POST', withUserId(`/books/${bookId}/versions`), payload, getToken()),

  restoreVersion: (bookId, versionId) =>
    request('POST', withUserId(`/books/${bookId}/versions/${versionId}/restore`), null, getToken()),

  // ── Exports ───────────────────────────────────────────────────────────────
  listExports: (bookId) =>
    request('GET', `/books/${bookId}/exports`, null, getToken()),

  requestExport: (bookId, payload) =>
    request('POST', withUserId(`/books/${bookId}/exports`), payload, getToken()),

  // ── Table des matières ────────────────────────────────────────────────────
  generateToc: (bookId) =>
    request('POST', withUserId(`/books/${bookId}/table-of-contents`), null, getToken()),

  // ── Étiquettes ───────────────────────────────────────────────────────────
  addTags: (bookId, payload) =>
    request('POST', withUserId(`/books/${bookId}/tags`), payload, getToken()),

  removeTag: (bookId, tagId) =>
    request('DELETE', withUserId(`/books/${bookId}/tags/${tagId}`), null, getToken()),

  // ── Favoris ───────────────────────────────────────────────────────────────
  listFavorites: () =>
    request('GET', '/books/user/favorites', null, getToken()),

  addFavorite: (bookId) =>
    request('POST', withUserId(`/books/${bookId}/favorites`), null, getToken()),

  removeFavorite: (bookId, favoriteId) =>
    request('DELETE', withUserId(`/books/${bookId}/favorites/${favoriteId}`), null, getToken()),
};

// ─── Notifications ─────────────────────────────────────────────────────────

export const notifApi = {
  list: (params = {}) => {
    const uid = getUserId();
    const merged = uid ? { userId: uid, ...params } : params;
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(merged).filter(([, v]) => v != null))
    ).toString();
    return request('GET', `/notifications/mes-notifications${q ? '?' + q : ''}`, null, getToken());
  },

  unreadCount: () =>
    request('GET', withUserId('/notifications/unread-count'), null, getToken()),

  markRead: (ids) =>
    request('PATCH', withUserId('/notifications/mark-read'), { ids }, getToken()),

  markAllRead: (type) => {
    const base = withUserId('/notifications/mark-all-read');
    const path = type ? `${base}&type=${encodeURIComponent(type)}` : base;
    return request('PATCH', path, null, getToken());
  },

  deleteRead: () =>
    request('DELETE', withUserId('/notifications/read'), null, getToken()),

  delete: (id) =>
    request('DELETE', withUserId(`/notifications/${id}`), null, getToken()),

  // ── Rappels d'écriture ───────────────────────────────────────────────────
  listReminders: () =>
    request('GET', withUserId('/notifications/reminders'), null, getToken()),

  createReminder: (payload) =>
    request('POST', withUserId('/notifications/reminders'), payload, getToken()),

  updateReminder: (id, payload) =>
    request('PATCH', withUserId(`/notifications/reminders/${id}`), payload, getToken()),

  toggleReminder: (id) =>
    request('PATCH', withUserId(`/notifications/reminders/${id}/toggle`), null, getToken()),

  deleteReminder: (id) =>
    request('DELETE', withUserId(`/notifications/reminders/${id}`), null, getToken()),
};

// ─── Orders ────────────────────────────────────────────────────────────────

export const orderApi = {
  simulatePrice: (params = {}) => {
    const uid = getUserId();
    const merged = uid ? { userId: uid, ...params } : params;
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(merged).filter(([, v]) => v != null))
    ).toString();
    return request('GET', `/orders/simulate-price?${q}`, null, getToken());
  },

  create: (payload) =>
    request('POST', withUserId('/orders/create'), payload, getToken()),

  list: (params = {}) => {
    const base = withUserId('/orders/my-orders');
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request('GET', `${base}${q ? '&' + q : ''}`, null, getToken());
  },

  getById: (orderId) =>
    request('GET', withUserId(`/orders/${orderId}`), null, getToken()),

  confirmPayment: (orderId, payload) =>
    request('POST', withUserId(`/orders/${orderId}/confirm-payment`), payload, getToken()),

  cancel: (orderId, payload = {}) =>
    request('PATCH', withUserId(`/orders/${orderId}/cancel`), payload, getToken()),

  getEvents: (orderId) =>
    request('GET', withUserId(`/orders/${orderId}/events`), null, getToken()),
};

// ─── Support ───────────────────────────────────────────────────────────────

export const supportApi = {
  listThreads: (page = 1, limit = 20) => {
    const base = withUserId('/support/threads');
    return request('GET', `${base}&page=${page}&limit=${limit}`, null, getToken());
  },

  createThread: (payload) =>
    request('POST', withUserId('/support/threads'), payload, getToken()),

  getThread: (threadId) =>
    request('GET', withUserId(`/support/threads/${threadId}`), null, getToken()),

  getMessages: (threadId, page = 1, limit = 50) => {
    const base = withUserId(`/support/threads/${threadId}/messages`);
    return request('GET', `${base}&page=${page}&limit=${limit}`, null, getToken());
  },

  sendMessage: (threadId, payload) =>
    request('POST', withUserId(`/support/threads/${threadId}/messages`), payload, getToken()),

  deleteMessage: (threadId, messageId) =>
    request('DELETE', withUserId(`/support/threads/${threadId}/messages/${messageId}`), null, getToken()),
};

// ─── Support Admin ─────────────────────────────────────────────────────────

export const supportAdminApi = {
  listThreads: (page = 1, limit = 20, status) => {
    const q = new URLSearchParams({ page, limit, ...(status ? { status } : {}) }).toString();
    return request('GET', `/support/admin/threads?${q}`, null, getToken());
  },

  getThread: (threadId) =>
    request('GET', `/support/admin/threads/${threadId}`, null, getToken()),

  updateStatus: (threadId, payload) => {
    const agentId = getUserId();
    return request('PATCH', `/support/admin/threads/${threadId}/status?agentId=${agentId}`, payload, getToken());
  },

  sendMessage: (threadId, payload) => {
    const agentId = getUserId();
    return request('POST', `/support/admin/threads/${threadId}/messages?agentId=${agentId}`, payload, getToken());
  },
};

// ─── Blockchain ────────────────────────────────────────────────────────────

export const blockchainApi = {
  createAnchor: (payload) =>
    request('POST', withUserId('/blockchain/anchors'), payload, getToken()),

  listAnchors: (page = 1, limit = 20) => {
    const base = withUserId('/blockchain/anchors');
    return request('GET', `${base}&page=${page}&limit=${limit}`, null, getToken());
  },

  getAnchor: (anchorId) =>
    request('GET', withUserId(`/blockchain/anchors/${anchorId}`), null, getToken()),

  verifyIntegrity: (bookId) =>
    request('GET', withUserId(`/blockchain/verify/${bookId}`), null, getToken()),

  detachBook: (anchorId, bookId) =>
    request('DELETE', withUserId(`/blockchain/anchors/${anchorId}/books/${bookId}`), null, getToken()),
};

// ─── AI Suggestions & Covers ───────────────────────────────────────────────

export const aiApi = {
  // ── Suggestions ──────────────────────────────────────────────────────────
  create: (payload) =>
    request('POST', withUserId('/ai-suggestions/ai/suggestions'), payload, getToken()),

  listForBook: (bookId) =>
    request('GET', withUserId(`/ai-suggestions/books/${bookId}/ai/suggestions`), null, getToken()),

  listForChapter: (bookId, chapterId) =>
    request('GET', withUserId(`/ai-suggestions/books/${bookId}/chapters/${chapterId}/ai/suggestions`), null, getToken()),

  acceptOrReject: (suggestionId, payload) =>
    request('PATCH', withUserId(`/ai-suggestions/ai/suggestions/${suggestionId}/accept`), payload, getToken()),

  delete: (suggestionId) =>
    request('DELETE', withUserId(`/ai-suggestions/ai/suggestions/${suggestionId}`), null, getToken()),

  // ── Couvertures ───────────────────────────────────────────────────────────
  generateCover: (bookId, payload) =>
    request('POST', withUserId(`/ai-suggestions/books/${bookId}/covers/generate`), payload, getToken()),

  listCovers: (bookId) =>
    request('GET', withUserId(`/ai-suggestions/books/${bookId}/covers`), null, getToken()),

  selectCover: (bookId, coverId) =>
    request('PATCH', withUserId(`/ai-suggestions/books/${bookId}/covers/${coverId}/select`), null, getToken()),

  deleteCover: (bookId, coverId) =>
    request('DELETE', withUserId(`/ai-suggestions/books/${bookId}/covers/${coverId}`), null, getToken()),
};

// ─── Media (audio / vidéo) ────────────────────────────────────────────────
// Backend : @Controller('media') → la route "my-projects" devient /media/media/my-projects
// (préfixe contrôleur + path déclaré). Idem pour les routes :projectId.

export const MEDIA_FILE_ORIGIN = BASE_URL.replace(/\/api\/v\d+\/?$/, '');

export function buildMediaFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${MEDIA_FILE_ORIGIN}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

export const mediaApi = {
  // Créer un projet (audio ou vidéo) à partir d'un livre
  create: (bookId, payload) =>
    request('POST', withUserId(`/media/books/${bookId}/media`), payload, getToken()),

  // Lister les projets d'un livre précis
  listForBook: (bookId) =>
    request('GET', withUserId(`/media/books/${bookId}/media`), null, getToken()),

  // Lister tous mes projets (tous livres confondus)
  listForUser: () =>
    request('GET', withUserId('/media/media/my-projects'), null, getToken()),

  // Détail d'un projet
  findOne: (projectId) =>
    request('GET', withUserId(`/media/media/${projectId}`), null, getToken()),

  // Mettre à jour un projet (titre / voix / langue / musique selon statut)
  update: (projectId, payload) =>
    request('PATCH', withUserId(`/media/media/${projectId}`), payload, getToken()),

  // Relancer la génération (en cas d'échec ou de modification de paramètres)
  regenerate: (projectId, payload = {}) =>
    request('POST', withUserId(`/media/media/${projectId}/regenerate`), payload, getToken()),

  // Supprimer un projet
  remove: (projectId) =>
    request('DELETE', withUserId(`/media/media/${projectId}`), null, getToken()),
};
