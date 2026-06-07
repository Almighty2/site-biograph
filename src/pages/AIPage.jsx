import { useState, useEffect } from "react";
import { Icon } from "../components/Icon";
import { BookCover } from "../components/BookCover";
import { Spinner } from "../components/Shared";
import { aiApi, bookApi } from "../utils/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  CORRECTION: "Correction",
  NARRATIVE_ADVICE: "Conseil narratif",
  SENTENCE_SUGGESTION: "Suggestion de phrase",
  CHAPTER_DRAFT: "Brouillon de chapitre",
  BOOK_PLAN: "Plan de livre",
  COVER_PROMPT: "Couverture",
};
const TYPE_COLORS = {
  CORRECTION: "indigo",
  NARRATIVE_ADVICE: "ochre",
  SENTENCE_SUGGESTION: "neutral",
  CHAPTER_DRAFT: "moss",
  BOOK_PLAN: "moss",
  COVER_PROMPT: "terracotta",
};
const COVER_STYLES = ["vintage", "moderne", "minimaliste", "aquarelle", "africain", "illustré"];

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AIPage({ navigate }) {
  const [tab, setTab] = useState("suggestions");

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Intelligence artificielle</div>
          <h1 className="page-title">Assistant <em>Biograf</em></h1>
          <p className="page-subtitle">Suggestions narratives, génération de texte, couvertures sur mesure.</p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", background: "var(--ochre-bg)",
          borderRadius: "var(--r-md)", color: "var(--ochre)", fontSize: 12.5, fontWeight: 500,
        }}>
          <Icon name="sparkle" size={14} /> Assistant IA
        </div>
      </div>

      <div className="tabs fade-up" data-stagger="1">
        {[
          ["suggestions", "Mes suggestions"],
          ["generate", "Générer"],
          ["covers", "Couvertures IA"],
        ].map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {tab === "suggestions" && <SuggestionsTab navigate={navigate} />}
      {tab === "generate" && <GenerateTab />}
      {tab === "covers" && <CoversTab />}
    </div>
  );
}

// ─── Onglet Suggestions ───────────────────────────────────────────────────────

function SuggestionsTab({ navigate }) {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    bookApi.list()
      .then(res => {
        const list = res.data ?? res ?? [];
        setBooks(list);
        if (list.length > 0) setSelectedBookId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setBooksLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBookId) return;
    setLoading(true);
    setError("");
    aiApi.listForBook(selectedBookId)
      .then(res => setSuggestions(res.data ?? []))
      .catch(() => setError("Impossible de charger les suggestions."))
      .finally(() => setLoading(false));
  }, [selectedBookId]);

  const filtered = suggestions.filter(s =>
    filter === "ALL" ||
    (filter === "PENDING" && s.isAccepted === null) ||
    (filter === "ACCEPTED" && s.isAccepted === true) ||
    (filter === "REJECTED" && s.isAccepted === false)
  );

  const setAction = (id, val) => setActionLoading(a => ({ ...a, [id]: val }));

  const handleAccept = async (id) => {
    setAction(id, "accept");
    try {
      await aiApi.acceptOrReject(id, { isAccepted: true });
      setSuggestions(s => s.map(x => x.id === id ? { ...x, isAccepted: true } : x));
    } catch { /* ignore */ }
    setAction(id, null);
  };

  const handleReject = async (id) => {
    setAction(id, "reject");
    try {
      await aiApi.acceptOrReject(id, { isAccepted: false });
      setSuggestions(s => s.map(x => x.id === id ? { ...x, isAccepted: false } : x));
    } catch { /* ignore */ }
    setAction(id, null);
  };

  const handleDelete = async (id) => {
    const prev = suggestions;
    setSuggestions(s => s.filter(x => x.id !== id));
    try {
      await aiApi.delete(id);
    } catch {
      setSuggestions(prev);
    }
  };

  return (
    <div className="fade-up">
      {/* Book selector */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <div className="field-group" style={{ margin: 0, minWidth: 260 }}>
          {booksLoading ? (
            <div className="skeleton" style={{ height: 40, borderRadius: "var(--r-md)" }} />
          ) : (
            <select className="select" value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)}>
              {books.length === 0 && <option value="">Aucun livre</option>}
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-soft)", borderRadius: "var(--r-md)", width: "fit-content" }}>
          {[["ALL", "Toutes"], ["PENDING", "En attente"], ["ACCEPTED", "Acceptées"], ["REJECTED", "Refusées"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{
                padding: "6px 12px", fontSize: 12.5, fontWeight: 500, borderRadius: "var(--r-sm)",
                background: filter === k ? "var(--bg-paper)" : "transparent",
                color: filter === k ? "var(--ink)" : "var(--text-secondary)",
                boxShadow: filter === k ? "var(--shadow-sm)" : "none", transition: "all 0.15s",
              }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="card card-padded" style={{ borderColor: "var(--terracotta)", color: "var(--terracotta)", textAlign: "center" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card card-padded">
              <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "var(--r-md)", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="skeleton" style={{ height: 14, width: "30%" }} />
                  <div className="skeleton" style={{ height: 12, width: "60%" }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 80, borderRadius: "var(--r-md)", marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <div className="skeleton" style={{ height: 32, width: 90, borderRadius: "var(--r-md)" }} />
                <div className="skeleton" style={{ height: 32, width: 80, borderRadius: "var(--r-md)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon"><Icon name="sparkle" size={24} /></div>
          <div className="display" style={{ fontSize: 17 }}>Aucune suggestion</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {suggestions.length === 0
              ? "Générez votre première suggestion IA depuis l'onglet « Générer »."
              : "Aucune suggestion ne correspond à ce filtre."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((s, i) => {
            const busy = actionLoading[s.id];
            return (
              <div key={s.id} className="card card-padded fade-up" data-stagger={Math.min(i + 1, 6)}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "var(--r-md)",
                    background: "var(--ochre-bg)", color: "var(--ochre)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon name="sparkle" size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                      <span className={`badge badge-${TYPE_COLORS[s.type] ?? "neutral"}`}>
                        {TYPE_LABELS[s.type] ?? s.type}
                      </span>
                      {s.chapterId && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          · Chapitre lié
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                      {s.prompt}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(s.createdAt)}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "2px 6px", color: "var(--text-faint)" }}
                      onClick={() => handleDelete(s.id)}
                      title="Supprimer"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>

                <div style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, var(--ochre-bg) 0%, var(--bg-paper) 100%)",
                  borderRadius: "var(--r-md)", borderLeft: "3px solid var(--ochre)", marginBottom: 14,
                }}>
                  <p className="display-italic" style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.65 }}>
                    « {s.response} »
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {s.isAccepted === true ? (
                    <span className="badge badge-moss"><Icon name="check" size={11} /> Acceptée</span>
                  ) : s.isAccepted === false ? (
                    <span className="badge badge-neutral">Refusée</span>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAccept(s.id)}
                        disabled={!!busy}
                      >
                        {busy === "accept" ? <Spinner size={12} /> : <Icon name="check" size={13} />}
                        Accepter
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleReject(s.id)}
                        disabled={!!busy}
                      >
                        {busy === "reject" ? <Spinner size={12} /> : <Icon name="x" size={13} />}
                        Refuser
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: "auto" }}
                    onClick={() => navigate("editor")}
                  >
                    Voir dans l'éditeur <Icon name="arrow-r" size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Onglet Générer ───────────────────────────────────────────────────────────

function GenerateTab() {
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [bookId, setBookId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [type, setType] = useState("CHAPTER_DRAFT");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    bookApi.list()
      .then(res => {
        const list = res.data ?? res ?? [];
        setBooks(list);
        if (list.length > 0) setBookId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setBooksLoading(false));
  }, []);

  // Load chapters when book changes
  useEffect(() => {
    if (!bookId) return;
    setChapterId("");
    setChapters([]);
    bookApi.getById(bookId)
      .then(res => {
        setChapters((res.chapters ?? res.book?.chapters) ?? []);
      })
      .catch(() => {});
  }, [bookId]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setSaved(false);
    setError("");
    try {
      const payload = { type, prompt };
      if (bookId) payload.bookId = bookId;
      if (chapterId) payload.chapterId = chapterId;
      const res = await aiApi.create(payload);
      setResult(res.suggestion);
    } catch (e) {
      setError(e.message || "Erreur lors de la génération.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!result) return;
    try {
      await aiApi.acceptOrReject(result.id, { isAccepted: true });
      setSaved(true);
    } catch { /* ignore */ }
  };

  const handleReject = async () => {
    if (!result) return;
    try {
      await aiApi.acceptOrReject(result.id, { isAccepted: false });
      setResult(null);
    } catch { /* ignore */ }
  };

  return (
    <div className="fade-up grid-2-side" style={{ alignItems: "start" }}>
      {/* Panneau gauche — paramètres */}
      <div className="card card-padded">
        <h3 className="display" style={{ fontSize: 17, marginBottom: 4 }}>Que voulez-vous générer ?</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Précisez votre demande, l'IA s'occupe du reste.</p>

        <div className="field-group" style={{ marginBottom: 14 }}>
          <label className="field-label">Type de génération</label>
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            <option value="BOOK_PLAN">Plan complet du livre</option>
            <option value="CHAPTER_DRAFT">Brouillon de chapitre</option>
            <option value="SENTENCE_SUGGESTION">Suggestion de phrase</option>
            <option value="CORRECTION">Correction stylistique</option>
            <option value="NARRATIVE_ADVICE">Conseil narratif</option>
          </select>
        </div>

        <div className="field-group" style={{ marginBottom: 14 }}>
          <label className="field-label">Livre concerné</label>
          {booksLoading ? (
            <div className="skeleton" style={{ height: 40, borderRadius: "var(--r-md)" }} />
          ) : (
            <select className="select" value={bookId} onChange={e => setBookId(e.target.value)}>
              <option value="">— Aucun livre —</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          )}
        </div>

        {bookId && chapters.length > 0 && (
          <div className="field-group" style={{ marginBottom: 14 }}>
            <label className="field-label">Chapitre concerné <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span></label>
            <select className="select" value={chapterId} onChange={e => setChapterId(e.target.value)}>
              <option value="">— Aucun chapitre —</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}

        <div className="field-group" style={{ marginBottom: 18 }}>
          <label className="field-label">Votre instruction</label>
          <textarea
            className="textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ex : Rédige une introduction pour un chapitre sur l'enfance en milieu rural ivoirien, avec une atmosphère poétique..."
            style={{ minHeight: 140 }}
            maxLength={2000}
          />
          <div className="field-hint">{prompt.length} / 2 000 caractères</div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: "var(--terracotta)", marginBottom: 12 }}>{error}</div>
        )}

        <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading
            ? <><Spinner size={14} /> Génération en cours…</>
            : <><Icon name="sparkle" size={14} /> Générer avec l'IA</>
          }
        </button>
      </div>

      {/* Panneau droit — résultat */}
      <div className="card card-padded" style={{ minHeight: 400 }}>
        <h3 className="display" style={{ fontSize: 17, marginBottom: 16 }}>Aperçu</h3>

        {!result && !loading && (
          <div className="empty" style={{ padding: "40px 0" }}>
            <div className="empty-icon"><Icon name="feather" size={22} /></div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>La réponse de l'IA apparaîtra ici</div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[100, 92, 80, 95, 88, 75, 85].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 16, width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {result && !loading && (
          <div className="fade-up">
            <div style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, var(--ochre-bg) 0%, var(--bg-paper) 100%)",
              borderRadius: "var(--r-md)", borderLeft: "3px solid var(--ochre)",
              marginBottom: 16,
            }}>
              <p className="display-italic" style={{ fontSize: 15.5, color: "var(--ink-soft)", lineHeight: 1.75 }}>
                {result.response}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <span className={`badge badge-${TYPE_COLORS[result.type] ?? "neutral"}`}>
                {TYPE_LABELS[result.type] ?? result.type}
              </span>
              {result.isAccepted === true && (
                <span className="badge badge-moss"><Icon name="check" size={11} /> Sauvegardée</span>
              )}
            </div>

            {saved ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="badge badge-moss" style={{ fontSize: 13, padding: "6px 12px" }}>
                  <Icon name="check" size={13} /> Suggestion acceptée et sauvegardée
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => { setResult(null); setSaved(false); setPrompt(""); }}>
                  Nouvelle génération
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleAccept}>
                  <Icon name="check" size={13} /> Accepter &amp; sauvegarder
                </button>
                <button className="btn btn-secondary btn-sm" onClick={generate}>
                  <Icon name="sparkle" size={13} /> Régénérer
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleReject}>
                  <Icon name="x" size={13} /> Rejeter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onglet Couvertures IA ────────────────────────────────────────────────────

function CoversTab() {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [style, setStyle] = useState("africain");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [covers, setCovers] = useState([]);
  const [coversLoading, setCoversLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");
  const [genError, setGenError] = useState("");

  const selectedBook = books.find(b => b.id === bookId);

  useEffect(() => {
    bookApi.list()
      .then(res => {
        const list = res.data ?? res ?? [];
        setBooks(list);
        if (list.length > 0) setBookId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setBooksLoading(false));
  }, []);

  useEffect(() => {
    if (!bookId) return;
    setCoversLoading(true);
    setError("");
    aiApi.listCovers(bookId)
      .then(res => setCovers(res.data ?? []))
      .catch(() => setError("Impossible de charger les couvertures."))
      .finally(() => setCoversLoading(false));
  }, [bookId]);

  const handleGenerate = async () => {
    if (!bookId || !prompt.trim()) return;
    setGenerating(true);
    setGenError("");
    try {
      const res = await aiApi.generateCover(bookId, { prompt, style });
      setCovers(c => [res.cover, ...c]);
    } catch (e) {
      setGenError(e.message || "Erreur lors de la génération.");
    } finally {
      setGenerating(false);
    }
  };

  const setAction = (id, val) => setActionLoading(a => ({ ...a, [id]: val }));

  const handleSelect = async (coverId) => {
    setAction(coverId, "select");
    const prev = covers;
    setCovers(c => c.map(x => ({ ...x, isSelected: x.id === coverId })));
    try {
      await aiApi.selectCover(bookId, coverId);
    } catch {
      setCovers(prev);
    }
    setAction(coverId, null);
  };

  const handleDelete = async (coverId) => {
    const target = covers.find(c => c.id === coverId);
    if (target?.isSelected) return;
    const prev = covers;
    setCovers(c => c.filter(x => x.id !== coverId));
    try {
      await aiApi.deleteCover(bookId, coverId);
    } catch {
      setCovers(prev);
    }
  };

  return (
    <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24, alignItems: "start" }}>
      {/* Panneau gauche — paramètres */}
      <div className="card card-padded">
        <h3 className="display" style={{ fontSize: 17, marginBottom: 4 }}>Générer une couverture</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
          L'IA crée une couverture sur mesure selon votre description.
        </p>

        <div className="field-group" style={{ marginBottom: 14 }}>
          <label className="field-label">Livre</label>
          {booksLoading ? (
            <div className="skeleton" style={{ height: 40, borderRadius: "var(--r-md)" }} />
          ) : (
            <select className="select" value={bookId} onChange={e => setBookId(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          )}
        </div>

        <div className="field-group" style={{ marginBottom: 14 }}>
          <label className="field-label">Style visuel</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {COVER_STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                style={{
                  padding: "8px 10px", fontSize: 12, textTransform: "capitalize",
                  border: `1px solid ${style === s ? "var(--ink)" : "var(--border-soft)"}`,
                  borderRadius: "var(--r-sm)",
                  background: style === s ? "var(--ink)" : "var(--bg-paper)",
                  color: style === s ? "var(--bg-paper)" : "var(--text-secondary)",
                  transition: "all 0.15s", cursor: "pointer",
                }}>{s}</button>
            ))}
          </div>
        </div>

        <div className="field-group" style={{ marginBottom: 18 }}>
          <label className="field-label">Description de la couverture</label>
          <textarea
            className="textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Un baobab majestueux au coucher du soleil, avec des silhouettes de femmes portant des pagnes colorés..."
            style={{ minHeight: 120 }}
            maxLength={1000}
          />
          <div className="field-hint">{prompt.length} / 1 000 caractères</div>
        </div>

        {genError && (
          <div style={{ fontSize: 13, color: "var(--terracotta)", marginBottom: 12 }}>{genError}</div>
        )}

        <button
          className="btn btn-accent btn-block"
          onClick={handleGenerate}
          disabled={generating || !bookId || !prompt.trim()}
        >
          {generating
            ? <><Spinner size={14} /> Création en cours…</>
            : <><Icon name="sparkle" size={14} /> Générer la couverture</>
          }
        </button>
      </div>

      {/* Panneau droit — galerie */}
      <div className="card card-padded">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="display" style={{ fontSize: 17 }}>
            Couvertures générées
            {covers.length > 0 && (
              <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>
                ({covers.length})
              </span>
            )}
          </h3>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: "var(--terracotta)", marginBottom: 12 }}>{error}</div>
        )}

        {coversLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: "var(--r-md)" }} />
            ))}
          </div>
        ) : covers.length === 0 ? (
          <div className="empty" style={{ padding: "40px 0" }}>
            <div className="empty-icon"><Icon name="image" size={22} /></div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Aucune couverture générée pour ce livre.
            </div>
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
              Décrivez votre vision et laissez l'IA créer.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {covers.map((cov, i) => {
              const busy = actionLoading[cov.id];
              return (
                <div key={cov.id} style={{
                  padding: 12, borderRadius: "var(--r-md)",
                  border: `2px solid ${cov.isSelected ? "var(--terracotta)" : "var(--border-soft)"}`,
                  background: cov.isSelected ? "var(--terracotta-bg)" : "var(--bg-paper)",
                  transition: "all 0.15s",
                  animation: `fadeUp 0.4s ${0.05 + i * 0.06}s var(--ease) both`,
                }}>
                  {/* Image ou aperçu */}
                  <div style={{
                    width: "100%", aspectRatio: "2/3", borderRadius: "var(--r-sm)",
                    background: "var(--bg-soft)", marginBottom: 10,
                    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {cov.imageUrl ? (
                      <img
                        src={cov.imageUrl}
                        alt={`Couverture ${cov.style}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", padding: 16 }}>
                        <Icon name="image" size={28} style={{ color: "var(--text-faint)" }} />
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize", marginBottom: 6 }}>
                    Style : <strong style={{ color: "var(--ink)" }}>{cov.style}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8, lineHeight: 1.4 }}>
                    {cov.prompt?.slice(0, 60)}{cov.prompt?.length > 60 ? "…" : ""}
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {cov.isSelected ? (
                      <span className="badge badge-terracotta" style={{ fontSize: 11 }}>
                        <Icon name="check" size={10} /> Sélectionnée
                      </span>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleSelect(cov.id)}
                        disabled={!!busy}
                      >
                        {busy === "select" ? <Spinner size={11} /> : null}
                        Choisir
                      </button>
                    )}
                    {!cov.isSelected && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(cov.id)}
                        title="Supprimer"
                        style={{ padding: "4px 8px", color: "var(--text-faint)" }}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
