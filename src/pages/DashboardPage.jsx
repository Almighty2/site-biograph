import { useState, useEffect } from "react";
import { Icon } from "../components/Icon";
import { BookCover } from "../components/BookCover";
import { StatusBadge, Spinner } from "../components/Shared";
import { useAuth } from "../context/AuthContext";
import { bookApi, notifApi } from "../utils/api";
import { STATUS_LABELS } from "../utils/mockData";

const GENRE_LABELS = {
  AUTOBIOGRAPHY: "Autobiographie", BIOGRAPHY: "Biographie", MEMOIR: "Mémoire",
  FAMILY_ARCHIVE: "Archive familiale", COMMUNITY_HISTORY: "Histoire communautaire", OTHER: "Autre",
};

export default function DashboardPage({ navigate, setActiveBook }) {
  const { user } = useAuth();
  const [books, setBooks]   = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = (user?.fullName || user?.email || "").split(" ")[0] || "Écrivain";

  useEffect(() => {
    Promise.all([
      bookApi.list()
        .then(res => setBooks(res.data || res.books || (Array.isArray(res) ? res : [])))
        .catch(() => {}),
      notifApi.list({ limit: 6 })
        .then(res => setNotifs(res.data || res.notifications || (Array.isArray(res) ? res : [])))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const totalWords    = books.reduce((a, b) => a + (b.wordCount ?? 0), 0);
  const totalChapters = books.reduce((a, b) => a + (Array.isArray(b.chapters) ? b.chapters.length : (b._count?.chapters ?? 0)), 0);
  const unreadCount   = notifs.filter(n => !n.isRead).length;
  const activeBooks   = books.filter(b => b.status === "IN_PROGRESS" || b.status === "DRAFT");

  const recentBook = [...activeBooks].sort((a, b) =>
    new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0)
  )[0] || books[0] || null;

  return (
    <div>
      {/* ─── En-tête ──────────────────────────────────────────────────────── */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Bonjour, {firstName}
          </span>
          <span style={{ height: 1, flex: 1, background: "var(--border-soft)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <h1 className="display" style={{ fontSize: 36, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.1, marginTop: 8 }}>
          Reprenons l'écriture{" "}
          <em style={{ color: "var(--terracotta)", fontStyle: "italic", fontWeight: 400 }}>
            là où vous l'aviez laissée.
          </em>
        </h1>
      </div>

      {/* ─── KPI ──────────────────────────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 36 }}>
        {[
          { label: "Mots écrits",    value: loading ? "—" : totalWords.toLocaleString('fr-FR'),   icon: "feather", color: "var(--terracotta)", bg: "var(--terracotta-bg)" },
          { label: "Manuscrits",     value: loading ? "—" : books.length,                          icon: "book",    color: "var(--moss)",      bg: "var(--moss-bg)" },
          { label: "Chapitres",      value: loading ? "—" : totalChapters,                         icon: "edit",    color: "var(--indigo)",    bg: "var(--indigo-bg)" },
          { label: "Notifications",  value: loading ? "—" : unreadCount,    suffix: "non lues",    icon: "bell",    color: "var(--ochre)",     bg: "var(--ochre-bg)" },
        ].map((s, i) => (
          <div key={i} className="stat fade-up" data-stagger={i + 1}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={14} color={s.color} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
              <span className="stat-value">{s.value}</span>
              {s.suffix && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Continuer l'écriture + Progression ──────────────────────────── */}
      <div className="grid-2-side" style={{ marginBottom: 36 }}>

        {/* Carte "reprendre" */}
        {loading ? (
          <div className="card fade-up" style={{ display: "flex", minHeight: 240, padding: 0, overflow: "hidden" }}>
            <div style={{ width: 130, background: "var(--bg-soft)", animation: "pulse 1.4s ease infinite" }} />
            <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {[80, 60, 40, 90].map((w, j) => (
                <div key={j} style={{ height: 12, borderRadius: 6, background: "var(--bg-soft)", width: `${w}%`, animation: "pulse 1.4s ease infinite" }} />
              ))}
            </div>
          </div>
        ) : recentBook ? (
          <div className="card fade-up" data-stagger="1" style={{ padding: 0, overflow: "hidden", display: "flex", minHeight: 240 }}>
            <div style={{ background: "var(--bg-soft)", padding: 24, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
              <BookCover book={recentBook} size="md" />
            </div>
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "var(--terracotta-bg)", borderRadius: 999, fontSize: 11, color: "var(--terracotta)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    <Icon name="bookmark" size={11} /> Continuer l'écriture
                  </div>
                  <StatusBadge status={recentBook.status} />
                </div>

                <h3 className="display" style={{ fontSize: 22, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {recentBook.title}
                </h3>
                {recentBook.subtitle && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {recentBook.subtitle}
                  </p>
                )}

                <div style={{ display: "flex", gap: 18, fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>
                  <span>
                    <strong style={{ color: "var(--ink)" }}>
                      {Array.isArray(recentBook.chapters) ? recentBook.chapters.length : (recentBook._count?.chapters ?? 0)}
                    </strong> ch.
                  </span>
                  <span>
                    <strong style={{ color: "var(--ink)" }}>{((recentBook.wordCount ?? 0) / 1000).toFixed(1)}k</strong> mots
                  </span>
                  {recentBook.targetWordCount > 0 && (
                    <span>
                      <strong style={{ color: "var(--ink)" }}>
                        {Math.min(Math.round(((recentBook.wordCount ?? 0) / recentBook.targetWordCount) * 100), 100)}%
                      </strong> de l'objectif
                    </span>
                  )}
                </div>

                {recentBook.targetWordCount > 0 && (
                  <>
                    <div className="progress" style={{ marginBottom: 5 }}>
                      <div className="progress-bar" style={{ width: `${Math.min(Math.round(((recentBook.wordCount ?? 0) / recentBook.targetWordCount) * 100), 100)}%` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)" }}>
                      <span>{(recentBook.wordCount ?? 0).toLocaleString('fr-FR')} mots</span>
                      <span>Objectif : {recentBook.targetWordCount.toLocaleString('fr-FR')}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => { setActiveBook(recentBook); navigate("editor"); }}>
                  <Icon name="edit" size={14} /> Reprendre l'écriture
                </button>
                <button className="btn btn-secondary" onClick={() => { setActiveBook(recentBook); navigate("book-detail"); }}>
                  Détails
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card fade-up card-padded" data-stagger="1"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 240, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--terracotta-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="book" size={24} color="var(--terracotta)" />
            </div>
            <div>
              <div className="display" style={{ fontSize: 17, color: "var(--ink)", marginBottom: 6 }}>Aucun manuscrit</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 240, margin: "0 auto" }}>
                Créez votre premier livre pour commencer l'aventure.
              </p>
            </div>
            <button className="btn btn-accent" onClick={() => navigate("books")}>
              <Icon name="plus" size={14} /> Créer un livre
            </button>
          </div>
        )}

        {/* Progression par livre */}
        <div className="card card-padded fade-up" data-stagger="2">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div className="display" style={{ fontSize: 15, color: "var(--ink)" }}>Progression</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Avancement par manuscrit</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("books")}>
              Tous <Icon name="arrow-r" size={13} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 11, borderRadius: 6, background: "var(--bg-soft)", width: "65%", animation: "pulse 1.4s ease infinite" }} />
                  <div style={{ height: 5, borderRadius: 6, background: "var(--bg-soft)", animation: "pulse 1.4s ease infinite" }} />
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
              Aucun livre pour l'instant.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {books.slice(0, 5).map(book => {
                const pct = book.targetWordCount > 0
                  ? Math.min(Math.round(((book.wordCount ?? 0) / book.targetWordCount) * 100), 100)
                  : (book.progressPct ?? 0);
                const isComplete = pct >= 100;
                return (
                  <div key={book.id} style={{ cursor: "pointer" }}
                    onClick={() => { setActiveBook(book); navigate("book-detail"); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "76%" }}>
                        {book.title}
                      </span>
                      <span style={{ fontSize: 11.5, color: isComplete ? "var(--moss)" : "var(--text-muted)", flexShrink: 0, fontWeight: isComplete ? 600 : 400 }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress" style={{ height: 5 }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, background: isComplete ? "var(--moss)" : "var(--terracotta)", transition: "width 0.6s var(--ease)" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      <span>{GENRE_LABELS[book.genre] ?? book.genre ?? "—"}</span>
                      <span>{(book.wordCount ?? 0).toLocaleString('fr-FR')} mots</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Bibliothèque récente ─────────────────────────────────────────── */}
      <div className="fade-up" data-stagger="3" style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <h2 className="display" style={{ fontSize: 22, color: "var(--ink)" }}>Vos manuscrits</h2>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 2 }}>
              {loading ? "Chargement…" : `${books.length} livre${books.length !== 1 ? "s" : ""} · ${totalWords.toLocaleString('fr-FR')} mots écrits`}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("books")}>
            Tous les livres <Icon name="arrow-r" size={13} />
          </button>
        </div>

        {loading ? (
          <div className="grid-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ height: 130, background: "var(--bg-soft)", animation: "pulse 1.4s ease infinite" }} />
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ height: 12, borderRadius: 6, background: "var(--bg-soft)", width: "70%", animation: "pulse 1.4s ease infinite" }} />
                  <div style={{ height: 8, borderRadius: 6, background: "var(--bg-soft)", width: "40%", animation: "pulse 1.4s ease infinite" }} />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="card empty fade-up">
            <div className="empty-icon"><Icon name="book" size={28} /></div>
            <div className="display" style={{ fontSize: 18, color: "var(--ink)" }}>Aucun manuscrit</div>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Créez votre premier livre pour commencer.</p>
            <button className="btn btn-accent btn-sm" onClick={() => navigate("books")}>Créer un livre</button>
          </div>
        ) : (
          <div className="grid-4">
            {books.slice(0, 4).map((book, i) => {
              const pct = book.targetWordCount > 0
                ? Math.min(Math.round(((book.wordCount ?? 0) / book.targetWordCount) * 100), 100)
                : (book.progressPct ?? 0);
              return (
                <div key={book.id} className="card card-hover fade-up" data-stagger={i + 1}
                  style={{ padding: 0, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}
                  onClick={() => { setActiveBook(book); navigate("book-detail"); }}>
                  <div style={{ background: "var(--bg-soft)", padding: 20, display: "flex", justifyContent: "center", position: "relative" }}>
                    <BookCover book={book} size="sm" />
                    {book.isOwner === false && (
                      <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: "var(--moss-bg, #e8f0e2)", color: "var(--moss-deep, #4a6b35)", border: "1px solid var(--moss-mid, #b8d0a0)" }}>
                        Collaborateur
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div className="display" style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.3, marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {book.title}
                    </div>
                    {book.subtitle && (
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                        {book.subtitle}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 10 }}>
                      <StatusBadge status={book.status} dot={false} />
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{pct}%</span>
                    </div>
                    <div className="progress" style={{ marginTop: 8, height: 3 }}>
                      <div className="progress-bar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Actions rapides + Activité récente ──────────────────────────── */}
      <div className="grid-2-side fade-up" data-stagger="4">

        {/* Actions rapides */}
        <div className="card card-padded">
          <div style={{ marginBottom: 18 }}>
            <h3 className="display" style={{ fontSize: 16, color: "var(--ink)" }}>Actions rapides</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Raccourcis vers les fonctions clés</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Nouveau livre",    icon: "plus",    page: "books",         color: "var(--terracotta)", bg: "var(--terracotta-bg)" },
              { label: "Ouvrir l'éditeur", icon: "edit",    page: "editor",        color: "var(--moss)",       bg: "var(--moss-bg)" },
              { label: "Assistant IA",     icon: "sparkle", page: "ai",            color: "var(--ochre)",      bg: "var(--ochre-bg)" },
              { label: "Statistiques",     icon: "chart",   page: "stats",         color: "var(--indigo)",     bg: "var(--indigo-bg)" },
              { label: "Mes commandes",    icon: "package", page: "orders",        color: "var(--text-secondary)", bg: "var(--bg-soft)" },
              { label: "Paramètres",       icon: "settings",page: "settings",      color: "var(--text-secondary)", bg: "var(--bg-soft)" },
            ].map(a => (
              <button key={a.page} onClick={() => navigate(a.page)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: "var(--r-md)", border: "1px solid var(--border-soft)", background: "var(--bg-paper)", cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-soft)"; e.currentTarget.style.borderColor = "var(--border-medium)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-paper)"; e.currentTarget.style.borderColor = "var(--border-soft)"; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={a.icon} size={14} color={a.color} />
                </div>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="card card-padded">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 className="display" style={{ fontSize: 16, color: "var(--ink)" }}>Activité récente</h3>
              {!loading && unreadCount > 0 && (
                <span style={{ fontSize: 12, color: "var(--terracotta)", marginTop: 2, display: "block" }}>
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("notifications")}>
              Tout voir <Icon name="arrow-r" size={13} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-soft)", flexShrink: 0, animation: "pulse 1.4s ease infinite" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ height: 11, borderRadius: 6, background: "var(--bg-soft)", width: "70%", animation: "pulse 1.4s ease infinite" }} />
                    <div style={{ height: 9, borderRadius: 6, background: "var(--bg-soft)", width: "50%", animation: "pulse 1.4s ease infinite" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <Icon name="bell" size={20} color="var(--border-medium)" />
              </div>
              <p style={{ fontSize: 13 }}>Aucune notification pour l'instant.</p>
            </div>
          ) : (
            notifs.slice(0, 5).map((n, i, arr) => (
              <div key={n.id || i}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "50%", background: notifBg(n.type), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={notifIcon(n.type)} size={15} color={notifColor(n.type)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: n.isRead ? 400 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--terracotta)", flexShrink: 0 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.body || n.message || ""}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    {formatRelativeDate(n.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = now - d;
    const min  = Math.floor(diff / 60000);
    const h    = Math.floor(min / 60);
    const day  = Math.floor(h / 24);
    if (min < 1)  return "À l'instant";
    if (min < 60) return `il y a ${min} min`;
    if (h   < 24) return `il y a ${h}h`;
    if (day === 1) return "hier";
    if (day < 7)  return `il y a ${day} jours`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch { return ""; }
}

const notifIcon  = t => ({ AI_SUGGESTION: "sparkle", COLLABORATION_INVITE: "users", ORDER_UPDATE: "package", WRITING_REMINDER: "feather", SYSTEM: "info" }[t] || "bell");
const notifBg    = t => ({ AI_SUGGESTION: "var(--ochre-bg)", COLLABORATION_INVITE: "var(--indigo-bg)", ORDER_UPDATE: "var(--moss-bg)", WRITING_REMINDER: "var(--terracotta-bg)", SYSTEM: "var(--bg-soft)" }[t] || "var(--bg-soft)");
const notifColor = t => ({ AI_SUGGESTION: "var(--ochre)", COLLABORATION_INVITE: "var(--indigo)", ORDER_UPDATE: "var(--moss)", WRITING_REMINDER: "var(--terracotta)", SYSTEM: "var(--text-secondary)" }[t] || "var(--text-secondary)");
