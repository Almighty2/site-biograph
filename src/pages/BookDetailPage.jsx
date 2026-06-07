import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "../components/Icon";
import { BookCover } from "../components/BookCover";
import { StatusBadge, ProgressRing, Avatar, Modal, Spinner } from "../components/Shared";
import { useToast } from "../components/Toast";
import { bookApi } from "../utils/api";
import {
  CHAPTERS as MOCK_CH, COLLABORATORS as MOCK_CO, VERSIONS as MOCK_VER,
  TAGS as MOCK_TAGS, ANCHORS, STATUS_LABELS,
} from "../utils/mockData";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) { return n?.toLocaleString('fr-FR') ?? '0'; }
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function BookDetailPage({ book: initBook, navigate, setActiveChapterId }) {
  const { toast } = useToast();
  const [book, setBook]               = useState(initBook);
  const [tab, setTab]                 = useState("overview");
  const [chapters, setChapters]       = useState(null);
  const [collabs, setCollabs]         = useState(null);
  const [versions, setVersions]       = useState(null);
  const [bookExports, setBookExports] = useState(null);
  const [tags, setTags]               = useState(null);
  const [tocData, setTocData]         = useState(null);
  const [busy, setBusy]               = useState({});

  const bookId = book?.id;
  const set = (key, val) => setBusy(p => ({ ...p, [key]: val }));
  // ── Chargement initial du livre complet ────────────────────────────────────
  useEffect(() => {
    if (!bookId) return;
    bookApi.getById(bookId)
      .then(res => {
        const b = res.book || res;
        setBook(prev => ({ ...prev, ...b }));
        if (b.chapters)       setChapters(b.chapters);
        if (b.collaborations) setCollabs(b.collaborations);
        if (b.versions)       setVersions(b.versions);
        if (b.exports)        setBookExports(b.exports);
        if (b.tags)           setTags(b.tags.map(bt => bt.tag || bt));
      })
      .catch(() => {
        setChapters(MOCK_CH.filter(c => c.bookId === bookId));
        setCollabs(MOCK_CO.filter(c => c.bookId === bookId));
        setVersions(MOCK_VER);
        setTags(MOCK_TAGS);
        setBookExports([]);
      });
  }, [bookId]);

  // ── Chargement paresseux par onglet ────────────────────────────────────────
  useEffect(() => {
    if (tab === "collabs"  && collabs   === null) loadCollabs();
    if (tab === "versions" && versions  === null) loadVersions();
    if (tab === "export"   && bookExports === null) loadExports();
  }, [tab]); // eslint-disable-line

  const loadCollabs  = () => bookApi.listCollaborators(bookId).then(r => setCollabs(r.collaborations  || r || [])).catch(() => setCollabs(MOCK_CO.filter(c => c.bookId === bookId)));
  const loadVersions = () => bookApi.listVersions(bookId).then(r => setVersions(r.versions || r || [])).catch(() => setVersions(MOCK_VER));
  const loadExports  = () => bookApi.listExports(bookId).then(r => setBookExports(r.exports || r || [])).catch(() => setBookExports([]));

  if (!book) return null;

  const chs   = chapters    ?? MOCK_CH.filter(c => c.bookId === bookId);
  const cos   = collabs     ?? MOCK_CO.filter(c => c.bookId === bookId);
  const vers  = versions    ?? MOCK_VER;
  const exps  = bookExports ?? [];
  const tgs   = tags        ?? MOCK_TAGS;
  const anchor = ANCHORS.find(a => a.bookIds?.includes(bookId));

  const TABS = [
    { id: "overview",  label: "Aperçu" },
    { id: "chapters",  label: `Chapitres (${chs.length})` },
    { id: "toc",       label: "Table des matières" },
    { id: "share",     label: "Partage" },
    { id: "collabs",   label: `Collaborateurs (${cos.length})` },
    { id: "versions",  label: `Versions (${vers.length})` },
    { id: "export",    label: "Export" },
    { id: "protect",   label: "Protection" },
  ];

  return (
    <div>
      {/* Fil d'Ariane */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
        <button onClick={() => navigate("books")} style={{ color: "var(--text-secondary)" }}>Manuscrits</button>
        <Icon name="chevron-r" size={12} />
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{book.title}</span>
      </div>

      {/* En-tête du livre */}
      <BookHeader book={book} setBook={setBook} chapters={chs} collabs={cos} navigate={navigate} toast={toast} busy={busy} set={set} />

      {/* Onglets */}
      <div className="tabs fade-up" data-stagger="2" style={{ overflowX: "auto", whiteSpace: "nowrap", scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
      </div>

      {/* Contenu par onglet */}
      {tab === "overview"  && <OverviewTab book={book} chapters={chs} tags={tgs} setTags={setTags} toast={toast} navigate={navigate} setActiveChapterId={setActiveChapterId} />}
      {tab === "chapters"  && <ChaptersTab book={book} chapters={chs} setChapters={setChapters} toast={toast} navigate={navigate} setActiveChapterId={setActiveChapterId} />}
      {tab === "toc"       && <TocTab book={book} chapters={chs} tocData={tocData} setTocData={setTocData} toast={toast} />}
      {tab === "share"     && <ShareTab book={book} setBook={setBook} toast={toast} />}
      {tab === "collabs"   && <CollabsTab book={book} collabs={cos} setCollabs={setCollabs} toast={toast} />}
      {tab === "versions"  && <VersionsTab book={book} versions={vers} setVersions={setVersions} toast={toast} />}
      {tab === "export"    && <ExportTab book={book} exports={exps} setExports={setBookExports} toast={toast} />}
      {tab === "protect"   && <ProtectTab anchor={anchor} navigate={navigate} />}
    </div>
  );
}

// ─── En-tête ─────────────────────────────────────────────────────────────────

function BookHeader({ book, setBook, chapters, collabs, navigate, toast, busy, set }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit]   = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    if (!showMenu) return;
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMenu]);

  const doPublish = async () => {
    set('publish', true);
    try {
      await bookApi.publish(book.id);
      setBook(p => ({ ...p, status: 'PUBLISHED' }));
      toast.success('Manuscrit publié !');
    } catch (e) { toast.error(e.message); }
    finally { set('publish', false); }
  };

  const doArchive = async () => {
    set('archive', true);
    try {
      await bookApi.archive(book.id);
      setBook(p => ({ ...p, status: 'ARCHIVED' }));
      toast.success('Manuscrit archivé.');
    } catch (e) { toast.error(e.message); }
    finally { set('archive', false); }
  };

  return (
    <>
    <div className="fade-up" data-stagger="1" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 32, marginBottom: 36, alignItems: "start" }}>
      <div style={{ animation: "scaleIn 0.4s var(--ease) both" }}>
        <BookCover book={book} size="lg" />
      </div>

      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <StatusBadge status={book.status} />
          <span className="badge badge-neutral">{STATUS_LABELS[book.genre] ?? book.genre}</span>
          <span className="badge badge-neutral">
            <Icon name={book.visibility === "PRIVATE" ? "lock" : book.visibility === "PUBLIC" ? "globe" : "link"} size={11} />
            {STATUS_LABELS[book.visibility] ?? book.visibility}
          </span>
          {book.isPremium && <span className="badge badge-ochre">Premium</span>}
        </div>
        <h1 className="display" style={{ fontSize: 36, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 6 }}>{book.title}</h1>
        {book.subtitle && <p className="display-italic" style={{ fontSize: 17, color: "var(--text-secondary)", marginBottom: 14 }}>{book.subtitle}</p>}
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 640, marginBottom: 20 }}>{book.description}</p>
        <div style={{ display: "flex", gap: 28, fontSize: 13, flexWrap: "wrap" }}>
          {[
            { l: "Mots", v: fmt(book.wordCount) },
            { l: "Pages", v: book.pageCount ?? '—' },
            { l: "Chapitres", v: chapters.length },
            { l: "Collaborateurs", v: collabs.length || "Aucun" },
            { l: "Créé le", v: fmtDate(book.createdAt) },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 3 }}>{s.l}</div>
              <div className="display" style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 200 }}>
        <button className="btn btn-accent btn-lg btn-block" onClick={() => navigate("editor")}>
          <Icon name="edit" size={15} /> Reprendre l'écriture
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button className="btn btn-secondary btn-block" onClick={() => navigate("orders")}><Icon name="package" size={13} /> Imprimer</button>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button className="btn btn-secondary btn-block" onClick={() => setShowMenu(v => !v)}>
              <Icon name="more" size={13} /> Actions
            </button>
            {showMenu && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                background: "var(--bg-paper)", border: "1px solid var(--border-soft)",
                borderRadius: "var(--r-md)", boxShadow: "var(--shadow-lg)",
                padding: "6px 0", minWidth: 170, animation: "fadeUp 0.15s var(--ease) both",
              }}>
                {book.status !== 'PUBLISHED' && (
                  <MenuAction icon="globe" label="Publier" onClick={() => { setShowMenu(false); doPublish(); }} loading={busy.publish} />
                )}
                {book.status !== 'ARCHIVED' && (
                  <MenuAction icon="bookmark" label="Archiver" onClick={() => { setShowMenu(false); doArchive(); }} loading={busy.archive} />
                )}
                <MenuAction icon="edit" label="Modifier les infos" onClick={() => { setShowMenu(false); setShowEdit(true); }} />
                <div style={{ height: 1, background: "var(--border-soft)", margin: "4px 0" }} />
                <MenuAction icon="trash" label="Supprimer" onClick={() => setShowMenu(false)} danger />
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <ProgressRing value={book.progressPct ?? 0} size={84} strokeWidth={5} />
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
          Objectif : {fmt(book.targetWordCount)} mots
        </div>
      </div>
    </div>
    <EditBookModal open={showEdit} onClose={() => setShowEdit(false)} book={book} setBook={setBook} toast={toast} />
    </>
  );
}

function MenuAction({ icon, label, onClick, loading, danger }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "9px 14px", fontSize: 13, background: "none", border: "none",
        color: danger ? "var(--terracotta)" : "var(--text-secondary)", cursor: "pointer", textAlign: "left",
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? "var(--terracotta-bg)" : "var(--bg-soft)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      {loading ? <Spinner size={13} /> : <Icon name={icon} size={14} />}
      {label}
    </button>
  );
}

// ─── Onglet : Aperçu ──────────────────────────────────────────────────────────

function OverviewTab({ book, chapters, tags, setTags, toast, navigate, setActiveChapterId }) {
  const [newTag, setNewTag]   = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    setAddingTag(true);
    try {
      const res = await bookApi.addTags(book.id, { tags: [newTag.trim()] });
      const added = res.tags || [{ id: Date.now(), name: newTag.trim() }];
      setTags(prev => [...(prev ?? []), ...(Array.isArray(added) ? added : [])]);
      setNewTag(""); setShowTagInput(false);
      toast.success('Étiquette ajoutée.');
    } catch (e) { toast.error(e.message); }
    finally { setAddingTag(false); }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await bookApi.removeTag(book.id, tagId);
      setTags(prev => prev.filter(t => t.id !== tagId));
      toast.success('Étiquette supprimée.');
    } catch (e) { toast.error(e.message); }
  };

  const completedCount = chapters.filter(c => c.isComplete || c.completionStatus === 'COMPLETE').length;
  const completePct = chapters.length ? Math.round((completedCount / chapters.length) * 100) : 0;

  return (
    <div className="fade-up">
      {/* Stats rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "feather", label: "Mots écrits", value: fmt(book.wordCount), color: "var(--terracotta)" },
          { icon: "book",    label: "Chapitres terminés", value: `${completedCount}/${chapters.length}`, color: "var(--moss)" },
          { icon: "clock",   label: "Progression", value: `${book.progressPct ?? completePct}%`, color: "var(--ochre)" },
          { icon: "calendar",label: "Dernière modif.", value: fmtDate(book.updatedAt), color: "var(--indigo)" },
        ].map((s, i) => (
          <div key={i} className="card card-padded" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: s.color + "22", color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={s.icon} size={16} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              <div className="display" style={{ fontSize: 17, color: "var(--ink)", fontWeight: 500, marginTop: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2-side">
        {/* Aperçu TOC */}
        <div className="card card-padded">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 className="display" style={{ fontSize: 16, color: "var(--ink)" }}>Structure du manuscrit</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate && navigate("editor")}>
              Écrire <Icon name="arrow-r" size={12} />
            </button>
          </div>
          {chapters.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>Aucun chapitre créé.</p>
          ) : (
            chapters.slice(0, 6).map(ch => {
              const wc = ch.wordCount ?? 0;
              const done = ch.isComplete || ch.completionStatus === 'COMPLETE';
              return (
                <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--border-soft)", cursor: "pointer" }} onClick={() => { setActiveChapterId?.(ch.id); navigate("editor"); }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: done ? "var(--moss-bg)" : "var(--bg-soft)",
                    color: done ? "var(--moss-deep)" : "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500,
                  }}>
                    {done ? <Icon name="check" size={11} /> : (ch.position ?? "—")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: "var(--ink)" }}>{ch.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {wc > 0 ? `${fmt(wc)} mots` : "Vide"}
                      {ch.subChapters?.length > 0 && ` · ${ch.subChapters.length} sous-chap.`}
                      {(ch.hasImages > 0 || ch.images?.length > 0) && ` · ${ch.hasImages ?? ch.images?.length} image(s)`}
                    </div>
                  </div>
                  <Icon name="chevron-r" size={14} color="var(--text-muted)" />
                </div>
              );
            })
          )}
          {chapters.length > 6 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>
              + {chapters.length - 6} chapitres supplémentaires
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Tags */}
          <div className="card card-padded">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 className="display" style={{ fontSize: 15, color: "var(--ink)" }}>Étiquettes</h3>
              <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setShowTagInput(v => !v)}>
                <Icon name="plus" size={14} />
              </button>
            </div>
            {showTagInput && (
              <div style={{ display: "flex", gap: 6, marginBottom: 10, animation: "fadeUp 0.2s var(--ease)" }}>
                <input className="input" placeholder="Nouvelle étiquette..." value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  style={{ flex: 1, height: 34, fontSize: 13 }} autoFocus />
                <button className="btn btn-primary btn-sm" onClick={handleAddTag} disabled={addingTag}>
                  {addingTag ? <Spinner size={13} /> : <Icon name="check" size={13} />}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowTagInput(false); setNewTag(""); }}>
                  <Icon name="x" size={13} />
                </button>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(tags ?? []).map(t => (
                <span key={t.id} className="badge badge-neutral" style={{ cursor: "default", gap: 4 }}>
                  <Icon name="tag" size={10} /> {t.name}
                  <button onClick={() => handleRemoveTag(t.id)} style={{ marginLeft: 4, color: "var(--text-faint)", padding: 0 }}>
                    <Icon name="x" size={10} />
                  </button>
                </span>
              ))}
              {(tags ?? []).length === 0 && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Aucune étiquette</span>}
            </div>
          </div>

          {/* Export rapide */}
          <div className="card card-padded">
            <h3 className="display" style={{ fontSize: 15, color: "var(--ink)", marginBottom: 12 }}>Export rapide</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { fmt: "PDF",  icon: "download", desc: "Mise en page" },
                { fmt: "EPUB", icon: "book",     desc: "Liseuse" },
                { fmt: "DOCX", icon: "edit",     desc: "Word" },
              ].map(f => (
                <button key={f.fmt} className="btn btn-secondary btn-sm"
                  style={{ flexDirection: "column", padding: "14px 8px", gap: 4, height: "auto" }}>
                  <Icon name={f.icon} size={15} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{f.fmt}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Multimédia */}
          <div className="card card-padded">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 className="display" style={{ fontSize: 15, color: "var(--ink)" }}>Multimédia</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("media")}><Icon name="arrow-r" size={12} /></button>
            </div>
            <button className="btn btn-secondary btn-block" style={{ marginBottom: 8 }} onClick={() => navigate("media")}>
              <Icon name="mic" size={14} /> Créer une narration audio
            </button>
            <button className="btn btn-secondary btn-block" onClick={() => navigate("media")}>
              <Icon name="video" size={14} /> Créer une vidéo histoire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Onglet : Chapitres ───────────────────────────────────────────────────────

function ChaptersTab({ book, chapters, setChapters, toast, navigate, setActiveChapterId }) {
  const [showAdd, setShowAdd]         = useState(false);
  const [expanded, setExpanded]       = useState({});
  const [editId, setEditId]           = useState(null);
  const [editTitle, setEditTitle]     = useState("");
  const [addSubId, setAddSubId]       = useState(null);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [busy, setBusy]               = useState({});
  const [confirm, setConfirm]         = useState(null);
  const [editSubId, setEditSubId]     = useState(null);
  const [editSubTitle, setEditSubTitle] = useState("");

  const set = (k, v) => setBusy(p => ({ ...p, [k]: v }));

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const startEdit = (ch) => { setEditId(ch.id); setEditTitle(ch.title); };
  const cancelEdit = () => { setEditId(null); setEditTitle(""); };

  const saveChapterTitle = async (chapterId) => {
    if (!editTitle.trim()) return;
    set(`edit-${chapterId}`, true);
    try {
      await bookApi.updateChapter(book.id, chapterId, { title: editTitle.trim() });
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, title: editTitle.trim() } : c));
      toast.success('Titre mis à jour.');
      cancelEdit();
    } catch (e) { toast.error(e.message); }
    finally { set(`edit-${chapterId}`, false); }
  };

  const toggleComplete = async (ch) => {
    const newVal = !(ch.isComplete || ch.completionStatus === 'COMPLETE');
    set(`toggle-${ch.id}`, true);
    try {
      await bookApi.updateChapter(book.id, ch.id, { isComplete: newVal });
      setChapters(prev => prev.map(c => c.id === ch.id ? { ...c, isComplete: newVal } : c));
      toast.success(newVal ? 'Chapitre marqué complet !' : 'Chapitre marqué en cours.');
    } catch (e) { toast.error(e.message); }
    finally { set(`toggle-${ch.id}`, false); }
  };

  const deleteChapter = async (chapterId) => {
    set(`del-${chapterId}`, true);
    try {
      await bookApi.deleteChapter(book.id, chapterId);
      setChapters(prev => prev.filter(c => c.id !== chapterId));
      toast.success('Chapitre supprimé.');
      setConfirm(null);
    } catch (e) { toast.error(e.message); }
    finally { set(`del-${chapterId}`, false); }
  };

  const addSubChapter = async (chapterId) => {
    if (!newSubTitle.trim()) return;
    set(`sub-${chapterId}`, true);
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      const res = await bookApi.createSubChapter(book.id, chapterId, { title: newSubTitle.trim(), position: (chapter?.subChapters?.length ?? 0) + 1 });
      const newSub = res.subChapter || { id: Date.now(), title: newSubTitle.trim(), wordCount: 0 };
      setChapters(prev => prev.map(c =>
        c.id === chapterId ? { ...c, subChapters: [...(c.subChapters || []), newSub] } : c
      ));
      setNewSubTitle(""); setAddSubId(null);
      toast.success('Sous-chapitre ajouté.');
    } catch (e) { toast.error(e.message); }
    finally { set(`sub-${chapterId}`, false); }
  };

  const deleteSubChapter = async (chapterId, subId) => {
    try {
      await bookApi.deleteSubChapter(book.id, chapterId, subId);
      setChapters(prev => prev.map(c =>
        c.id === chapterId ? { ...c, subChapters: (c.subChapters || []).filter(s => s.id !== subId) } : c
      ));
      toast.success('Sous-chapitre supprimé.');
    } catch (e) { toast.error(e.message); }
  };

  const saveSubChapterTitle = async (chapterId, subId) => {
    if (!editSubTitle.trim()) return;
    set(`editSub-${subId}`, true);
    try {
      await bookApi.updateSubChapter(book.id, chapterId, subId, { title: editSubTitle.trim() });
      setChapters(prev => prev.map(c =>
        c.id === chapterId
          ? { ...c, subChapters: (c.subChapters || []).map(s => s.id === subId ? { ...s, title: editSubTitle.trim() } : s) }
          : c
      ));
      toast.success('Sous-chapitre renommé.');
      setEditSubId(null);
    } catch (e) { toast.error(e.message); }
    finally { set(`editSub-${subId}`, false); }
  };

  const moveChapter = async (index, dir) => {
    console.log('erreur')
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= chapters.length) return;
    const updated = [...chapters];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    const reordered = updated.map((c, i) => ({ ...c, position: i + 1 }));
    setChapters(reordered);
    try {
      console.log('Reordering chapters for book:', book.id);
      await bookApi.reorderChapters(book.id, reordered.map((c, i) => ({ id: c.id, position: i + 1 })));    } catch (e) { setChapters(chapters); toast.error(e.message); }
  };

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
          {chapters.length} chapitre{chapters.length !== 1 ? 's' : ''} —
          {chapters.filter(c => c.isComplete).length} terminé{chapters.filter(c => c.isComplete).length !== 1 ? 's' : ''}
        </p>
        <button className="btn btn-accent btn-sm" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={13} /> Nouveau chapitre
        </button>
      </div>

      {chapters.length === 0 ? (
        <div className="card empty fade-up">
          <div className="empty-icon"><Icon name="book" size={24} /></div>
          <div className="display" style={{ fontSize: 17 }}>Aucun chapitre</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Créez votre premier chapitre pour commencer.</p>
          <button className="btn btn-accent btn-sm" onClick={() => setShowAdd(true)}>Créer un chapitre</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {chapters.map((ch, i) => {
            const done = ch.isComplete || ch.completionStatus === 'COMPLETE';
            const subs = ch.subChapters || [];
            const isExp = expanded[ch.id];

            return (
              <div key={ch.id} style={{ borderBottom: i < chapters.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-soft)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  {/* Numéro/état */}
                  <button onClick={() => toggleComplete(ch)} disabled={busy[`toggle-${ch.id}`]}
                    title={done ? "Marquer en cours" : "Marquer complet"}
                    style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: done ? "var(--moss-bg)" : "var(--bg-soft)",
                      color: done ? "var(--moss-deep)" : "var(--text-secondary)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500,
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                    {busy[`toggle-${ch.id}`] ? <Spinner size={12} /> : (done ? <Icon name="check" size={13} /> : ch.position)}
                  </button>

                  {/* Titre (éditable) */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editId === ch.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input className="input" value={editTitle} autoFocus
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveChapterTitle(ch.id); if (e.key === 'Escape') cancelEdit(); }}
                          style={{ flex: 1, height: 32, fontSize: 14 }} />
                        <button className="btn btn-primary btn-sm" onClick={() => saveChapterTitle(ch.id)} disabled={busy[`edit-${ch.id}`]}>
                          {busy[`edit-${ch.id}`] ? <Spinner size={12} /> : <Icon name="check" size={13} />}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={cancelEdit}><Icon name="x" size={13} /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="display" style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500, cursor: "pointer" }} onClick={() => { setActiveChapterId?.(ch.id); navigate("editor"); }}>{ch.title}</span>
                        {done && <span className="badge badge-moss" style={{ fontSize: 10, padding: "1px 6px" }}>Complet</span>}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12, marginTop: 3, fontSize: 12, color: "var(--text-muted)" }}>
                      <span>{ch.wordCount > 0 ? `${fmt(ch.wordCount)} mots` : "Vide"}</span>
                      {subs.length > 0 && <span>{subs.length} sous-chapitre{subs.length > 1 ? 's' : ''}</span>}
                      {(ch.hasImages > 0 || ch.images?.length > 0) && <span><Icon name="image" size={11} /> {ch.hasImages ?? ch.images?.length}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="icon-btn" title="Monter" onClick={() => moveChapter(i, -1)} disabled={i === 0}
                      style={{ opacity: i === 0 ? 0.25 : 1 }}>
                      <div style={{ transform: "rotate(180deg)", display: "flex" }}><Icon name="chevron-d" size={13} /></div>
                    </button>
                    <button className="icon-btn" title="Descendre" onClick={() => moveChapter(i, 1)} disabled={i === chapters.length - 1}
                      style={{ opacity: i === chapters.length - 1 ? 0.25 : 1 }}>
                      <Icon name="chevron-d" size={13} />
                    </button>
                    {editId !== ch.id && (
                      <button className="icon-btn" title="Renommer" onClick={() => startEdit(ch)}><Icon name="edit" size={13} /></button>
                    )}
                    <button className="icon-btn" title={isExp ? "Réduire" : "Voir les sous-chapitres"}
                      onClick={() => toggleExpand(ch.id)}
                      style={{ color: subs.length > 0 ? "var(--text-secondary)" : "var(--text-faint)" }}>
                      <Icon name={isExp ? "chevron-d" : "chevron-r"} size={14} />
                    </button>
                    <button className="icon-btn" title="Supprimer"
                      onClick={() => setConfirm({ type: "chapter", id: ch.id, label: ch.title })}
                      style={{ color: "var(--terracotta)" }}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>

                {/* Sous-chapitres */}
                {isExp && (
                  <div style={{ paddingLeft: 62, paddingRight: 18, paddingBottom: 10, background: "var(--bg-soft)", borderTop: "1px solid var(--border-soft)", animation: "fadeUp 0.2s var(--ease)" }}>
                    {subs.map(sub => (
                      <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-faint)", flexShrink: 0 }} />
                        {editSubId === sub.id ? (
                          <>
                            <input className="input" value={editSubTitle} autoFocus
                              onChange={e => setEditSubTitle(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveSubChapterTitle(ch.id, sub.id); if (e.key === 'Escape') setEditSubId(null); }}
                              style={{ flex: 1, height: 28, fontSize: 13 }} />
                            <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => saveSubChapterTitle(ch.id, sub.id)} disabled={busy[`editSub-${sub.id}`]}>
                              {busy[`editSub-${sub.id}`] ? <Spinner size={12} /> : <Icon name="check" size={12} />}
                            </button>
                            <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setEditSubId(null)}>
                              <Icon name="x" size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>{sub.title}</span>
                            {sub.wordCount > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmt(sub.wordCount)} mots</span>}
                            <button className="icon-btn" style={{ width: 24, height: 24 }} title="Renommer"
                              onClick={() => { setEditSubId(sub.id); setEditSubTitle(sub.title); }}>
                              <Icon name="edit" size={12} />
                            </button>
                            <button className="icon-btn" style={{ color: "var(--terracotta)", width: 24, height: 24 }}
                              onClick={() => deleteSubChapter(ch.id, sub.id)}>
                              <Icon name="x" size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}

                    {addSubId === ch.id ? (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <input className="input" placeholder="Titre du sous-chapitre..." autoFocus
                          value={newSubTitle} onChange={e => setNewSubTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addSubChapter(ch.id); if (e.key === 'Escape') setAddSubId(null); }}
                          style={{ flex: 1, height: 32, fontSize: 13 }} />
                        <button className="btn btn-primary btn-sm" onClick={() => addSubChapter(ch.id)} disabled={busy[`sub-${ch.id}`]}>
                          {busy[`sub-${ch.id}`] ? <Spinner size={12} /> : <Icon name="check" size={13} />}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAddSubId(null)}><Icon name="x" size={13} /></button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
                        onClick={() => { setAddSubId(ch.id); setNewSubTitle(""); }}>
                        <Icon name="plus" size={12} /> Ajouter un sous-chapitre
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ajout de chapitre */}
      <AddChapterModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        bookId={book.id}
        nextPosition={chapters.length + 1}
        onAdded={(ch) => { setChapters(prev => [...prev, ch]); toast.success('Chapitre créé !'); }}
        toast={toast}
      />

      {/* Confirmation suppression */}
      <ConfirmModal
        open={!!confirm}
        title={`Supprimer "${confirm?.label}"`}
        description="Cette action est irréversible. Le contenu de ce chapitre sera définitivement perdu."
        confirmLabel="Supprimer"
        danger
        loading={confirm ? !!busy[`del-${confirm.id}`] : false}
        onConfirm={() => confirm && deleteChapter(confirm.id)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

// ─── Onglet : Table des matières ─────────────────────────────────────────────

function TocTab({ book, chapters, tocData, setTocData, toast }) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await bookApi.generateToc(book.id);
      setTocData(res.tableOfContents || res);
      toast.success('Table des matières générée !');
    } catch {
      // Fallback : construire depuis les chapitres locaux
      setTocData({ chapters: chapters.map(ch => ({
        position: ch.position, title: ch.title, wordCount: ch.wordCount,
        subChapters: ch.subChapters || [],
      }))});
      toast.info('Table des matières construite depuis les chapitres.');
    } finally { setGenerating(false); }
  };

  const toc = tocData?.chapters ?? chapters;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, color: "var(--ink)" }}>Table des matières</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Structure complète du manuscrit avec la numérotation et les sous-sections.</p>
        </div>
        <button className="btn btn-accent btn-sm" onClick={generate} disabled={generating}>
          {generating ? <><Spinner size={13} /> Génération…</> : <><Icon name="sparkle" size={13} /> Générer</>}
        </button>
      </div>

      {toc.length === 0 ? (
        <div className="card empty"><div className="empty-icon"><Icon name="book" size={24} /></div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucun chapitre — créez des chapitres pour générer la table des matières.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: "24px 32px" }}>
          <h2 className="display" style={{ fontSize: 22, color: "var(--ink)", textAlign: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-soft)" }}>
            {book.title}
          </h2>
          {toc.map((ch, i) => {
            const subs = ch.subChapters || ch.sub_chapters || [];
            const done = ch.isComplete || ch.completionStatus === 'COMPLETE';
            return (
              <div key={ch.id || i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span className="display" style={{ fontSize: 14, color: done ? "var(--moss-deep)" : "var(--text-muted)", minWidth: 24, fontWeight: 500 }}>{ch.position ?? i + 1}.</span>
                  <span className="display" style={{ fontSize: 16, color: "var(--ink)", flex: 1, fontWeight: 500 }}>{ch.title}</span>
                  <span style={{ borderBottom: "1px dotted var(--border-medium)", flex: 1, height: 1, margin: "0 8px", alignSelf: "flex-end", marginBottom: 4 }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 80, textAlign: "right" }}>
                    {ch.wordCount > 0 ? `${fmt(ch.wordCount)} mots` : "—"}
                  </span>
                  {done && <Icon name="check" size={13} color="var(--moss)" />}
                </div>
                {subs.map((sub, j) => (
                  <div key={sub.id || j} style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4, paddingLeft: 32 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 24 }}>{ch.position ?? i + 1}.{j + 1}</span>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)", flex: 1 }}>{sub.title}</span>
                    <span style={{ borderBottom: "1px dotted var(--border-soft)", flex: 1, height: 1, margin: "0 8px", alignSelf: "flex-end", marginBottom: 4 }} />
                    <span style={{ fontSize: 11, color: "var(--text-faint)", minWidth: 80, textAlign: "right" }}>
                      {sub.wordCount > 0 ? `${fmt(sub.wordCount)} mots` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }}>
            <span>{toc.length} chapitres · {toc.filter(c => c.isComplete).length} terminés</span>
            <span className="display" style={{ fontWeight: 600, color: "var(--ink)" }}>{fmt(book.wordCount)} mots au total</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet : Partage ─────────────────────────────────────────────────────────

function ShareTab({ book, setBook, toast }) {
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied]     = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = book.shareToken ? `${origin}/book/share/${book.shareToken}` : null;
  const publicUrl = book.slug       ? `${origin}/book/${book.slug}` : null;
  const displayUrl = book.visibility === 'PUBLIC' ? publicUrl : shareLink;

  const updateVisibility = async (visibility) => {
    if (visibility === book.visibility) return;
    setUpdating(true);
    try {
      const res = await bookApi.updateVisibility(book.id, { visibility });
      const updated = res.book || res;
      setBook(p => ({
        ...p, visibility,
        shareToken: updated.shareToken || updated.book?.shareToken || p.shareToken,
        slug: updated.slug || p.slug,
      }));
      toast.success(`Visibilité : ${STATUS_LABELS[visibility] ?? visibility}`);
    } catch (e) { toast.error(e.message || 'Erreur de mise à jour.'); }
    finally { setUpdating(false); }
  };

  const copy = () => {
    const url = displayUrl;
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const OPTS = [
    { key: "PRIVATE",    icon: "lock",    title: "Privé",         desc: "Seul vous pouvez accéder au manuscrit.", color: "var(--text-secondary)" },
    { key: "RESTRICTED", icon: "link",    title: "Lien secret",   desc: "Accessible uniquement via un lien sécurisé.", color: "var(--ochre)" },
    { key: "PUBLIC",     icon: "globe",   title: "Public",        desc: "Visible par tout le monde sur internet.", color: "var(--moss)" },
  ];

  return (
    <div className="fade-up" style={{ maxWidth: 680 }}>
      {/* Sélecteur de visibilité */}
      <div className="card card-padded" style={{ marginBottom: 16 }}>
        <h3 className="display" style={{ fontSize: 16, color: "var(--ink)", marginBottom: 4 }}>Visibilité du manuscrit</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Contrôlez qui peut accéder à votre œuvre.</p>
        <div style={{ display: "flex", gap: 12 }}>
          {OPTS.map(opt => {
            const active = book.visibility === opt.key;
            return (
              <button key={opt.key} onClick={() => updateVisibility(opt.key)} disabled={updating}
                style={{
                  flex: 1, padding: "16px 14px", borderRadius: "var(--r-md)", cursor: "pointer",
                  border: `2px solid ${active ? opt.color : "var(--border-soft)"}`,
                  background: active ? (opt.key === "PRIVATE" ? "var(--bg-soft)" : opt.key === "RESTRICTED" ? "var(--ochre-bg)" : "var(--moss-bg)") : "var(--bg-paper)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  transition: "all 0.18s", opacity: updating ? 0.7 : 1,
                }}>
                {updating && active ? <Spinner size={18} /> : <Icon name={opt.icon} size={20} color={active ? opt.color : "var(--text-muted)"} />}
                <div style={{ fontWeight: 600, color: active ? opt.color : "var(--ink)", fontSize: 14 }}>{opt.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.4 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lien de partage */}
      {book.visibility !== "PRIVATE" && (
        <div className="card card-padded" style={{ marginBottom: 16, animation: "fadeUp 0.2s var(--ease)" }}>
          <h3 className="display" style={{ fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>
            {book.visibility === "PUBLIC" ? "URL publique" : "Lien secret"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            {book.visibility === "PUBLIC"
              ? "Ce lien est accessible à tous depuis internet."
              : "Partagez ce lien uniquement avec les personnes de confiance."}
          </p>
          {displayUrl ? (
            <div style={{ display: "flex", gap: 8 }}>
              <div className="input-with-icon" style={{ flex: 1 }}>
                <Icon name="link" size={15} />
                <input className="input" readOnly value={displayUrl}
                  style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }} />
              </div>
              <button className="btn btn-secondary" onClick={copy}
                style={{ minWidth: 96, transition: "all 0.15s", background: copied ? "var(--moss-bg)" : "", color: copied ? "var(--moss-deep)" : "" }}>
                {copied ? <><Icon name="check" size={13} /> Copié !</> : <><Icon name="link" size={13} /> Copier</>}
              </button>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", background: "var(--bg-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--text-muted)" }}>
              Le lien sera généré automatiquement après la mise à jour de la visibilité.
            </div>
          )}
        </div>
      )}

      {/* Infos publiques */}
      {book.visibility === "PUBLIC" && (
        <div className="card card-padded" style={{ background: "var(--moss-bg)", borderColor: "var(--moss-bg)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--moss)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="globe" size={16} />
            </div>
            <div>
              <div className="display" style={{ fontSize: 15, color: "var(--moss-deep)", fontWeight: 600 }}>Manuscrit public</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5 }}>
                Votre manuscrit est visible publiquement. Il peut être découvert via les moteurs de recherche et partagé librement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accès restreint */}
      {book.visibility === "RESTRICTED" && (
        <div className="card card-padded" style={{ background: "var(--ochre-bg)", borderColor: "var(--ochre-bg)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--ochre)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="lock" size={16} />
            </div>
            <div>
              <div className="display" style={{ fontSize: 15, color: "#8A6020", fontWeight: 600 }}>Accès restreint</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5 }}>
                Seules les personnes possédant ce lien peuvent accéder au manuscrit. Partagez-le avec soin.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet : Collaborateurs ──────────────────────────────────────────────────

function CollabsTab({ book, collabs, setCollabs, toast }) {
  const [showInvite, setShowInvite] = useState(false);
  const [busy, setBusy]             = useState({});
  const [confirm, setConfirm]       = useState(null);

  const set = (k, v) => setBusy(p => ({ ...p, [k]: v }));

  const changeRole = async (collaboratorId, newRole) => {
    set(`role-${collaboratorId}`, true);
    try {
      await bookApi.updateCollaboratorRole(book.id, collaboratorId, { role: newRole });
      setCollabs(prev => prev.map(c => c.id === collaboratorId ? { ...c, role: newRole } : c));
      toast.success('Rôle mis à jour.');
    } catch (e) { toast.error(e.message); }
    finally { set(`role-${collaboratorId}`, false); }
  };

  const removeCollab = async (collaboratorId, name) => {
    set(`del-${collaboratorId}`, true);
    try {
      await bookApi.removeCollaborator(book.id, collaboratorId);
      setCollabs(prev => prev.filter(c => c.id !== collaboratorId));
      toast.success(`${name} a été retiré(e).`);
      setConfirm(null);
    } catch (e) { toast.error(e.message); }
    finally { set(`del-${collaboratorId}`, false); }
  };

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>Invitez des personnes à lire, commenter ou éditer ce manuscrit.</p>
        <button className="btn btn-accent btn-sm" onClick={() => setShowInvite(true)}>
          <Icon name="plus" size={13} /> Inviter
        </button>
      </div>

      {collabs.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon"><Icon name="users" size={24} /></div>
          <div className="display" style={{ fontSize: 17, color: "var(--ink)" }}>Aucun collaborateur</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Ce manuscrit est pour l'instant solo.</p>
          <button className="btn btn-accent btn-sm" onClick={() => setShowInvite(true)}>Inviter quelqu'un</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {collabs.map((c, i) => {
            const name = c.fullName || c.user?.fullName || c.email;
            const email = c.email || c.user?.email || '';
            const accepted = c.acceptedAt || c.status === 'ACCEPTED';
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < collabs.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                <Avatar name={name} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>{name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{email}</div>
                </div>
                {accepted ? <span className="badge badge-moss">Accepté</span> : <span className="badge badge-ochre">En attente</span>}
                <select className="select"
                  defaultValue={c.role}
                  disabled={busy[`role-${c.id}`]}
                  onChange={e => changeRole(c.userId, e.target.value)}
                  style={{ width: 148, padding: "6px 10px", fontSize: 12.5 }}>
                  {[["READER","Lecteur"],["COMMENTER","Commentateur"],["EDITOR","Éditeur"],["ADMIN","Administrateur"]].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                {busy[`role-${c.id}`] && <Spinner size={14} />}
                <button className="icon-btn" onClick={() => setConfirm({ id: c.id, label: name })}
                  style={{ color: "var(--terracotta)" }}>
                  {busy[`del-${c.id}`] ? <Spinner size={14} /> : <Icon name="trash" size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        bookId={book.id}
        onAdded={(co) => { setCollabs(prev => [...prev, co]); toast.success('Invitation envoyée !'); }}
        toast={toast}
      />

      <ConfirmModal
        open={!!confirm}
        title={`Retirer "${confirm?.label}"`}
        description="Cette personne n'aura plus accès au manuscrit. Elle peut être réinvitée à tout moment."
        confirmLabel="Retirer"
        danger
        loading={confirm ? !!busy[`del-${confirm.id}`] : false}
        onConfirm={() => confirm && removeCollab(confirm.id, confirm.label)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

// ─── Onglet : Versions ────────────────────────────────────────────────────────

function VersionsTab({ book, versions, setVersions, toast }) {
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy]             = useState({});
  const [confirm, setConfirm]       = useState(null);

  const set = (k, v) => setBusy(p => ({ ...p, [k]: v }));

  const doRestore = async (versionId, label) => {
    set(`restore-${versionId}`, true);
    try {
      await bookApi.restoreVersion(book.id, versionId);
      toast.success(`Version "${label}" restaurée !`);
      setConfirm(null);
    } catch (e) { toast.error(e.message); }
    finally { set(`restore-${versionId}`, false); }
  };

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>Sauvegardes manuelles — restaurez n'importe quelle version à tout moment.</p>
        <button className="btn btn-accent btn-sm" onClick={() => setShowCreate(true)}>
          <Icon name="bookmark" size={13} /> Sauvegarder maintenant
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon"><Icon name="bookmark" size={24} /></div>
          <div className="display" style={{ fontSize: 17 }}>Aucune sauvegarde</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Créez une sauvegarde pour ne jamais perdre votre travail.</p>
          <button className="btn btn-accent btn-sm" onClick={() => setShowCreate(true)}>Créer une sauvegarde</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {versions.map((v, i) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < versions.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
              <div style={{
                width: 44, height: 44, flexShrink: 0, borderRadius: "var(--r-md)",
                background: i === 0 ? "var(--terracotta-bg)" : "var(--bg-soft)",
                color: i === 0 ? "var(--terracotta-deep)" : "var(--text-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600,
              }}>
                v{v.versionNumber ?? versions.length - i}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, color: "var(--ink)", fontWeight: 500 }}>
                  {v.label || `Sauvegarde du ${fmtDate(v.createdAt)}`}
                  {i === 0 && <span className="badge badge-terracotta" style={{ fontSize: 10, padding: "1px 7px", marginLeft: 8 }}>Actuelle</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                  {fmtDate(v.createdAt)}
                  {v.wordCount && ` · ${fmt(v.wordCount)} mots`}
                  {v.chaptersCount && ` · ${v.chaptersCount} chapitres`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary btn-sm">Voir</button>
                {i !== 0 && (
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => setConfirm({ id: v.id, label: v.label || `v${v.versionNumber}` })}
                    disabled={busy[`restore-${v.id}`]}>
                    {busy[`restore-${v.id}`] ? <Spinner size={13} /> : 'Restaurer'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateVersionModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        bookId={book.id}
        onCreated={(ver) => { setVersions(prev => [ver, ...prev]); toast.success('Sauvegarde créée !'); }}
        toast={toast}
      />

      <ConfirmModal
        open={!!confirm}
        title={`Restaurer "${confirm?.label}"`}
        description="Votre contenu actuel sera remplacé par cette version. Cette action est irréversible."
        confirmLabel="Restaurer"
        loading={confirm ? !!busy[`restore-${confirm.id}`] : false}
        onConfirm={() => confirm && doRestore(confirm.id, confirm.label)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

// ─── Onglet : Export ──────────────────────────────────────────────────────────

const EXPORT_FORMATS = [
  { key: "PDF",  icon: "download", title: "PDF",  desc: "Document formaté avec mise en page professionnelle, couverture et table des matières.", color: "var(--terracotta)" },
  { key: "EPUB", icon: "book",     title: "EPUB", desc: "Format e-book pour Kindle, Kobo, Apple Books et toutes les liseuses numériques.", color: "var(--moss)" },
  { key: "DOCX", icon: "edit",     title: "DOCX", desc: "Fichier Word éditable, parfait pour la correction et le travail collaboratif hors ligne.", color: "var(--indigo)" },
];

function ExportTab({ book, exports, setExports, toast }) {
  const [busy, setBusy] = useState({});

  const set = (k, v) => setBusy(p => ({ ...p, [k]: v }));

  const requestExport = async (format) => {
    set(`gen-${format}`, true);
    try {
      const res = await bookApi.requestExport(book.id, { format });
      const exp = res.export || res;
      setExports(prev => [exp, ...(prev || [])]);
      toast.success(`Export ${format} lancé ! Il sera disponible dans quelques minutes.`);
    } catch (e) { toast.error(e.message); }
    finally { set(`gen-${format}`, false); }
  };

  const lastByFormat = (fmt) => exports?.find(e => e.format === fmt);

  return (
    <div className="fade-up">
      {/* Cartes de format */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {EXPORT_FORMATS.map(f => {
          const last = lastByFormat(f.key);
          const isReady = last?.status === 'COMPLETED' || last?.status === 'DONE';
          const isPending = last?.status === 'PENDING' || last?.status === 'PROCESSING';
          return (
            <div key={f.key} className="card card-padded" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "var(--r-sm)", background: f.color + "22", color: f.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={f.icon} size={18} color={f.color} />
                </div>
                <div>
                  <div className="display" style={{ fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>{f.title}</div>
                  {last && (
                    <span className={`badge badge-${isReady ? "moss" : isPending ? "ochre" : "neutral"}`} style={{ fontSize: 10.5 }}>
                      {isReady ? "Prêt" : isPending ? "En cours…" : "Échec"}
                    </span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>{f.desc}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {isReady && last?.downloadUrl && (
                  <a href={last.downloadUrl} download className="btn btn-primary btn-sm" style={{ flex: 1, textDecoration: "none", justifyContent: "center" }}>
                    <Icon name="download" size={13} /> Télécharger
                  </a>
                )}
                <button className="btn btn-secondary btn-sm" style={{ flex: isReady ? 0 : 1 }}
                  onClick={() => requestExport(f.key)}
                  disabled={busy[`gen-${f.key}`] || isPending}>
                  {busy[`gen-${f.key}`] || isPending
                    ? <><Spinner size={13} /> {isPending ? "En cours…" : "Génération…"}</>
                    : <><Icon name="sparkle" size={13} /> {last ? "Re-générer" : "Générer"}</>}
                </button>
              </div>
              {last && <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Dernière génération : {fmtDate(last.createdAt)}</p>}
            </div>
          );
        })}
      </div>

      {/* Historique des exports */}
      {exports?.length > 0 && (
        <div>
          <h3 className="display" style={{ fontSize: 16, color: "var(--ink)", marginBottom: 12 }}>Historique des exports</h3>
          <div className="card" style={{ padding: 0 }}>
            {exports.map((e, i) => {
              const isReady = e.status === 'COMPLETED' || e.status === 'DONE';
              const isPending = e.status === 'PENDING' || e.status === 'PROCESSING';
              return (
                <div key={e.id || i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderBottom: i < exports.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--bg-soft)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600 }}>
                    {e.format}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{e.format} — {book.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{fmtDate(e.createdAt)}{e.fileSizeBytes && ` · ${(e.fileSizeBytes / 1024).toFixed(0)} Ko`}</div>
                  </div>
                  <span className={`badge badge-${isReady ? "moss" : isPending ? "ochre" : "terracotta"}`}>
                    {isReady ? "Prêt" : isPending ? <><Spinner size={11} /> En cours</> : "Échec"}
                  </span>
                  {isReady && e.downloadUrl && (
                    <a href={e.downloadUrl} download className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                      <Icon name="download" size={13} /> DL
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(!exports || exports.length === 0) && (
        <div className="card empty" style={{ marginTop: 8 }}>
          <div className="empty-icon"><Icon name="download" size={24} /></div>
          <div className="display" style={{ fontSize: 17 }}>Aucun export</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Générez votre premier export pour distribuer votre manuscrit.</p>
        </div>
      )}
    </div>
  );
}

// ─── Onglet : Protection ──────────────────────────────────────────────────────

function ProtectTab({ anchor, navigate }) {
  if (anchor) {
    return (
      <div className="fade-up">
        <div className="card card-padded" style={{ background: "linear-gradient(135deg, var(--moss-bg) 0%, var(--bg-paper) 100%)", borderColor: "var(--moss-bg)", maxWidth: 640 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--moss)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
              <Icon name="shield" size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="display" style={{ fontSize: 18, color: "var(--ink)" }}>Manuscrit ancré sur la blockchain</h3>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>Confirmé le {fmtDate(anchor.anchoredAt)} sur {anchor.network}</p>
            </div>
            <span className="badge badge-moss">Confirmé</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", padding: "16px 20px", background: "var(--bg-paper)", borderRadius: "var(--r-md)", fontSize: 12.5, fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>Hash :</span>
            <span style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{anchor.contentHash?.substring(0, 36)}…</span>
            <span style={{ color: "var(--text-muted)" }}>Transaction :</span>
            <span style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{anchor.txHash?.substring(0, 36)}…</span>
            <span style={{ color: "var(--text-muted)" }}>Réseau :</span>
            <span style={{ color: "var(--ink)", textTransform: "capitalize" }}>{anchor.network}</span>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }}>
            <Icon name="link" size={13} /> Voir sur l'explorateur blockchain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="card card-padded" style={{ maxWidth: 540 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon name="shield" size={24} color="var(--text-secondary)" />
        </div>
        <h3 className="display" style={{ fontSize: 20, color: "var(--ink)", marginBottom: 8 }}>Protégez votre manuscrit</h3>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
          L'ancrage blockchain crée une preuve cryptographique inaltérable de l'existence et de la paternité de votre œuvre à une date précise.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {[
            { icon: "shield",  title: "Preuve d'antériorité", desc: "Votre œuvre est horodatée publiquement sur la blockchain." },
            { icon: "lock",    title: "Hash chiffré SHA-256", desc: "Aucune donnée privée n'est exposée — seulement une empreinte." },
            { icon: "globe",   title: "Vérifiable par tous", desc: "N'importe qui peut vérifier l'authenticité depuis l'explorateur blockchain." },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: "var(--moss-bg)", color: "var(--moss-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={f.icon} size={14} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{f.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-accent" onClick={() => navigate("blockchain")}>
          <Icon name="shield" size={14} /> Ancrer ce manuscrit
        </button>
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function InviteModal({ open, onClose, bookId, onAdded, toast }) {
  const [form, setForm]   = useState({ email: "", role: "READER", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.email.trim()) return;
    setLoading(true);
    try {
      const res = await bookApi.inviteCollaborator(bookId, form);
      onAdded(res.collaboration || res);
      setForm({ email: "", role: "READER", message: "" });
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Inviter un collaborateur" subtitle="Cette personne recevra un email d'invitation.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field-group">
          <label className="field-label">Email *</label>
          <div className="input-with-icon">
            <Icon name="mail" size={16} />
            <input className="input" type="email" placeholder="ami@example.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
        <div className="field-group">
          <label className="field-label">Rôle</label>
          <select className="select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="READER">Lecteur — peut seulement lire</option>
            <option value="COMMENTER">Commentateur — peut suggérer des modifications</option>
            <option value="EDITOR">Éditeur — peut modifier le contenu</option>
            <option value="ADMIN">Administrateur — contrôle total</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Message personnalisé (optionnel)</label>
          <textarea className="textarea" rows={3} style={{ minHeight: 80 }}
            placeholder="Bonjour, j'aimerais que tu m'aides avec mon manuscrit…"
            value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary btn-block" onClick={submit} disabled={loading || !form.email.trim()}>
            {loading ? <Spinner size={14} /> : <><Icon name="send" size={14} /> Envoyer l'invitation</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateVersionModal({ open, onClose, bookId, onCreated, toast }) {
  const [label, setLabel]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await bookApi.createVersion(bookId, { label: label.trim() || undefined });
      onCreated(res.version || res);
      setLabel("");
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Créer une sauvegarde" subtitle="Capturez l'état actuel du manuscrit.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field-group">
          <label className="field-label">Label de la sauvegarde (optionnel)</label>
          <input className="input" placeholder="Ex : Avant la relecture finale…"
            value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Si laissé vide, la date sera utilisée comme label.</p>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary btn-block" onClick={submit} disabled={loading}>
            {loading ? <Spinner size={14} /> : <><Icon name="bookmark" size={14} /> Créer la sauvegarde</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AddChapterModal({ open, onClose, bookId, nextPosition, onAdded, toast }) {
  const [title, setTitle]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await bookApi.createChapter(bookId, { title: title.trim(), position: nextPosition });
      onAdded(res.chapter || res);
      setTitle("");
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouveau chapitre" subtitle="Ajoutez un nouveau chapitre à votre manuscrit.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field-group">
          <label className="field-label">Titre du chapitre *</label>
          <input className="input" placeholder="Ex : Le retour au village…"
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary btn-block" onClick={submit} disabled={loading || !title.trim()}>
            {loading ? <Spinner size={14} /> : <><Icon name="plus" size={14} /> Créer le chapitre</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditBookModal({ open, onClose, book, setBook, toast }) {
  const [form, setForm] = useState({
    title: book?.title || "", subtitle: book?.subtitle || "",
    description: book?.description || "", genre: book?.genre || "AUTOBIOGRAPHY",
    language: book?.language || "fr", visibility: book?.visibility || "PRIVATE",
    targetWordCount: book?.targetWordCount || 50000,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) setForm({
      title: book.title || "", subtitle: book.subtitle || "",
      description: book.description || "", genre: book.genre || "AUTOBIOGRAPHY",
      language: book.language || "fr", visibility: book.visibility || "PRIVATE",
      targetWordCount: book.targetWordCount || 50000,
    });
  }, [book?.id]); // eslint-disable-line

  const sf = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const payload = { ...form, targetWordCount: Number(form.targetWordCount) };
      await bookApi.update(book.id, payload);
      setBook(p => ({ ...p, ...payload }));
      toast.success('Manuscrit mis à jour.');
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Modifier le manuscrit" subtitle="Mettez à jour les informations de votre œuvre." size="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field-group">
          <label className="field-label">Titre *</label>
          <input className="input" placeholder="Titre du manuscrit" value={form.title} onChange={sf("title")} autoFocus />
        </div>
        <div className="field-group">
          <label className="field-label">Sous-titre</label>
          <input className="input" placeholder="Sous-titre (optionnel)" value={form.subtitle} onChange={sf("subtitle")} />
        </div>
        <div className="field-group">
          <label className="field-label">Description</label>
          <textarea className="textarea" rows={3} style={{ minHeight: 80 }}
            placeholder="Résumé ou description courte…"
            value={form.description} onChange={sf("description")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field-group">
            <label className="field-label">Genre</label>
            <select className="select" value={form.genre} onChange={sf("genre")}>
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
            <select className="select" value={form.language} onChange={sf("language")}>
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
            <input className="input" type="number" min={0} value={form.targetWordCount} onChange={sf("targetWordCount")} />
          </div>
          <div className="field-group">
            <label className="field-label">Visibilité</label>
            <select className="select" value={form.visibility} onChange={sf("visibility")}>
              <option value="PRIVATE">Privé</option>
              <option value="RESTRICTED">Lien sécurisé</option>
              <option value="PUBLIC">Public</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="btn btn-primary btn-block" onClick={submit} disabled={loading || !form.title.trim()}>
            {loading ? <Spinner size={14} /> : <><Icon name="check" size={14} /> Enregistrer</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ open, title, description, confirmLabel = "Confirmer", danger = false, loading = false, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{description}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Annuler</button>
          <button className={`btn btn-block ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={loading}
            style={danger ? { background: "var(--terracotta)", color: "white", borderColor: "var(--terracotta)" } : {}}>
            {loading ? <Spinner size={14} /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
