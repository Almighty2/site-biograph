import { useState, useEffect } from "react";
import { Icon } from "../components/Icon";
import { BookCover } from "../components/BookCover";
import { StatusBadge, Modal, Spinner } from "../components/Shared";
import { useToast } from "../components/Toast";
import { bookApi } from "../utils/api";
import { BOOKS as MOCK_BOOKS, STATUS_LABELS } from "../utils/mockData";

const COLLAB_ROLE_LABELS = {
  OWNER: "Propriétaire",
  EDITOR: "Éditeur",
  REVIEWER: "Relecteur",
  READER: "Lecteur",
};

// ─── BooksPage ────────────────────────────────────────────────────────────────

export default function BooksPage({ navigate, setActiveBook }) {
  const { toast } = useToast();
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("ALL");
  const [view, setView]         = useState("grid");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    bookApi.list()
      .then(res => setBooks(res.data || res.books || (Array.isArray(res) ? res : [])))
      .catch(() => {
        setBooks(MOCK_BOOKS);
        toast.info("Mode démo — les données affichées sont des exemples.");
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const filtered = (Array.isArray(books) ? books : books.data || []).filter(b =>
    (filter === "ALL" || b.status === filter) &&
    (!search || b.title.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    ALL:         (Array.isArray(books) ? books : []).length,
    DRAFT:       (Array.isArray(books) ? books : []).filter(b => b.status === "DRAFT").length,
    IN_PROGRESS: (Array.isArray(books) ? books : []).filter(b => b.status === "IN_PROGRESS").length,
    REVIEW:      (Array.isArray(books) ? books : []).filter(b => b.status === "REVIEW").length,
    PUBLISHED:   (Array.isArray(books) ? books : []).filter(b => b.status === "PUBLISHED").length,
  };

  const totalWords = books.reduce((a, b) => a + (b.wordCount ?? 0), 0);

  const openBook = (book) => { setActiveBook(book); navigate("book-detail"); };

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Bibliothèque</div>
          <h1 className="page-title">Mes <em>manuscrits</em></h1>
          <p className="page-subtitle">{books.length} livre{books.length !== 1 ? 's' : ''} · {totalWords.toLocaleString('fr-FR')} mots écrits</p>
        </div>
        <button className="btn btn-accent btn-lg" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={15} /> Nouveau livre
        </button>
      </div>

      {/* Filtres */}
      <div className="fade-up" data-stagger="1" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <div className="search-box" style={{ flex: 1, minWidth: 240, maxWidth: 360 }}>
          <Icon name="search" size={15} />
          <input className="input" placeholder="Rechercher un titre..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-soft)", borderRadius: "var(--r-md)" }}>
          {[["ALL","Tous"],["DRAFT","Brouillons"],["IN_PROGRESS","En cours"],["REVIEW","Relecture"],["PUBLISHED","Publiés"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{
                padding: "6px 12px", fontSize: 12.5, fontWeight: 500, borderRadius: "var(--r-sm)",
                background: filter === k ? "var(--bg-paper)" : "transparent",
                color: filter === k ? "var(--ink)" : "var(--text-secondary)",
                boxShadow: filter === k ? "var(--shadow-sm)" : "none", transition: "all 0.15s",
              }}>
              {l} <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 4 }}>{counts[k]}</span>
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 4, padding: 4, background: "var(--bg-soft)", borderRadius: "var(--r-md)" }}>
          {[["grid","menu"],["list","menu"]].map(([v, _], i) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: 6, borderRadius: "var(--r-sm)", background: view === v ? "var(--bg-paper)" : "transparent", color: view === v ? "var(--ink)" : "var(--text-muted)" }}>
              {i === 0
                ? <Icon name="menu" size={15} />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              }
            </button>
          ))}
        </div>
      </div>

      {/* Skeleton de chargement */}
      {loading && (
        <div className="grid-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", height: 200 }}>
              <div style={{ width: 110, background: "var(--bg-soft)", animation: "pulse 1.4s ease infinite" }} />
              <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ height: 12, borderRadius: 6, background: "var(--bg-soft)", width: "60%", animation: "pulse 1.4s ease infinite" }} />
                <div style={{ height: 18, borderRadius: 6, background: "var(--bg-soft)", width: "80%", animation: "pulse 1.4s ease infinite" }} />
                <div style={{ height: 12, borderRadius: 6, background: "var(--bg-soft)", width: "40%", animation: "pulse 1.4s ease infinite" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vue grille */}
      {!loading && view === "grid" && (
        <>
          {filtered.length === 0 ? (
            <div className="card empty fade-up">
              <div className="empty-icon"><Icon name="book" size={28} /></div>
              <div className="display" style={{ fontSize: 18, color: "var(--ink)" }}>
                {search ? "Aucun résultat" : "Aucun manuscrit"}
              </div>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
                {search ? `Aucun livre ne correspond à "${search}".` : "Créez votre premier livre pour commencer."}
              </p>
              {!search && <button className="btn btn-accent btn-sm" onClick={() => setShowModal(true)}>Créer un livre</button>}
            </div>
          ) : (
            <div className="grid-3">
              {filtered.map((book, i) => (
                <article key={book.id}
                  className="card card-hover fade-up"
                  data-stagger={Math.min(i + 1, 6)}
                  style={{ padding: 0, overflow: "hidden", cursor: "pointer", display: "flex" }}
                  onClick={() => openBook(book)}>
                  <div style={{ background: "var(--bg-soft)", padding: 18, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
                    <BookCover book={book} size="md" />
                  </div>
                  <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <StatusBadge status={book.status} />
                        {book.isOwner === false && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "var(--moss-light, #e8f0e2)", color: "var(--moss-deep, #4a6b35)", border: "1px solid var(--moss-mid, #b8d0a0)" }}>
                            {COLLAB_ROLE_LABELS[book.collaborationRole] ?? "Collaborateur"}
                          </span>
                        )}
                      </div>
                      <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={e => e.stopPropagation()}>
                        <Icon name="more" size={14} />
                      </button>
                    </div>
                    <h3 className="display" style={{ fontSize: 17, color: "var(--ink)", lineHeight: 1.25, marginBottom: 4 }}>{book.title}</h3>
                    {book.subtitle && (
                      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.subtitle}</p>
                    )}
                    <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--text-muted)", marginBottom: 10 }}>
                      <span><strong style={{ color: "var(--ink)" }}>{Array.isArray(book.chapters) ? book.chapters.length : (book.chapters ?? 0)}</strong> ch.</span>
                      <span><strong style={{ color: "var(--ink)" }}>{((book.wordCount ?? 0) / 1000).toFixed(1)}k</strong> mots</span>
                      <span style={{ marginLeft: "auto" }}>{book.progressPct ?? 0}%</span>
                    </div>
                    <div className="progress" style={{ height: 3, marginBottom: 10 }}>
                      <div className="progress-bar" style={{ width: `${book.progressPct ?? 0}%` }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-muted)", marginTop: "auto" }}>
                      <Icon name="clock" size={11} />
                      <span>Modifié {book.updatedAt ?? '—'}</span>
                      {book.visibility && book.visibility !== "PRIVATE" && (
                        <><span>·</span><Icon name={book.visibility === "PUBLIC" ? "globe" : "link"} size={11} /><span>{STATUS_LABELS[book.visibility]}</span></>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Vue liste */}
      {!loading && view === "list" && (
        <div className="card fade-up" style={{ padding: 0, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <p style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Aucun résultat.</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th style={{ width: 130 }}>Statut</th>
                  <th style={{ width: 110 }}>Genre</th>
                  <th style={{ width: 90, textAlign: "right" }}>Mots</th>
                  <th style={{ width: 90, textAlign: "right" }}>Pages</th>
                  <th style={{ width: 130 }}>Progression</th>
                  <th style={{ width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(book => (
                  <tr key={book.id} onClick={() => openBook(book)} style={{ cursor: "pointer" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <BookCover book={book} size="xs" />
                        <div>
                          <div className="display" style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>{book.title}</div>
                          {book.subtitle && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{book.subtitle}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <StatusBadge status={book.status} />
                        {book.isOwner === false && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "var(--moss-light, #e8f0e2)", color: "var(--moss-deep, #4a6b35)", border: "1px solid var(--moss-mid, #b8d0a0)" }}>
                            {COLLAB_ROLE_LABELS[book.collaborationRole] ?? "Collaborateur"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12.5 }}>{STATUS_LABELS[book.genre] ?? book.genre}</td>
                    <td style={{ textAlign: "right" }}>{(book.wordCount ?? 0).toLocaleString('fr-FR')}</td>
                    <td style={{ textAlign: "right" }}>{book.pageCount ?? '—'}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress" style={{ flex: 1, height: 4 }}>
                          <div className="progress-bar" style={{ width: `${book.progressPct ?? 0}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 32, textAlign: "right" }}>{book.progressPct ?? 0}%</span>
                      </div>
                    </td>
                    <td><Icon name="chevron-r" size={14} color="var(--text-muted)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <CreateBookModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(book) => {
          setBooks(prev => [book, ...prev]);
          toast.success(`"${book.title}" créé !`);
          setActiveBook(book);
          navigate("book-detail");
        }}
        toast={toast}
      />
    </div>
  );
}

// ─── Modal de création ────────────────────────────────────────────────────────

function CreateBookModal({ open, onClose, onCreated, toast }) {
  const [form, setForm] = useState({
    title: "", subtitle: "", description: "", genre: "AUTOBIOGRAPHY",
    language: "fr", visibility: "PRIVATE", targetWordCount: 50000,
    coverColor: "#B8553B", coverPattern: "stripes",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const { coverColor, coverPattern, ...rest } = form;
      const payload = { ...rest, coverStyle: coverPattern, targetWordCount: Number(form.targetWordCount) };
      const res = await bookApi.create(payload);
      onCreated(res.book || res);
      setForm({ title: "", subtitle: "", description: "", genre: "AUTOBIOGRAPHY", language: "fr", visibility: "PRIVATE", targetWordCount: 50000, coverColor: "#B8553B", coverPattern: "stripes" });
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouveau manuscrit" subtitle="Donnez vie à une nouvelle histoire" size="lg">
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 24, alignItems: "start" }}>
        {/* Aperçu couverture */}
        <div>
          <label className="field-label">Aperçu</label>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", padding: 16, background: "var(--bg-soft)", borderRadius: "var(--r-md)" }}>
            <BookCover book={{ id: "preview", title: form.title || "Titre du livre", subtitle: form.subtitle, genre: form.genre, coverColor: form.coverColor, coverPattern: form.coverPattern }} size="md" />
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="field-label">Couleur</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {["#B8553B", "#5A7A4A", "#3D5470", "#C9974A", "#8C3F2A", "#3F5A33"].map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, coverColor: c }))}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", transition: "transform 0.15s",
                    border: form.coverColor === c ? "3px solid var(--ink)" : "2px solid var(--border-soft)",
                    transform: form.coverColor === c ? "scale(1.15)" : "scale(1)" }} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="field-label">Motif</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
              {[["stripes","Rayures"],["dots","Points"],["wave","Vagues"],["diagonal","Diagonal"]].map(([k, l]) => (
                <button key={k} onClick={() => setForm(p => ({ ...p, coverPattern: k }))}
                  style={{
                    padding: "6px 10px", fontSize: 12, cursor: "pointer",
                    borderRadius: "var(--r-sm)", transition: "all 0.15s",
                    border: `1px solid ${form.coverPattern === k ? "var(--ink)" : "var(--border-soft)"}`,
                    background: form.coverPattern === k ? "var(--ink)" : "var(--bg-paper)",
                    color: form.coverPattern === k ? "var(--bg-paper)" : "var(--text-secondary)",
                  }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field-group">
            <label className="field-label">Titre *</label>
            <input className="input" placeholder="Ex : L'héritage du Baobab" value={form.title} onChange={set("title")} autoFocus />
          </div>
          <div className="field-group">
            <label className="field-label">Sous-titre</label>
            <input className="input" placeholder="Ex : Mémoires d'une enfance" value={form.subtitle} onChange={set("subtitle")} />
          </div>
          <div className="field-group">
            <label className="field-label">Description courte</label>
            <textarea className="textarea" rows={3} style={{ minHeight: 76 }}
              placeholder="Quelques lignes sur votre histoire…"
              value={form.description} onChange={set("description")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Genre</label>
              <select className="select" value={form.genre} onChange={set("genre")}>
                <option value="AUTOBIOGRAPHY">Autobiographie</option>
                <option value="BIOGRAPHY">Biographie</option>
                <option value="MEMOIR">Mémoire</option>
                <option value="FAMILY_ARCHIVE">Archive familiale</option>
                <option value="COMMUNITY_HISTORY">Histoire communautaire</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Langue</label>
              <select className="select" value={form.language} onChange={set("language")}>
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
                <option value="wo">Wolof</option>
                <option value="bm">Bambara</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Objectif (mots)</label>
              <input className="input" type="number" min={0} placeholder="50000"
                value={form.targetWordCount} onChange={set("targetWordCount")} />
            </div>
            <div className="field-group">
              <label className="field-label">Visibilité initiale</label>
              <select className="select" value={form.visibility} onChange={set("visibility")}>
                <option value="PRIVATE">Privé</option>
                <option value="RESTRICTED">Lien sécurisé</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Annuler</button>
            <button className="btn btn-primary btn-block" onClick={submit} disabled={loading || !form.title.trim()}>
              {loading ? <><Spinner size={14} /> Création…</> : <><Icon name="book" size={14} /> Créer ce livre</>}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
