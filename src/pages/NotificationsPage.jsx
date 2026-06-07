import { useState, useEffect, useCallback } from "react";
import { Icon } from "../components/Icon";
import { Modal, Spinner } from "../components/Shared";
import { useToast } from "../components/Toast";
import { notifApi, bookApi } from "../utils/api";

// ─── Config par type ──────────────────────────────────────────────────────────
const TYPE_CFG = {
  AI_SUGGESTION:        { icon: "sparkle", bg: "var(--ochre-bg)",      color: "var(--ochre)",          label: "IA" },
  COLLABORATION_INVITE: { icon: "users",   bg: "var(--indigo-bg)",     color: "var(--indigo)",         label: "Collaboration" },
  ORDER_UPDATE:         { icon: "package", bg: "var(--moss-bg)",       color: "var(--moss)",           label: "Commande" },
  WRITING_REMINDER:     { icon: "feather", bg: "var(--terracotta-bg)", color: "var(--terracotta)",     label: "Rappel" },
  SYSTEM:               { icon: "info",    bg: "var(--bg-soft)",       color: "var(--text-secondary)", label: "Système" },
};

const FREQ_LABELS = { DAILY: "Quotidien", EVERY_2_DAYS: "Tous les 2 jours", WEEKLY: "Hebdomadaire" };

// ─── Composant principal ──────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { toast } = useToast();
  const [tab, setTab]         = useState("notifications"); // "notifications" | "reminders"
  const [notifs, setNotifs]   = useState([]);
  const [meta, setMeta]       = useState({ total: 0, unreadCount: 0, page: 1, totalPages: 1 });
  const [filter, setFilter]   = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [page, setPage]       = useState(1);
  const LIMIT = 20;

  // ── Fetch notifications ────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async (p = 1, f = filter) => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (f === "UNREAD")                           params.isRead = false;
      else if (f !== "ALL")                         params.type   = f;

      const res = await notifApi.list(params);
      const data = res.data || res.notifications || (Array.isArray(res) ? res : []);
      const m    = res.meta ?? { total: data.length, unreadCount: 0, page: 1, totalPages: 1 };

      setNotifs(p === 1 ? data : prev => [...prev, ...data]);
      setMeta(m);
      setPage(p);
    } catch {
      toast.error("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }, [filter]); // eslint-disable-line

  useEffect(() => { fetchNotifs(1, filter); }, [filter]); // eslint-disable-line

  // ── Mark one read ──────────────────────────────────────────────────────────
  const markRead = async (n) => {
    if (n.isRead) return;
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    setMeta(prev => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
    try {
      await notifApi.markRead([n.id]);
    } catch {
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: false } : x));
      setMeta(prev => ({ ...prev, unreadCount: prev.unreadCount + 1 }));
    }
  };

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAll = async () => {
    if (meta.unreadCount === 0) return;
    setActionBusy(true);
    const prev = notifs;
    setNotifs(l => l.map(n => ({ ...n, isRead: true })));
    setMeta(m => ({ ...m, unreadCount: 0 }));
    try {
      await notifApi.markAllRead();
      toast.success("Toutes les notifications marquées comme lues.");
    } catch {
      setNotifs(prev);
      toast.error("Une erreur est survenue.");
    } finally {
      setActionBusy(false);
    }
  };

  // ── Delete one ─────────────────────────────────────────────────────────────
  const deleteOne = async (id, e) => {
    e.stopPropagation();
    const prev = notifs;
    const removed = notifs.find(n => n.id === id);
    setNotifs(l => l.filter(n => n.id !== id));
    if (removed && !removed.isRead) setMeta(m => ({ ...m, unreadCount: Math.max(0, m.unreadCount - 1) }));
    try {
      await notifApi.delete(id);
    } catch {
      setNotifs(prev);
      toast.error("Impossible de supprimer.");
    }
  };

  // ── Delete all read ────────────────────────────────────────────────────────
  const deleteRead = async () => {
    const readCount = notifs.filter(n => n.isRead).length;
    if (!readCount) { toast.info("Aucune notification lue à supprimer."); return; }
    setActionBusy(true);
    const prev = notifs;
    setNotifs(l => l.filter(n => !n.isRead));
    try {
      await notifApi.deleteRead();
      toast.success(`${readCount} notification${readCount > 1 ? "s" : ""} supprimée${readCount > 1 ? "s" : ""}.`);
    } catch {
      setNotifs(prev);
      toast.error("Une erreur est survenue.");
    } finally {
      setActionBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  const FILTERS = [
    ["ALL",                  "Toutes",        meta.total],
    ["UNREAD",               "Non lues",      meta.unreadCount],
    ["AI_SUGGESTION",        "IA",            notifs.filter(n => n.type === "AI_SUGGESTION").length],
    ["COLLABORATION_INVITE", "Collaboration", notifs.filter(n => n.type === "COLLABORATION_INVITE").length],
    ["ORDER_UPDATE",         "Commandes",     notifs.filter(n => n.type === "ORDER_UPDATE").length],
    ["WRITING_REMINDER",     "Rappels",       notifs.filter(n => n.type === "WRITING_REMINDER").length],
    ["SYSTEM",               "Système",       notifs.filter(n => n.type === "SYSTEM").length],
  ];

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Activité</div>
          <h1 className="page-title">Vos <em>notifications</em></h1>
          <p className="page-subtitle">
            {meta.unreadCount > 0
              ? `${meta.unreadCount} non lue${meta.unreadCount > 1 ? "s" : ""}`
              : "Tout est à jour"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={deleteRead} disabled={actionBusy || notifs.every(n => !n.isRead)}>
            <Icon name="trash" size={13} /> Supprimer les lues
          </button>
          <button className="btn btn-secondary" onClick={markAll} disabled={actionBusy || meta.unreadCount === 0}>
            {actionBusy ? <Spinner size={13} /> : <Icon name="check" size={13} />}
            Tout marquer comme lu
          </button>
        </div>
      </div>

      {/* ─── Tabs principaux ────────────────────────────────────────────── */}
      <div className="fade-up" data-stagger="1" style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-soft)", marginBottom: 20 }}>
        {[["notifications", "Notifications", "bell"], ["reminders", "Rappels d'écriture", "feather"]].map(([k, l, ic]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
              fontSize: 13.5, fontWeight: tab === k ? 600 : 400,
              color: tab === k ? "var(--ink)" : "var(--text-muted)",
              borderBottom: tab === k ? "2px solid var(--terracotta)" : "2px solid transparent",
              marginBottom: -2, background: "none", cursor: "pointer", transition: "all 0.15s",
            }}>
            <Icon name={ic} size={14} color={tab === k ? "var(--terracotta)" : "var(--text-muted)"} />
            {l}
            {k === "notifications" && meta.unreadCount > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: "var(--terracotta)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                {meta.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab : Notifications ─────────────────────────────────────────── */}
      {tab === "notifications" && (
        <>
          {/* Sous-filtres */}
          <div className="fade-up" data-stagger="2"
            style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-soft)", borderRadius: "var(--r-md)", marginBottom: 20, width: "fit-content", flexWrap: "wrap" }}>
            {FILTERS.map(([k, l, c]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{
                  padding: "6px 14px", fontSize: 12.5, fontWeight: 500, borderRadius: "var(--r-sm)",
                  background: filter === k ? "var(--bg-paper)" : "transparent",
                  color: filter === k ? "var(--ink)" : "var(--text-secondary)",
                  boxShadow: filter === k ? "var(--shadow-sm)" : "none", transition: "all 0.15s",
                }}>
                {l}
                {c > 0 && <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 5 }}>{c}</span>}
              </button>
            ))}
          </div>

          {/* Liste */}
          {loading && notifs.length === 0 ? (
            <div className="card" style={{ display: "flex", justifyContent: "center", padding: 48 }}>
              <Spinner size={20} />
            </div>
          ) : notifs.length === 0 ? (
            <div className="card empty fade-up">
              <div className="empty-icon"><Icon name="bell" size={24} /></div>
              <div className="display" style={{ fontSize: 17 }}>Aucune notification</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Vous êtes à jour.</p>
            </div>
          ) : (
            <>
              <div className="card fade-up" data-stagger="3" style={{ padding: 0, overflow: "hidden" }}>
                {notifs.map((n, i) => {
                  const cfg = TYPE_CFG[n.type] || TYPE_CFG.SYSTEM;
                  return (
                    <div key={n.id}
                      style={{
                        display: "flex", gap: 14, padding: "16px 20px",
                        borderBottom: i < notifs.length - 1 ? "1px solid var(--border-soft)" : "none",
                        background: !n.isRead ? "linear-gradient(90deg, rgba(var(--terracotta-raw,184,85,59),0.04) 0%, transparent 40%)" : "transparent",
                        cursor: n.isRead ? "default" : "pointer", transition: "background 0.12s",
                        position: "relative",
                        animation: `fadeUp 0.3s ${Math.min(i * 0.035, 0.3)}s var(--ease) both`,
                      }}
                      onClick={() => markRead(n)}
                      onMouseEnter={e => { if (!n.isRead) e.currentTarget.style.background = "var(--bg-soft)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = !n.isRead ? "linear-gradient(90deg, rgba(184,85,59,0.04) 0%, transparent 40%)" : "transparent"; }}>

                      {!n.isRead && (
                        <div style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", width: 6, height: 6, borderRadius: "50%", background: "var(--terracotta)" }} />
                      )}

                      <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={cfg.icon} size={17} color={cfg.color} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "var(--ink)", fontWeight: !n.isRead ? 600 : 400 }}>{n.title}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 99,
                            background: cfg.bg, color: cfg.color, letterSpacing: "0.04em", textTransform: "uppercase",
                          }}>{cfg.label}</span>
                        </div>
                        <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{n.body}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5 }}>
                          {formatDate(n.createdAt)}
                        </div>
                      </div>

                      <button className="icon-btn" title="Supprimer"
                        onClick={(e) => deleteOne(n.id, e)}
                        style={{ flexShrink: 0, alignSelf: "center" }}>
                        <Icon name="trash" size={14} color="var(--text-muted)" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Charger plus */}
              {page < meta.totalPages && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                  <button className="btn btn-secondary" onClick={() => fetchNotifs(page + 1, filter)} disabled={loading}>
                    {loading ? <><Spinner size={13} /> Chargement…</> : "Charger plus"}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Tab : Rappels d'écriture ─────────────────────────────────────── */}
      {tab === "reminders" && (
        <RemindersTab toast={toast} />
      )}
    </div>
  );
}

// ─── Tab Rappels ──────────────────────────────────────────────────────────────
function RemindersTab({ toast }) {
  const [reminders, setReminders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null); // reminder object or null (= create)
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notifApi.listReminders();
      setReminders(res.data || (Array.isArray(res) ? res : []));
    } catch {
      toast.error("Impossible de charger les rappels.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, []); // eslint-disable-line

  const toggle = async (r) => {
    setTogglingId(r.id);
    const prev = reminders;
    setReminders(l => l.map(x => x.id === r.id ? { ...x, isActive: !x.isActive } : x));
    try {
      await notifApi.toggleReminder(r.id);
    } catch {
      setReminders(prev);
      toast.error("Impossible de modifier le rappel.");
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (id) => {
    setDeletingId(id);
    const prev = reminders;
    setReminders(l => l.filter(r => r.id !== id));
    try {
      await notifApi.deleteReminder(id);
      toast.success("Rappel supprimé.");
    } catch {
      setReminders(prev);
      toast.error("Impossible de supprimer.");
    } finally {
      setDeletingId(null);
    }
  };

  const onSaved = (reminder, isNew) => {
    if (isNew) {
      setReminders(prev => [reminder, ...prev]);
    } else {
      setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
    }
    setShowModal(false);
    setEditing(null);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }} className="fade-up">
        <div>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
            Recevez des notifications pour ne jamais manquer une session d'écriture.
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Icon name="plus" size={13} /> Nouveau rappel
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spinner size={20} />
        </div>
      ) : reminders.length === 0 ? (
        <div className="card empty fade-up">
          <div className="empty-icon"><Icon name="feather" size={24} /></div>
          <div className="display" style={{ fontSize: 17 }}>Aucun rappel</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Ajoutez un rappel pour maintenir votre rythme d'écriture.</p>
          <button className="btn btn-accent btn-sm" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Icon name="plus" size={13} /> Créer un rappel
          </button>
        </div>
      ) : (
        <div className="card fade-up" style={{ padding: 0, overflow: "hidden" }}>
          {reminders.map((r, i) => (
            <div key={r.id}
              style={{
                display: "flex", gap: 16, alignItems: "center", padding: "18px 20px",
                borderBottom: i < reminders.length - 1 ? "1px solid var(--border-soft)" : "none",
                opacity: r.isActive ? 1 : 0.55, transition: "opacity 0.2s",
                animation: `fadeUp 0.3s ${i * 0.04}s var(--ease) both`,
              }}>

              {/* Icône */}
              <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--r-md)", background: r.isActive ? "var(--terracotta-bg)" : "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="feather" size={18} color={r.isActive ? "var(--terracotta)" : "var(--text-muted)"} />
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>
                  {r.book ? r.book.title : "Rappel global — tous les livres"}
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "var(--text-secondary)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name="clock" size={12} /> {r.time}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name="calendar" size={12} /> {FREQ_LABELS[r.frequency] ?? r.frequency}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => { setEditing(r); setShowModal(true); }}
                  className="icon-btn" title="Modifier">
                  <Icon name="edit" size={14} color="var(--text-muted)" />
                </button>

                <button
                  onClick={() => remove(r.id)}
                  disabled={deletingId === r.id}
                  className="icon-btn" title="Supprimer">
                  {deletingId === r.id ? <Spinner size={13} /> : <Icon name="trash" size={14} color="var(--text-muted)" />}
                </button>

                {/* Toggle switch */}
                <button
                  onClick={() => toggle(r)}
                  disabled={togglingId === r.id}
                  title={r.isActive ? "Désactiver" : "Activer"}
                  style={{
                    width: 40, height: 22, borderRadius: 11, padding: 0, border: "none", cursor: "pointer",
                    background: r.isActive ? "var(--moss)" : "var(--border-medium)",
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}>
                  <span style={{
                    position: "absolute", top: 3, left: r.isActive ? 20 : 4, width: 16, height: 16,
                    borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ReminderModal
          reminder={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={onSaved}
          toast={toast}
        />
      )}
    </>
  );
}

// ─── Modal Rappel ─────────────────────────────────────────────────────────────
function ReminderModal({ reminder, onClose, onSaved, toast }) {
  const isEdit = !!reminder;
  const [form, setForm] = useState({
    bookId:    reminder?.bookId    ?? "",
    frequency: reminder?.frequency ?? "DAILY",
    time:      reminder?.time      ?? "08:00",
  });
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bookApi.list()
      .then(res => setBooks(res.data || res.books || (Array.isArray(res) ? res : [])))
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        frequency: form.frequency,
        time:      form.time,
        ...(form.bookId ? { bookId: form.bookId } : {}),
      };

      let saved;
      if (isEdit) {
        const res = await notifApi.updateReminder(reminder.id, payload);
        saved = res.reminder ?? { ...reminder, ...payload };
        toast.success("Rappel mis à jour.");
      } else {
        const res = await notifApi.createReminder(payload);
        saved = res.reminder ?? res;
        toast.success("Rappel créé.");
      }

      // Attacher le livre si nécessaire
      if (form.bookId && books.length > 0) {
        const book = books.find(b => b.id === form.bookId);
        if (book) saved = { ...saved, book: { id: book.id, title: book.title, coverImageUrl: book.coverImageUrl } };
      } else {
        saved = { ...saved, book: null };
      }

      onSaved(saved, !isEdit);
    } catch (e) {
      toast.error(e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Modifier le rappel" : "Nouveau rappel d'écriture"}
      subtitle="Recevez une notification pour maintenir votre rythme"
      size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        <div className="field-group">
          <label className="field-label">Livre (optionnel)</label>
          <select className="select" value={form.bookId} onChange={set("bookId")}>
            <option value="">— Tous les livres en cours —</option>
            {books.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
            Laissez vide pour un rappel global.
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field-group">
            <label className="field-label">Fréquence</label>
            <select className="select" value={form.frequency} onChange={set("frequency")}>
              <option value="DAILY">Quotidien</option>
              <option value="EVERY_2_DAYS">Tous les 2 jours</option>
              <option value="WEEKLY">Hebdomadaire</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Heure</label>
            <input className="input" type="time" value={form.time} onChange={set("time")} />
          </div>
        </div>

        {/* Aperçu */}
        <div style={{ padding: "12px 16px", background: "var(--terracotta-bg)", borderRadius: "var(--r-md)", border: "1px solid rgba(184,85,59,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--terracotta)" }}>
            <Icon name="feather" size={13} />
            <span>
              {FREQ_LABELS[form.frequency] ?? form.frequency} à {form.time}
              {form.bookId && books.find(b => b.id === form.bookId)
                ? ` — ${books.find(b => b.id === form.bookId).title}`
                : " — tous les livres"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="btn btn-primary btn-block" onClick={submit} disabled={loading || !form.time}>
            {loading ? <><Spinner size={14} /> Enregistrement…</> : isEdit ? "Mettre à jour" : "Créer le rappel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = now - d;
    const min  = Math.floor(diff / 60000);
    const h    = Math.floor(min / 60);
    const day  = Math.floor(h / 24);
    if (min < 1)   return "À l'instant";
    if (min < 60)  return `il y a ${min} min`;
    if (h   < 24)  return `il y a ${h}h`;
    if (day === 1) return "hier";
    if (day < 7)   return `il y a ${day} jours`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: day > 365 ? 'numeric' : undefined });
  } catch { return dateStr; }
}
