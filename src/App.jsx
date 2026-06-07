import { useState, useEffect } from "react";
import { Icon } from "./components/Icon";
import { Avatar } from "./components/Shared";
import { NOTIFICATIONS, BOOKS, WRITING_STATS } from "./utils/mockData";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import { authApi } from "./utils/api";

import AuthPage from "./pages/AuthPage";
import VerifyAccountPage from "./pages/VerifyAccountPage";
import DashboardPage from "./pages/DashboardPage";
import BooksPage from "./pages/BooksPage";
import BookDetailPage from "./pages/BookDetailPage";
import EditorPage from "./pages/EditorPage";
import AIPage from "./pages/AIPage";
import MediaPage from "./pages/MediaPage";
import OrdersPage from "./pages/OrdersPage";
import StatsPage from "./pages/StatsPage";
import BlockchainPage from "./pages/BlockchainPage";
import NotificationsPage from "./pages/NotificationsPage";
import SupportPage from "./pages/SupportPage";
import SupportAdminPage from "./pages/SupportAdminPage";
import SettingsPage from "./pages/SettingsPage";
import { Spinner } from "./components/Shared";

const NAV_SECTIONS = [
  {
    label: "Création",
    items: [
      { id: "dashboard", label: "Tableau de bord", icon: "home" },
      { id: "books", label: "Mes manuscrits", icon: "book" },
      { id: "editor", label: "Éditeur", icon: "edit" },
      { id: "ai", label: "Assistant IA", icon: "sparkle" },
    ],
  },
  {
    label: "Diffusion",
    items: [
      { id: "media", label: "Audio & vidéo", icon: "video" },
      { id: "orders", label: "Commandes", icon: "package" },
      { id: "blockchain", label: "Protection", icon: "shield" },
      { id: "stats", label: "Statistiques", icon: "chart" },
    ],
  },
  {
    label: "Compte",
    items: [
      { id: "notifications", label: "Notifications", icon: "bell" },
      { id: "support", label: "Support", icon: "support" },
      { id: "settings", label: "Paramètres", icon: "settings" },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "support-admin", label: "Support admin", icon: "support" },
    ],
  },
];

const PAGE_BREADCRUMB = {
  dashboard: ["Tableau de bord"],
  books: ["Mes manuscrits"],
  "book-detail": ["Mes manuscrits", "Détail"],
  editor: ["Éditeur"],
  ai: ["Assistant IA"],
  media: ["Audio & vidéo"],
  orders: ["Commandes"],
  stats: ["Statistiques"],
  blockchain: ["Protection blockchain"],
  notifications: ["Notifications"],
  support: ["Support"],
  "support-admin": ["Administration", "Support admin"],
  settings: ["Paramètres"],
};

// ─── Lecture des query params au chargement ────────────────────────────────
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname; // ex: "/verify-account" ou "/reset-password"
  return {
    // Détecte la "page" depuis le chemin URL (ex: /verify-account → "verify-account")
    page:       pathname.replace(/^\//, "") || params.get("page"),
    // `token` est utilisé pour les deux flows (verify ET reset)
    token:      params.get("token"),
  };
}

// ─── Composant principal (utilise le context) ─────────────────────────────

function AppInner() {
  const { user, token, loading, isAuthenticated, login, logout } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [activeBook, setActiveBook] = useState(BOOKS[0]);
  const [activeChapterId, setActiveChapterId] = useState(null);

  // Détection des query params pour les routes spéciales
  const [queryParams] = useState(() => getQueryParams());

  // Redirection vers reset-password si le chemin est /reset-password?token=...
  const isVerifyFlow     = queryParams.page === "verify-account" && queryParams.token;
  const isResetPwdFlow   = queryParams.page === "reset-password"  && queryParams.token;
  const initialAuthMode  = isResetPwdFlow ? "new-pwd" : "login";

  const unreadCount = NOTIFICATIONS.filter(n => !n.isRead).length;
  const navigate = (target) => setPage(target);

  // Chargement initial (restauration session)
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="sidebar-brand-mark" style={{ width: 48, height: 48, fontSize: 28 }}>B</div>
          <Spinner size={20} />
        </div>
      </div>
    );
  }

  // Vérification de compte via lien email : /verify-account?token=xxx
  if (isVerifyFlow) {
    return (
      <VerifyAccountPage
        token={queryParams.token}
        onGoLogin={() => {
          // Nettoie l'URL et recharge sur /
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }}
      />
    );
  }

  // Non authentifié → page d'auth (avec mode reset-password si applicable)
  if (!isAuthenticated) {
    return (
      <AuthPage
        onLogin={login}
        initialMode={initialAuthMode}
        resetToken={isResetPwdFlow ? queryParams.token : null}
      />
    );
  }

  // ── App principale (authentifié) ─────────────────────────────────────────

  const displayName = user?.fullName || user?.email || "Utilisateur";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">B</div>
          <div className="sidebar-brand-text">Biograf <em>AI</em></div>
        </div>

        {NAV_SECTIONS.map(section => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(item => (
              <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
                <Icon name={item.icon} size={15} />
                <span>{item.label}</span>
                {item.id === "notifications" && unreadCount > 0 && (
                  <span className="nav-item-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="streak-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="flame" size={14} color="var(--moss-deep)" />
              <span style={{ fontSize: 11.5, color: "var(--moss-deep)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Votre série</span>
            </div>
            <div className="display" style={{ fontSize: 22, color: "var(--ink)", lineHeight: 1 }}>
              {WRITING_STATS.currentStreak}<span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400, marginLeft: 4 }}>jours</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Continuez ainsi !</div>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <div className="crumb">
          {PAGE_BREADCRUMB[page]?.map((c, i, arr) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`crumb-item ${i === arr.length - 1 ? "current" : ""}`}>{c}</span>
              {i < arr.length - 1 && <Icon name="chevron-r" size={12} color="var(--border-medium)" />}
            </span>
          ))}
        </div>

        <div className="topbar-actions">
          <div className="search-box" style={{ width: 240, marginRight: 8 }}>
            <Icon name="search" size={14} />
            <input className="input" placeholder="Rechercher..." style={{ height: 36, fontSize: 13 }} />
          </div>

          <button className={`icon-btn ${unreadCount > 0 ? "icon-btn-dot" : ""}`} onClick={() => navigate("notifications")} title="Notifications">
            <Icon name="bell" size={16} />
          </button>

          <button className="icon-btn" onClick={() => navigate("support")} title="Support">
            <Icon name="support" size={16} />
          </button>

          <div style={{ width: 1, height: 20, background: "var(--border-soft)", margin: "0 4px" }} />

          <UserMenu
            displayName={displayName}
            firstName={firstName}
            onNavigateSettings={() => navigate("settings")}
            onLogout={logout}
          />
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {page === "dashboard"     && <DashboardPage navigate={navigate} setActiveBook={setActiveBook} />}
        {page === "books"         && <BooksPage navigate={navigate} setActiveBook={setActiveBook} />}
        {page === "book-detail"   && <BookDetailPage book={activeBook} navigate={navigate} setActiveChapterId={setActiveChapterId} />}
        {page === "editor"        && <EditorPage book={activeBook} initialChapterId={activeChapterId} navigate={navigate} />}
        {page === "ai"            && <AIPage navigate={navigate} />}
        {page === "media"         && <MediaPage />}
        {page === "orders"        && <OrdersPage />}
        {page === "stats"         && <StatsPage />}
        {page === "blockchain"    && <BlockchainPage />}
        {page === "notifications" && <NotificationsPage />}
        {page === "support"       && <SupportPage />}
        {page === "support-admin" && <SupportAdminPage />}
        {page === "settings"      && <SettingsPage onLogout={logout} />}
      </main>
    </div>
  );
}

// ─── User pill avec menu déroulant ────────────────────────────────────────

function UserMenu({ displayName, firstName, onNavigateSettings, onLogout }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async (e) => {
    e.stopPropagation();
    setLoggingOut(true);
    try { await onLogout(); } catch { setLoggingOut(false); }
  };

  return (
    <div style={{ position: "relative" }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} tabIndex={-1}>
      <div className="user-pill" onClick={() => setOpen(v => !v)} style={{ cursor: "pointer" }}>
        <Avatar name={displayName} size="sm" />
        <span className="name">{firstName}</span>
        <Icon name="chevron-d" size={13} color="var(--text-muted)" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </div>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 220, background: "var(--bg-paper)", border: "1px solid var(--border-soft)",
          borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)", padding: "8px 0",
          zIndex: 100, animation: "fadeUp 0.15s var(--ease) both",
        }}>
          {/* Header */}
          <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{displayName}</div>
          </div>
          {/* Actions */}
          <button
            onClick={() => { setOpen(false); onNavigateSettings(); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 16px", fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-soft)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Icon name="settings" size={14} /> Paramètres
          </button>
          <div style={{ height: 1, background: "var(--border-soft)", margin: "4px 0" }} />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 16px", fontSize: 13, color: "var(--terracotta)", background: "none", border: "none", cursor: loggingOut ? "default" : "pointer", textAlign: "left", opacity: loggingOut ? 0.6 : 1 }}
            onMouseEnter={e => { if (!loggingOut) e.currentTarget.style.background = "var(--terracotta-bg)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            {loggingOut ? <><Spinner size={13} /> Déconnexion…</> : <><Icon name="logout" size={14} /> Se déconnecter</>}
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ToastProvider>
  );
}
