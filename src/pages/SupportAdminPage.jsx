import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "../components/Icon";
import { Modal, Avatar, EmptyState, Spinner } from "../components/Shared";
import { useToast } from "../components/Toast";
import { supportAdminApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";

// ─── Config statuts ───────────────────────────────────────────────────────
const STATUS_CFG = {
  OPEN:        { label: "Ouvert",    color: "var(--indigo)",     bg: "var(--indigo-bg)" },
  IN_PROGRESS: { label: "En cours",  color: "var(--ochre)",      bg: "var(--ochre-bg)" },
  RESOLVED:    { label: "Résolu",    color: "var(--moss)",       bg: "var(--moss-bg)" },
  CLOSED:      { label: "Fermé",     color: "var(--text-muted)", bg: "var(--bg-soft)" },
};

// Transitions autorisées (miroir du backend)
const TRANSITIONS = {
  OPEN:        ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED:    ["OPEN", "CLOSED"],
  CLOSED:      ["OPEN"],
};

const STATUS_TABS = [
  { value: undefined,     label: "Tous" },
  { value: "OPEN",        label: "Ouverts" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "RESOLVED",    label: "Résolus" },
  { value: "CLOSED",      label: "Fermés" },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.OPEN;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
      color: cfg.color, background: cfg.bg, padding: "3px 8px", borderRadius: 999,
      whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Skeleton thread ──────────────────────────────────────────────────────
function ThreadSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ padding: 16, borderBottom: "1px solid var(--border-soft)" }}>
          <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 8, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 11, width: "85%", marginBottom: 6, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 10, width: "40%", borderRadius: 4 }} />
        </div>
      ))}
    </>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function SupportAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState(undefined);
  const [threads, setThreads]           = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeId, setActiveId]         = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply]               = useState("");
  const [busy, setBusy]                 = useState({});
  const [showStatus, setShowStatus]     = useState(false);
  const [search, setSearch]             = useState("");

  const messagesEndRef = useRef(null);

  // ── Charger tous les threads ─────────────────────────────────────────────
  const fetchThreads = useCallback(async (filter) => {
    setLoadingThreads(true);
    try {
      const res  = await supportAdminApi.listThreads(1, 50, filter);
      const data = res.data ?? [];
      setThreads(data);
      if (data.length > 0 && !activeId) setActiveId(data[0].id);
    } catch {
      toast.error("Impossible de charger les discussions.");
    } finally {
      setLoadingThreads(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchThreads(statusFilter); }, [statusFilter]); // eslint-disable-line

  // ── Charger le thread actif ──────────────────────────────────────────────
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      setLoadingMessages(true);
      setMessages([]);
      setActiveThread(null);
      try {
        const res = await supportAdminApi.getThread(activeId);
        const thread = res.thread ?? res;
        setActiveThread(thread);
        setMessages(thread.messages ?? []);
      } catch {
        toast.error("Impossible de charger la discussion.");
      } finally {
        setLoadingMessages(false);
      }
    })();
  }, [activeId]); // eslint-disable-line

  // ── Scroll auto ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Envoyer une réponse agent ────────────────────────────────────────────
  const handleReply = async () => {
    const content = reply.trim();
    if (!content || busy.reply) return;

    setBusy(p => ({ ...p, reply: true }));
    const optimistic = {
      id: `tmp_${Date.now()}`,
      content,
      senderType: "AGENT",
      senderId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setReply("");

    try {
      const res = await supportAdminApi.sendMessage(activeId, {
        content,
        senderType: "AGENT",
        senderId: user?.id,
      });
      setMessages(prev => prev.map(m => m.id === optimistic.id ? res.data : m));
      // Si thread était OPEN → IN_PROGRESS automatiquement côté backend
      if (activeThread?.status === "OPEN") {
        const updated = { ...activeThread, status: "IN_PROGRESS" };
        setActiveThread(updated);
        setThreads(prev => prev.map(t => t.id === activeId ? { ...t, status: "IN_PROGRESS" } : t));
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setReply(content);
      toast.error(err.message ?? "Impossible d'envoyer le message.");
    } finally {
      setBusy(p => ({ ...p, reply: false }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
  };

  // ── Après changement de statut ───────────────────────────────────────────
  const handleStatusChanged = ({ thread, botMessage }) => {
    setActiveThread(thread);
    setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, status: thread.status } : t));
    if (botMessage) setMessages(prev => [...prev, botMessage]);
    setShowStatus(false);
    toast.success(`Statut mis à jour : ${STATUS_CFG[thread.status]?.label}`);
  };

  const filteredThreads = threads.filter(t =>
    !search || t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Administration</div>
          <h1 className="page-title">Support <em>admin</em></h1>
          <p className="page-subtitle">Gérez et répondez aux discussions des utilisateurs.</p>
        </div>
        {/* Compteurs */}
        <div style={{ display: "flex", gap: 12 }}>
          {["OPEN", "IN_PROGRESS"].map(s => {
            const count = threads.filter(t => t.status === s).length;
            if (!count) return null;
            const cfg = STATUS_CFG[s];
            return (
              <div key={s} style={{ padding: "8px 14px", background: cfg.bg, borderRadius: "var(--r-md)", fontSize: 13, color: cfg.color, fontWeight: 600 }}>
                {count} {cfg.label}{count > 1 ? "s" : ""}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, height: "calc(100vh - 220px)" }}>
        {/* ── Panel gauche : liste ── */}
        <div className="card fade-up" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tabs statut */}
          <div style={{ display: "flex", gap: 2, padding: "10px 12px 0", borderBottom: "1px solid var(--border-soft)", overflowX: "auto" }}>
            {STATUS_TABS.map(tab => (
              <button
                key={String(tab.value)}
                onClick={() => { setStatusFilter(tab.value); setActiveId(null); }}
                style={{
                  padding: "6px 12px", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
                  border: "none", borderRadius: "var(--r-sm) var(--r-sm) 0 0", cursor: "pointer",
                  background: statusFilter === tab.value ? "var(--bg-paper)" : "transparent",
                  color: statusFilter === tab.value ? "var(--ink)" : "var(--text-muted)",
                  borderBottom: statusFilter === tab.value ? "2px solid var(--terracotta)" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
                {tab.value && (
                  <span style={{ marginLeft: 4, opacity: 0.7 }}>
                    ({threads.filter(t => t.status === tab.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-soft)" }}>
            <div className="search-box">
              <Icon name="search" size={14} />
              <input
                className="input"
                placeholder="Sujet, nom ou email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingThreads ? <ThreadSkeleton /> : filteredThreads.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                Aucune discussion trouvée.
              </div>
            ) : (
              filteredThreads.map((t, i) => {
                const lastMsg = t.messages?.[0];
                const isActive = activeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "14px 16px",
                      background: isActive ? "var(--terracotta-bg)" : "transparent",
                      borderBottom: "1px solid var(--border-soft)",
                      borderLeft: isActive ? "3px solid var(--terracotta)" : "3px solid transparent",
                      transition: "all 0.12s",
                      animation: `fadeUp 0.3s ${Math.min(i, 8) * 0.05}s var(--ease) both`,
                    }}
                  >
                    {/* User info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Avatar name={t.user?.fullName || t.user?.email || "?"} size="sm" color="var(--indigo-bg)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? "var(--terracotta-deep)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.user?.fullName || t.user?.email || "Utilisateur"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.user?.email}
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    {/* Sujet */}
                    <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.subject}
                    </div>
                    {/* Aperçu dernier message */}
                    {lastMsg && (
                      <div style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                        {lastMsg.content}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 6 }}>
                      <span>{t._count?.messages ?? 0} msg</span>
                      <span>·</span>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Panel droit : conversation ── */}
        {activeId ? (
          <div className="card fade-up" data-stagger="1" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: 14 }}>
              {activeThread?.user && (
                <Avatar name={activeThread.user.fullName || activeThread.user.email} size="md" color="var(--indigo-bg)" />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeThread?.subject ?? "Chargement…"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {activeThread?.user?.fullName && <span>{activeThread.user.fullName} · </span>}
                  {activeThread?.user?.email && <span>{activeThread.user.email} · </span>}
                  Ouverte {formatDate(activeThread?.createdAt)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {activeThread && <StatusBadge status={activeThread.status} />}
                {activeThread && TRANSITIONS[activeThread.status]?.length > 0 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowStatus(true)}
                  >
                    <Icon name="edit" size={13} /> Changer statut
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {loadingMessages ? (
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                  <Spinner size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                  <EmptyState icon="support" title="Aucun message" description="Cette discussion est vide." />
                </div>
              ) : (
                messages.map((m, i) => {
                  if (m.senderType === "BOT") {
                    return (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                        <div style={{ height: 1, flex: 1, maxWidth: 60, background: "var(--border-soft)" }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 10px", background: "var(--bg-soft)", borderRadius: 999 }}>
                          <Icon name="info" size={10} /> {m.content}
                        </span>
                        <div style={{ height: 1, flex: 1, maxWidth: 60, background: "var(--border-soft)" }} />
                      </div>
                    );
                  }

                  const isAgent = m.senderType === "AGENT";
                  const isUser  = m.senderType === "USER";

                  const name  = isAgent ? (user?.fullName || "Agent") : (activeThread?.user?.fullName || "Utilisateur");
                  const color = isAgent ? "var(--moss-bg)" : "var(--terracotta-bg)";

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex", gap: 12,
                        flexDirection: isAgent ? "row-reverse" : "row",
                        animation: `fadeUp 0.3s ${Math.min(i, 10) * 0.04}s var(--ease) both`,
                      }}
                    >
                      <Avatar name={name} size="sm" color={color} />
                      <div style={{ maxWidth: "68%" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textAlign: isAgent ? "right" : "left" }}>
                          {isAgent ? `Agent — ${user?.fullName || "Moi"}` : `Utilisateur — ${activeThread?.user?.fullName || ""}`}
                          {" · "}{formatTime(m.createdAt)}
                        </div>
                        <div style={{
                          padding: "10px 14px",
                          background: isAgent ? "var(--moss)" : "var(--bg-soft)",
                          color: isAgent ? "#fff" : "var(--ink)",
                          borderRadius: isAgent ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          fontSize: 13.5, lineHeight: 1.5,
                        }}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de réponse agent */}
            {activeThread?.status !== "CLOSED" ? (
              <div style={{ padding: 14, borderTop: "1px solid var(--border-soft)", display: "flex", gap: 10, alignItems: "flex-end", background: "var(--moss-bg)" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="textarea"
                    placeholder="Répondre en tant qu'agent… (Ctrl+Entrée pour envoyer)"
                    style={{ flex: 1, minHeight: 52, maxHeight: 140, width: "100%", boxSizing: "border-box" }}
                    disabled={busy.reply}
                  />
                  <div style={{ fontSize: 10, color: "var(--text-muted)", position: "absolute", bottom: 6, right: 10 }}>
                    Ctrl+Entrée
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  disabled={!reply.trim() || busy.reply}
                  onClick={handleReply}
                  style={{ background: "var(--moss)", color: "#fff", flexShrink: 0 }}
                >
                  {busy.reply ? <Spinner size={14} /> : <><Icon name="send" size={14} /> Répondre</>}
                </button>
              </div>
            ) : (
              <div style={{ padding: 14, borderTop: "1px solid var(--border-soft)", textAlign: "center", background: "var(--bg-soft)" }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Cette discussion est fermée.
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowStatus(true)}
                  disabled={busy.status}
                >
                  Rouvrir la discussion
                </button>
              </div>
            )}
          </div>
        ) : (
          !loadingThreads && (
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EmptyState icon="support" title="Sélectionnez une discussion" description="Choisissez une conversation dans la liste" />
            </div>
          )
        )}
      </div>

      {/* Modal changement de statut */}
      {showStatus && activeThread && (
        <StatusModal
          thread={activeThread}
          onClose={() => setShowStatus(false)}
          onChanged={handleStatusChanged}
        />
      )}
    </div>
  );
}

// ─── Modal changement de statut ────────────────────────────────────────────
function StatusModal({ thread, onClose, onChanged }) {
  const { toast } = useToast();
  const allowed = TRANSITIONS[thread.status] ?? [];

  const [targetStatus, setTargetStatus] = useState(allowed[0] ?? "");
  const [note, setNote]   = useState("");
  const [busy, setBusy]   = useState(false);

  const handleSubmit = async () => {
    if (!targetStatus || busy) return;
    setBusy(true);
    try {
      const res = await supportAdminApi.updateStatus(thread.id, {
        status: targetStatus,
        ...(note.trim() ? { note: note.trim() } : {}),
      });

      // Le backend peut renvoyer le thread mis à jour + un msg BOT auto-créé
      const updatedThread = res.thread ?? { ...thread, status: targetStatus };
      const botMessage = note.trim()
        ? {
            id: `bot_${Date.now()}`,
            senderType: "BOT",
            senderId: null,
            content: `[Statut → ${targetStatus}] ${note.trim()}`,
            createdAt: new Date().toISOString(),
          }
        : null;

      onChanged({ thread: updatedThread, botMessage });
    } catch (err) {
      toast.error(err.message ?? "Impossible de changer le statut.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Changer le statut" subtitle={`Discussion : ${thread.subject}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Statut actuel */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--bg-soft)", borderRadius: "var(--r-md)", fontSize: 13 }}>
          <span style={{ color: "var(--text-secondary)" }}>Statut actuel :</span>
          <StatusBadge status={thread.status} />
          <Icon name="chevron-r" size={12} color="var(--border-medium)" />
          <StatusBadge status={targetStatus} />
        </div>

        {/* Choix du nouveau statut */}
        <div className="field-group">
          <label className="field-label">Nouveau statut</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {allowed.map(s => {
              const cfg = STATUS_CFG[s];
              const active = targetStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setTargetStatus(s)}
                  style={{
                    padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: "var(--r-md)",
                    border: `2px solid ${active ? cfg.color : "var(--border-soft)"}`,
                    background: active ? cfg.bg : "transparent",
                    color: active ? cfg.color : "var(--text-secondary)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note interne (optionnelle) */}
        <div className="field-group">
          <label className="field-label">Note interne <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optionnelle)</span></label>
          <textarea
            className="textarea"
            placeholder="Ex : Problème résolu côté infrastructure, aucune action requise."
            rows={3}
            style={{ minHeight: 80 }}
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={500}
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 4 }}>
            {note.length}/500 — Un message système sera ajouté si une note est saisie.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={busy || !targetStatus}>
            {busy ? <><Spinner size={13} /> Enregistrement…</> : "Confirmer le changement"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
