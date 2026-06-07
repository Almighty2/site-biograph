import { useState, useEffect, useRef } from "react";
import { Icon } from "../components/Icon";
import { Modal, Spinner, StatusBadge, EmptyState } from "../components/Shared";
import { useToast } from "../components/Toast";
import { mediaApi, bookApi, buildMediaFileUrl } from "../utils/api";
import { MEDIA_PROJECTS as MOCK_MEDIA, BOOKS as MOCK_BOOKS } from "../utils/mockData";

const VOICE_LABELS = { FEMALE: "féminine", MALE: "masculine", NEUTRAL: "neutre" };
const LANG_LABELS  = { fr: "Français", en: "English" };

const formatDuration = (sec) => {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const formatBytes = (b) => {
  if (!b) return null;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} Ko`;
  return `${(b / 1024 / 1024).toFixed(1)} Mo`;
};

// ─── MediaPage ────────────────────────────────────────────────────────────

export default function MediaPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [playProject, setPlayProject] = useState(null);
  const [busy, setBusy] = useState({}); // { [projectId]: 'delete' | 'regen' }
  const [demoMode, setDemoMode] = useState(false);
  const pollRef = useRef(null);
  const toastedDemo = useRef(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await mediaApi.listForUser();
      const list = Array.isArray(res) ? res : (res.data || []);
      setProjects(list);
      setDemoMode(false);
    } catch (e) {
      if (!silent) {
        setProjects(MOCK_MEDIA);
        setDemoMode(true);
        if (!toastedDemo.current) {
          toast.info("Mode démo — projets multimédia d'exemple affichés.");
          toastedDemo.current = true;
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Polling : tant qu'un projet est PENDING ou PROCESSING, on rafraîchit toutes les 5s
  useEffect(() => {
    const hasPending = projects.some(p => p.status === "PENDING" || p.status === "PROCESSING");
    if (demoMode || !hasPending) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    if (!pollRef.current) {
      pollRef.current = setInterval(() => load(true), 5000);
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [projects, demoMode]); // eslint-disable-line

  const filtered = projects.filter(p => filter === "ALL" || p.type === filter);
  const counts = {
    ALL:              projects.length,
    AUDIO_NARRATION:  projects.filter(p => p.type === "AUDIO_NARRATION").length,
    VIDEO_STORY:      projects.filter(p => p.type === "VIDEO_STORY").length,
  };

  const handleCreated = (project) => {
    setProjects(prev => [project, ...prev]);
    setShowCreate(false);
    toast.success("Projet créé — la génération est lancée.");
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Supprimer le projet "${project.title}" ?`)) return;
    setBusy(b => ({ ...b, [project.id]: "delete" }));
    try {
      await mediaApi.remove(project.id);
      setProjects(prev => prev.filter(p => p.id !== project.id));
      toast.success("Projet supprimé.");
    } catch (e) {
      toast.error(e.message || "Suppression impossible.");
    } finally {
      setBusy(b => { const n = { ...b }; delete n[project.id]; return n; });
    }
  };

  const handleRegenerate = async (project) => {
    setBusy(b => ({ ...b, [project.id]: "regen" }));
    try {
      const res = await mediaApi.regenerate(project.id);
      const updated = res.project || { ...project, status: "PENDING", error: null, fileUrl: null };
      setProjects(prev => prev.map(p => p.id === project.id ? updated : p));
      toast.success("Génération relancée.");
    } catch (e) {
      toast.error(e.message || "Relance impossible.");
    } finally {
      setBusy(b => { const n = { ...b }; delete n[project.id]; return n; });
    }
  };

  const handleDownload = (project) => {
    const url = buildMediaFileUrl(project.fileUrl);
    if (!url) { toast.error("Fichier indisponible."); return; }
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "media"}.${project.type === "VIDEO_STORY" ? "mp4" : "mp3"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = async (project) => {
    const url = buildMediaFileUrl(project.fileUrl);
    if (!url) { toast.error("Fichier indisponible."); return; }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers.");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Multimédia</div>
          <h1 className="page-title">Audio & <em>vidéo</em></h1>
          <p className="page-subtitle">
            {projects.length} projet{projects.length !== 1 ? "s" : ""} · Donnez une voix à vos manuscrits avec l'IA.
          </p>
        </div>
        <button className="btn btn-accent btn-lg" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={15} /> Nouveau projet
        </button>
      </div>

      {/* Cartes de présentation */}
      <div className="grid-3 fade-up" data-stagger="1" style={{ marginBottom: 28 }}>
        <FeatureCard icon="mic"   title="Narration audio" desc="Transformez votre livre en livre audio avec voix IA naturelles."   color="terracotta" />
        <FeatureCard icon="video" title="Vidéo histoire"  desc="Créez de courtes vidéos illustrées à partir de vos chapitres."     color="indigo" />
        <FeatureCard icon="music" title="Musique de fond" desc="Ajoutez une ambiance sonore qui raconte votre histoire."           color="moss" />
      </div>

      {/* Filtres */}
      <div className="fade-up" data-stagger="2"
        style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-soft)", borderRadius: "var(--r-md)", marginBottom: 20, width: "fit-content" }}>
        {[
          ["ALL", "Tous"],
          ["AUDIO_NARRATION", "Audio"],
          ["VIDEO_STORY", "Vidéo"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{
              padding: "6px 14px", fontSize: 12.5, fontWeight: 500, borderRadius: "var(--r-sm)",
              background: filter === k ? "var(--bg-paper)" : "transparent",
              color: filter === k ? "var(--ink)" : "var(--text-secondary)",
              boxShadow: filter === k ? "var(--shadow-sm)" : "none", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            {l}
            <span style={{ fontSize: 11, opacity: 0.6 }}>{counts[k] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spinner size={20} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="mic"
          title={filter === "ALL" ? "Aucun projet pour le moment" : "Aucun projet dans cette catégorie"}
          description="Créez votre premier projet audio ou vidéo à partir d'un de vos livres."
          action={
            <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={14} /> Nouveau projet
            </button>
          }
        />
      ) : (
        <div className="grid-2">
          {filtered.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              busy={busy[p.id]}
              onPlay={() => setPlayProject(p)}
              onDownload={() => handleDownload(p)}
              onShare={() => handleShare(p)}
              onDelete={() => handleDelete(p)}
              onRegenerate={() => handleRegenerate(p)}
            />
          ))}
        </div>
      )}

      <CreateMediaModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />

      {playProject && (
        <PlayerModal
          project={playProject}
          onClose={() => setPlayProject(null)}
          onDownload={() => handleDownload(playProject)}
        />
      )}
    </div>
  );
}

// ─── Carte projet ─────────────────────────────────────────────────────────

function ProjectCard({ project: p, index, busy, onPlay, onDownload, onShare, onDelete, onRegenerate }) {
  const isAudio = p.type === "AUDIO_NARRATION";
  const bookTitle = p.bookTitle || p.book?.title || "—";

  return (
    <div className="card card-padded fade-up" data-stagger={Math.min(index + 1, 6)}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "var(--r-md)",
          background: isAudio ? "var(--terracotta-bg)" : "var(--indigo-bg)",
          color:      isAudio ? "var(--terracotta)"    : "var(--indigo)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name={isAudio ? "mic" : "video"} size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--ink)" }}>{p.title}</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{bookTitle}</p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div style={{
        display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)",
        marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-soft)",
        flexWrap: "wrap",
      }}>
        <span>Voix {VOICE_LABELS[p.voiceGender] || "féminine"}</span>
        <span>·</span>
        <span>{LANG_LABELS[p.language] || (p.language || "—")}</span>
        {p.durationSec ? <><span>·</span><span>{formatDuration(p.durationSec)}</span></> : null}
        {formatBytes(p.fileSize) ? <><span>·</span><span>{formatBytes(p.fileSize)}</span></> : null}
      </div>

      {p.status === "DONE" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={onPlay} disabled={!p.fileUrl}>
            <Icon name="play" size={13} /> Écouter
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onDownload} disabled={!p.fileUrl} title="Télécharger">
            <Icon name="download" size={13} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onShare} disabled={!p.fileUrl} title="Copier le lien">
            <Icon name="share" size={13} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete} disabled={busy === "delete"} title="Supprimer">
            {busy === "delete" ? <Spinner size={13} /> : <Icon name="trash" size={13} />}
          </button>
        </div>
      )}

      {(p.status === "PROCESSING" || p.status === "PENDING") && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", background: "var(--ochre-bg)", borderRadius: "var(--r-sm)",
        }}>
          <Spinner size={14} color="var(--ochre)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>
              {p.status === "PROCESSING" ? "Génération en cours…" : "En attente de traitement…"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              Cela peut prendre quelques minutes — le statut se rafraîchit automatiquement.
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onDelete} disabled={p.status === "PROCESSING" || busy === "delete"}
            title={p.status === "PROCESSING" ? "Suppression impossible pendant la génération" : "Annuler"}>
            <Icon name="x" size={13} />
          </button>
        </div>
      )}

      {p.status === "FAILED" && (
        <div>
          <div style={{
            padding: "10px 12px", background: "var(--terracotta-bg)", borderRadius: "var(--r-sm)",
            marginBottom: 8, fontSize: 12.5, color: "var(--terracotta-deep, var(--terracotta))",
          }}>
            <div style={{ fontWeight: 500, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="alert" size={12} /> Échec de la génération
            </div>
            {p.error && (
              <div style={{ fontSize: 11.5, opacity: 0.9 }}>
                {String(p.error).slice(0, 200)}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-accent btn-sm" style={{ flex: 1 }} onClick={onRegenerate} disabled={busy === "regen"}>
              {busy === "regen" ? <><Spinner size={13} /> Relance…</> : <><Icon name="sparkle" size={13} /> Réessayer</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onDelete} disabled={busy === "delete"} title="Supprimer">
              {busy === "delete" ? <Spinner size={13} /> : <Icon name="trash" size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Carte de présentation ────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, color }) {
  const bgs    = { terracotta: "var(--terracotta-bg)", indigo: "var(--indigo-bg)", moss: "var(--moss-bg)" };
  const colors = { terracotta: "var(--terracotta)",    indigo: "var(--indigo)",    moss: "var(--moss)" };
  return (
    <div className="card card-padded" style={{
      background: `linear-gradient(135deg, ${bgs[color]} 0%, var(--bg-paper) 100%)`,
      borderColor: bgs[color],
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "var(--r-md)",
        background: colors[color], color: "white",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
      }}>
        <Icon name={icon} size={20} />
      </div>
      <h3 className="display" style={{ fontSize: 16, color: "var(--ink)" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}

// ─── Modale Création ──────────────────────────────────────────────────────

function CreateMediaModal({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [type, setType]               = useState("AUDIO_NARRATION");
  const [title, setTitle]             = useState("");
  const [bookId, setBookId]           = useState("");
  const [voiceGender, setVoiceGender] = useState("FEMALE");
  const [language, setLanguage]       = useState("fr");
  const [musicTrack, setMusicTrack]   = useState("");
  const [books, setBooks]             = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingBooks(true);
    bookApi.list()
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data || res.books || []);
        setBooks(list);
        setBookId(prev => prev || list[0]?.id || "");
      })
      .catch(() => {
        setBooks(MOCK_BOOKS);
        setBookId(prev => prev || MOCK_BOOKS[0]?.id || "");
      })
      .finally(() => setLoadingBooks(false));
  }, [open]);

  const reset = () => {
    setType("AUDIO_NARRATION");
    setTitle("");
    setVoiceGender("FEMALE");
    setLanguage("fr");
    setMusicTrack("");
  };

  const handleClose = () => { if (!submitting) { reset(); onClose(); } };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim()) { toast.error("Donnez un titre à votre projet."); return; }
    if (!bookId)       { toast.error("Sélectionnez un livre source.");  return; }

    setSubmitting(true);
    try {
      const dto = {
        type,
        title: title.trim(),
        language,
        voiceGender,
        ...(musicTrack ? { musicTrack } : {}),
      };
      const res = await mediaApi.create(bookId, dto);
      const created = res.project || res;
      // injecter le titre du livre sélectionné pour l'affichage immédiat
      const book = books.find(b => b.id === bookId);
      onCreated({ ...created, bookTitle: book?.title, book: book ? { id: book.id, title: book.title } : created.book });
      reset();
    } catch (err) {
      toast.error(err.message || "Création impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Nouveau projet multimédia" subtitle="Choisissez le type de contenu à générer">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field-group">
          <label className="field-label">Type de projet</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["AUDIO_NARRATION", "mic", "Narration audio"], ["VIDEO_STORY", "video", "Vidéo histoire"]].map(([k, ic, l]) => (
              <button key={k} type="button" onClick={() => setType(k)}
                style={{
                  padding: 16, textAlign: "center",
                  border: `2px solid ${type === k ? "var(--terracotta)" : "var(--border-soft)"}`,
                  borderRadius: "var(--r-md)",
                  background: type === k ? "var(--terracotta-bg)" : "var(--bg-paper)",
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                <Icon name={ic} size={26} color={type === k ? "var(--terracotta)" : "var(--text-secondary)"} />
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8, color: "var(--ink)" }}>{l}</div>
              </button>
            ))}
          </div>
          {type === "VIDEO_STORY" && (
            <div style={{ fontSize: 12, color: "#8A6020", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="info" size={11} />
              La génération vidéo est encore en bêta côté serveur — elle peut échouer.
            </div>
          )}
        </div>

        <div className="field-group">
          <label className="field-label">Titre du projet</label>
          <input
            className="input"
            placeholder="Ex: Narration des 5 premiers chapitres"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            disabled={submitting}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Livre source</label>
          <select
            className="select"
            value={bookId}
            onChange={e => setBookId(e.target.value)}
            disabled={loadingBooks || submitting}
          >
            {loadingBooks && <option>Chargement…</option>}
            {!loadingBooks && books.length === 0 && <option value="">Aucun livre disponible</option>}
            {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field-group">
            <label className="field-label">Voix</label>
            <select className="select" value={voiceGender} onChange={e => setVoiceGender(e.target.value)} disabled={submitting}>
              <option value="FEMALE">Féminine — Aïssatou</option>
              <option value="MALE">Masculine — Kwame</option>
              <option value="NEUTRAL">Neutre — Modu</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Langue</label>
            <select className="select" value={language} onChange={e => setLanguage(e.target.value)} disabled={submitting}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Musique de fond</label>
          <select className="select" value={musicTrack} onChange={e => setMusicTrack(e.target.value)} disabled={submitting}>
            <option value="">Sans musique</option>
            <option value="afrobeat-soft">Afrobeat doux</option>
            <option value="nature-ambient">Ambiance nature (oiseaux, vent)</option>
            <option value="acoustic-piano">Piano acoustique</option>
            <option value="kora-traditional">Kora traditionnelle</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={submitting}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !title.trim() || !bookId}>
            {submitting
              ? <><Spinner size={13} /> Création…</>
              : <><Icon name="sparkle" size={14} /> Lancer la génération</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modale Lecteur ───────────────────────────────────────────────────────

function PlayerModal({ project, onClose, onDownload }) {
  const url = buildMediaFileUrl(project.fileUrl);
  const isVideo = project.type === "VIDEO_STORY";
  const subtitle = project.book?.title || project.bookTitle || "";

  return (
    <Modal open={true} onClose={onClose} title={project.title} subtitle={subtitle} size="md">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!url ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: 13.5 }}>
            <Icon name="alert" size={20} /> <div style={{ marginTop: 8 }}>Fichier indisponible.</div>
          </div>
        ) : isVideo ? (
          <video
            src={url}
            controls
            autoPlay
            style={{ width: "100%", borderRadius: "var(--r-md)", background: "#000", maxHeight: 420 }}
          />
        ) : (
          <div style={{
            padding: 24, background: "var(--terracotta-bg)", borderRadius: "var(--r-md)",
            display: "flex", flexDirection: "column", gap: 12, alignItems: "center",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--terracotta)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="mic" size={28} />
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
              Voix {VOICE_LABELS[project.voiceGender] || "féminine"} ·{" "}
              {LANG_LABELS[project.language] || project.language || "—"}
              {project.durationSec ? ` · ${formatDuration(project.durationSec)}` : ""}
            </div>
            <audio src={url} controls autoPlay style={{ width: "100%" }} />
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
          {url && (
            <button className="btn btn-primary btn-block" onClick={onDownload}>
              <Icon name="download" size={14} /> Télécharger
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
