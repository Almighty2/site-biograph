import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "../components/Icon";
import { Modal, Avatar, EmptyState, Spinner } from "../components/Shared";
import { useToast } from "../components/Toast";
import { supportApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";

// ─── Status labels / colors ───────────────────────────────────────────────
const STATUS_CFG = {
  OPEN:        { label: "Ouvert",      color: "var(--indigo)",    bg: "var(--indigo-bg)" },
  IN_PROGRESS: { label: "En cours",   color: "var(--ochre)",     bg: "var(--ochre-bg)" },
  RESOLVED:    { label: "Résolu",     color: "var(--moss)",      bg: "var(--moss-bg)" },
  CLOSED:      { label: "Fermé",      color: "var(--text-muted)", bg: "var(--bg-soft)" },
};

function SupportStatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.OPEN;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
      color: cfg.color, background: cfg.bg, padding: "3px 8px", borderRadius: 999,
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function ThreadSkeleton() {
  return (
    <div style={{ padding: 16, borderBottom: "1px solid var(--border-soft)" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ marginBottom: i < 3 ? 16 : 0 }}>
          <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 6, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 12, width: "90%", marginBottom: 4, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [threads, setThreads]             = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeId, setActiveId]           = useState(null);
  const [activeThread, setActiveThread]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [message, setMessage]             = useState("");
  const [busy, setBusy]                   = useState({});
  const [showNew, setShowNew]             = useState(false);
  const [search, setSearch]               = useState("");

  const messagesEndRef = useRef(null);

  // ── Charger la liste des threads ──────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const res = await supportApi.listThreads();
      const data = res.data ?? [];
      setThreads(data);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
    } catch {
      toast.error("Impossible de charger vos discussions.");
    } finally {
      setLoadingThreads(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchThreads(); }, []); // eslint-disable-line

  // ── Charger les messages du thread actif ──────────────────────────────────
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        const [threadRes, msgRes] = await Promise.all([
          supportApi.getThread(activeId),
          supportApi.getMessages(activeId),
        ]);
        setActiveThread(threadRes.thread ?? threadRes);
        setMessages(msgRes.data ?? []);
      } catch {
        toast.error("Impossible de charger la discussion.");
      } finally {
        setLoadingMessages(false);
      }
    })();
  }, [activeId]); // eslint-disable-line

  // ── Scroll automatique vers le bas ─────────────────────────────────────────
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Envoyer un message ────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = message.trim();
    if (!content || busy.send) return;

    setBusy(p => ({ ...p, send: true }));
    const optimistic = {
      id: `tmp_${Date.now()}`,
      content,
      senderType: "USER",
      senderId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setMessage("");

    try {
      const res = await supportApi.sendMessage(activeId, { content });
      setMessages(prev => prev.map(m => m.id === optimistic.id ? res.data : m));
      // Si le thread était OPEN, il est passé IN_PROGRESS → rafraîchir
      if (activeThread?.status === "OPEN") {
        setActiveThread(prev => ({ ...prev, status: "IN_PROGRESS" }));
        setThreads(prev => prev.map(t =>
          t.id === activeId ? { ...t, status: "IN_PROGRESS" } : t
        ));
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setMessage(content);
      toast.error(err.message ?? "Impossible d'envoyer le message.");
    } finally {
      setBusy(p => ({ ...p, send: false }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
  };

  // ── Supprimer un message ──────────────────────────────────────────────────
  const handleDeleteMessage = async (msgId) => {
    setBusy(p => ({ ...p, [`del_${msgId}`]: true }));
    try {
      await supportApi.deleteMessage(activeId, msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success("Message supprimé.");
    } catch (err) {
      toast.error(err.message ?? "Impossible de supprimer le message.");
    } finally {
      setBusy(p => ({ ...p, [`del_${msgId}`]: false }));
    }
  };

  // ── Après création d'un thread ────────────────────────────────────────────
  const handleThreadCreated = (newThread) => {
    setThreads(prev => [newThread, ...prev]);
    setActiveId(newThread.id);
    setShowNew(false);
    toast.success("Discussion créée avec succès.");
  };

  // ── Threads filtrés par recherche ─────────────────────────────────────────
  const filteredThreads = threads.filter(t =>
    !search || t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const isClosed = activeThread?.status === "CLOSED";
  const isResolved = activeThread?.status === "RESOLVED";

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Assistance</div>
          <h1 className="page-title">Centre d'<em>aide</em></h1>
          <p className="page-subtitle">Notre équipe vous répond généralement en moins de 24h.</p>
        </div>
        <button className="btn btn-accent btn-lg" onClick={() => setShowNew(true)}>
          <Icon name="plus" size={15} /> Nouvelle discussion
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, height: "calc(100vh - 220px)" }}>
        {/* ── Liste threads ── */}
        <div className="card fade-up" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: 16, borderBottom: "1px solid var(--border-soft)" }}>
            <div className="search-box">
              <Icon name="search" size={14} />
              <input
                className="input"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingThreads ? (
              <ThreadSkeleton />
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {search ? "Aucune discussion trouvée." : "Aucune discussion pour l'instant."}
                </div>
                {!search && (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowNew(true)}>
                    Ouvrir une discussion
                  </button>
                )}
              </div>
            ) : (
              filteredThreads.map((t, i) => {
                const lastMsg = t.messages?.[0];
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: 16,
                      background: activeId === t.id ? "var(--terracotta-bg)" : "transparent",
                      borderBottom: "1px solid var(--border-soft)",
                      borderLeft: activeId === t.id ? "3px solid var(--terracotta)" : "3px solid transparent",
                      transition: "all 0.12s",
                      animation: `fadeUp 0.3s ${i * 0.05}s var(--ease) both`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div className="display" style={{
                        fontSize: 14,
                        color: activeId === t.id ? "var(--terracotta-deep)" : "var(--ink)",
                        fontWeight: 500, lineHeight: 1.3,
                        flex: 1, marginRight: 8,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {t.subject}
                      </div>
                      <SupportStatusBadge status={t.status} />
                    </div>
                    {lastMsg && (
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lastMsg.content}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
                      <span>{t._count?.messages ?? 0} message{(t._count?.messages ?? 0) > 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Conversation ── */}
        {activeId ? (
          <div className="card fade-up" data-stagger="1" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                <div className="display" style={{ fontSize: 18, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeThread?.subject ?? "Chargement…"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Ouverte {formatDate(activeThread?.createdAt)} · {messages.length} message{messages.length > 1 ? "s" : ""}
                </div>
              </div>
              {activeThread && <SupportStatusBadge status={activeThread.status} />}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {loadingMessages ? (
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                  <Spinner size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                  <EmptyState icon="support" title="Aucun message" description="Soyez le premier à écrire." />
                </div>
              ) : (
                messages.map((m, i) => {
                  if (m.senderType === "BOT") {
                    return (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", animation: `fadeUp 0.3s ${Math.min(i, 10) * 0.04}s var(--ease) both` }}>
                        <div style={{ height: 1, flex: 1, maxWidth: 60, background: "var(--border-soft)" }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 10px", background: "var(--bg-soft)", borderRadius: 999 }}>
                          <Icon name="info" size={10} /> {m.content}
                        </span>
                        <div style={{ height: 1, flex: 1, maxWidth: 60, background: "var(--border-soft)" }} />
                      </div>
                    );
                  }

                  const isUser = m.senderType === "USER";
                  const isOwn  = isUser && m.senderId === user?.id;
                  const name   = isUser ? (user?.fullName || "Vous") : "Agent Support";

                  return (
                    <div
                      key={m.id}
                      style={{ display: "flex", gap: 12, flexDirection: isUser ? "row-reverse" : "row", animation: `fadeUp 0.3s ${Math.min(i, 10) * 0.04}s var(--ease) both` }}
                    >
                      <Avatar name={name} size="sm" color={isUser ? "var(--terracotta-bg)" : "var(--moss-bg)"} />
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textAlign: isUser ? "right" : "left" }}>
                          {isUser ? "Vous" : "Agent Support"} · {formatTime(m.createdAt)}
                        </div>
                        <div style={{
                          padding: "10px 14px",
                          background: isUser ? "var(--ink)" : "var(--bg-soft)",
                          color: isUser ? "var(--bg-paper)" : "var(--ink)",
                          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          fontSize: 13.5, lineHeight: 1.5,
                          position: "relative",
                        }}>
                          {m.content}
                        </div>
                        {isOwn && !m.id.startsWith("tmp_") && (
                          <div style={{ textAlign: "right", marginTop: 4 }}>
                            <button
                              onClick={() => handleDeleteMessage(m.id)}
                              disabled={busy[`del_${m.id}`]}
                              style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
                            >
                              {busy[`del_${m.id}`] ? <Spinner size={10} /> : "Supprimer"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie ou bannière fermé */}
            {!isClosed && !isResolved ? (
              <div style={{ padding: 16, borderTop: "1px solid var(--border-soft)", display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="textarea"
                  placeholder="Écrivez votre message… (Ctrl+Entrée pour envoyer)"
                  style={{ flex: 1, minHeight: 50, maxHeight: 120 }}
                  disabled={busy.send}
                />
                <button
                  className="btn btn-primary"
                  disabled={!message.trim() || busy.send}
                  onClick={handleSend}
                  style={{ flexShrink: 0 }}
                >
                  {busy.send ? <Spinner size={14} /> : <Icon name="send" size={14} />}
                </button>
              </div>
            ) : (
              <div style={{ padding: 16, borderTop: "1px solid var(--border-soft)", textAlign: "center", background: "var(--bg-soft)" }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                  {isResolved
                    ? "Cette discussion est marquée comme résolue."
                    : "Cette discussion est fermée. Vous ne pouvez plus y répondre."}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(true)}>
                  Ouvrir une nouvelle discussion
                </button>
              </div>
            )}
          </div>
        ) : (
          !loadingThreads && (
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EmptyState icon="support" title="Sélectionnez une discussion" description="ou créez-en une nouvelle" />
            </div>
          )
        )}
      </div>

      <NewThreadModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={handleThreadCreated}
      />
    </div>
  );
}

// ─── Modal nouvelle discussion ─────────────────────────────────────────────
function NewThreadModal({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [form, setForm]   = useState({ subject: "", message: "" });
  const [busy, setBusy]   = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (form.subject.trim().length < 5)   e.subject = "Le sujet doit faire au moins 5 caractères.";
    if (form.message.trim().length < 10)  e.message = "Le message doit faire au moins 10 caractères.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setBusy(true);
    try {
      const res = await supportApi.createThread({ subject: form.subject.trim(), message: form.message.trim() });
      const thread = res.thread ?? res;
      onCreated(thread);
      setForm({ subject: "", message: "" });
      setErrors({});
    } catch (err) {
      toast.error(err.message ?? "Impossible de créer la discussion.");
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: null }));
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle discussion" subtitle="Notre équipe vous répondra dans les plus brefs délais">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field-group">
          <label className="field-label">Sujet *</label>
          <input
            className={`input${errors.subject ? " input-error" : ""}`}
            placeholder="Ex : Problème avec l'export PDF"
            value={form.subject}
            onChange={set("subject")}
            maxLength={200}
          />
          {errors.subject && <div style={{ fontSize: 12, color: "var(--terracotta)", marginTop: 4 }}>{errors.subject}</div>}
        </div>

        <div className="field-group">
          <label className="field-label">Description du problème *</label>
          <textarea
            className={`textarea${errors.message ? " input-error" : ""}`}
            placeholder="Décrivez le plus précisément possible…"
            rows={5}
            style={{ minHeight: 120 }}
            value={form.message}
            onChange={set("message")}
            maxLength={5000}
          />
          {errors.message && <div style={{ fontSize: 12, color: "var(--terracotta)", marginTop: 4 }}>{errors.message}</div>}
          <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 4 }}>
            {form.message.length}/5000
          </div>
        </div>

        <div style={{ padding: 12, background: "var(--ochre-bg)", borderRadius: "var(--r-md)", fontSize: 12, color: "var(--ochre)", display: "flex", gap: 8 }}>
          <Icon name="info" size={14} />
          <span>Pour les questions urgentes, indiquez "URGENT" dans le sujet.</span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={busy}>
            {busy ? <><Spinner size={13} /> Envoi…</> : <><Icon name="send" size={13} /> Envoyer la demande</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
