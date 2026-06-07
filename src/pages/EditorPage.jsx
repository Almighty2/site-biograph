import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Icon } from "../components/Icon";
import { Spinner } from "../components/Shared";
import { useToast } from "../components/Toast";
import { bookApi } from "../utils/api";

// ─── CSS éditeur (injecté une seule fois) ─────────────────────────────────────

const EDITOR_CSS = `
.ProseMirror { outline: none; min-height: 100%; }
.ProseMirror > * + * { margin-top: 0.9em; }
.ProseMirror h1 { font-family: var(--font-display); font-size: 2em; font-weight: 700; line-height: 1.2; color: var(--ink); margin-top: 1.5em; margin-bottom: 0.4em; }
.ProseMirror h2 { font-family: var(--font-display); font-size: 1.5em; font-weight: 600; line-height: 1.3; color: var(--ink); margin-top: 1.3em; margin-bottom: 0.3em; }
.ProseMirror h3 { font-family: var(--font-display); font-size: 1.2em; font-weight: 600; line-height: 1.4; color: var(--ink); margin-top: 1.1em; margin-bottom: 0.2em; }
.ProseMirror p { line-height: 1.85; margin: 0; }
.ProseMirror p + p { margin-top: 0.9em; }
.ProseMirror blockquote { border-left: 3px solid var(--terracotta); padding-left: 1.2em; margin-left: 0; margin-right: 0; color: var(--text-secondary); font-style: italic; }
.ProseMirror code { background: var(--bg-soft); padding: 2px 7px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.875em; color: var(--terracotta-deep); }
.ProseMirror pre { background: var(--bg-soft); padding: 16px 20px; border-radius: var(--r-md); overflow-x: auto; margin: 1em 0; }
.ProseMirror pre code { background: none; padding: 0; color: var(--ink); font-size: 0.9em; }
.ProseMirror ul, .ProseMirror ol { padding-left: 1.75em; }
.ProseMirror li { line-height: 1.75; }
.ProseMirror li + li { margin-top: 0.3em; }
.ProseMirror mark { background: rgba(201,151,74,0.28); border-radius: 2px; padding: 0 2px; }
.ProseMirror hr { border: none; border-top: 2px solid var(--border-soft); margin: 2em 0; }
.ProseMirror a { color: var(--indigo); text-decoration: underline; cursor: pointer; }
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--text-faint); pointer-events: none; float: left; height: 0; font-style: italic;
}
`;
let _cssInjected = false;
function injectCSS() {
  if (_cssInjected) return;
  const el = document.createElement('style');
  el.dataset.id = 'biograf-editor';
  el.textContent = EDITOR_CSS;
  document.head.appendChild(el);
  _cssInjected = true;
}

// ─── Composants toolbar ───────────────────────────────────────────────────────

function TBtn({ active, disabled, title, onClick, children, wide }) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      style={{
        minWidth: wide ? "auto" : 30, height: 30, padding: wide ? "0 10px" : 0,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        borderRadius: "var(--r-sm)", border: "none",
        cursor: disabled ? "default" : "pointer",
        background: active ? "var(--terracotta-bg)" : "transparent",
        color: active ? "var(--terracotta-deep)" : disabled ? "var(--text-faint)" : "var(--text-secondary)",
        fontSize: 12, fontWeight: 600, transition: "all 0.12s",
      }}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = "var(--bg-soft)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: "var(--border-soft)", margin: "0 3px", flexShrink: 0 }} />;
}

const IC = {
  bold:         <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 010 8H6zm0 8h9a4 4 0 010 8H6z"/></svg>,
  italic:       <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.49 4H16L8.51 20H4z"/></svg>,
  underline:    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 21h16v-2H4v2zm8-4a7 7 0 007-7V3h-2.5v7a4.5 4.5 0 01-9 0V3H5v7a7 7 0 007 7z"/></svg>,
  strike:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  highlight:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3h6l4 4-7 7H6L2 10z"/><path d="M6 14l-4 7"/></svg>,
  alignLeft:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
  alignCenter:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  alignRight:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>,
  alignJustify: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  bulletList:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>,
  orderedList:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/></svg>,
  blockquote:   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>,
  code:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  hr:           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="7" x2="8" y2="7"/><line x1="16" y1="7" x2="21" y2="7"/></svg>,
  undo:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>,
  redo:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/></svg>,
};

// ─── Page principale ──────────────────────────────────────────────────────────

export default function EditorPage({ book, initialChapterId, navigate }) {
  const { toast } = useToast();

  // Données
  const [chapters, setChapters]               = useState([]);
  const [loadingChapters, setLoadingChapters]  = useState(true);

  // Navigation active
  const [activeChapter, setActiveChapter]      = useState(null);
  const [activeSubChapter, setActiveSubChapter] = useState(null);

  // Sidebar UI
  const [expandedIds, setExpandedIds]          = useState({});   // chapterId → bool
  const [addingSubFor, setAddingSubFor]         = useState(null); // chapterId en cours d'ajout
  const [newSubTitle, setNewSubTitle]           = useState("");
  const [showAddChapter, setShowAddChapter]     = useState(false);
  const [newChapterTitle, setNewChapterTitle]   = useState("");
  const [addingChapter, setAddingChapter]       = useState(false);

  // Sauvegarde
  const [saving, setSaving]                    = useState(false);
  const [savedAt, setSavedAt]                  = useState(null);

  // IA
  const [showAI, setShowAI]                    = useState(false);
  const [aiPrompt, setAiPrompt]                = useState("");

  const saveTimerRef = useRef(null);
  const settingRef   = useRef(false);

  injectCSS();

  // ── Éditeur Tiptap ────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
      CharacterCount,
      Placeholder.configure({ placeholder: 'Commencez à écrire ici…' }),
      Typography,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (settingRef.current) return;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => doSave(editor.getHTML(), false), 1800);
    },
  });

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    console.log('book?.id ', book?.id);
    if (!book?.id) return;
    setLoadingChapters(true);
    bookApi.getById(book.id)
      .then(res => {
         console.log("API book response:", res); // ← à supprimer après
        const b = res.data || res.book || res;
        const chs = [...(b.chapters || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setChapters(chs);
        const target = initialChapterId 
          ? (chs.find(c => c.id === initialChapterId) ?? chs[0]) 
          : chs[0];
        if (target) {
          setActiveChapter(target);
          setExpandedIds({ [target.id]: true });
        }
      })
      .catch(() => setChapters([]))
      .finally(() => setLoadingChapters(false));
  }, [book?.id]); // eslint-disable-line

  // ── Sync contenu éditeur ──────────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const target = activeSubChapter ?? activeChapter;
    if (!target) return;
    settingRef.current = true;
    editor.commands.setContent(target.content || '');
    editor.commands.focus('start');
    setSavedAt(null);
    setTimeout(() => { settingRef.current = false; }, 150);
  }, [activeChapter?.id, activeSubChapter?.id, editor]); // eslint-disable-line

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const doSave = useCallback(async (html, manual) => {
    if (!book?.id || !activeChapter?.id) return;
    setSaving(true);
    try {
      const wc = editor?.storage.characterCount?.words() ?? 0;
      if (activeSubChapter?.id) {
        await bookApi.updateSubChapter(book.id, activeChapter.id, activeSubChapter.id, { content: html });
        setChapters(prev => prev.map(c =>
          c.id === activeChapter.id
            ? { ...c, subChapters: (c.subChapters || []).map(s => s.id === activeSubChapter.id ? { ...s, content: html, wordCount: wc } : s) }
            : c
        ));
      } else {
        await bookApi.updateChapter(book.id, activeChapter.id, { content: html });
        setChapters(prev => prev.map(c => c.id === activeChapter.id ? { ...c, content: html, wordCount: wc } : c));
      }
      setSavedAt(new Date());
      if (manual) toast.success(activeSubChapter ? 'Sous-chapitre sauvegardé !' : 'Chapitre sauvegardé !');
    } catch (e) {
      if (manual) toast.error(e.message);
    } finally { setSaving(false); }
  }, [book?.id, activeChapter?.id, activeSubChapter?.id, editor, toast]); // eslint-disable-line

  const manualSave = () => {
    if (!editor || !activeChapter) return;
    clearTimeout(saveTimerRef.current);
    doSave(editor.getHTML(), true);
  };

  // ── Ajouter chapitre ──────────────────────────────────────────────────────
  const addChapter = async () => {
    if (!newChapterTitle.trim() || !book?.id) return;
    setAddingChapter(true);
    try {
      const res = await bookApi.createChapter(book.id, { title: newChapterTitle.trim(), position: chapters.length + 1 });
      const ch = res.chapter || res;
      setChapters(prev => [...prev, ch]);
      setActiveChapter(ch);
      setActiveSubChapter(null);
      setExpandedIds(p => ({ ...p, [ch.id]: true }));
      setNewChapterTitle('');
      setShowAddChapter(false);
      toast.success('Chapitre créé !');
    } catch (e) { toast.error(e.message); }
    finally { setAddingChapter(false); }
  };

  // ── Ajouter sous-chapitre ─────────────────────────────────────────────────
  const addSubChapter = async (chapterId) => {
    if (!newSubTitle.trim() || !book?.id) return;
    const chapter = chapters.find(c => c.id === chapterId);
    const position = (chapter?.subChapters?.length ?? 0) + 1;
    try {
      const res = await bookApi.createSubChapter(book.id, chapterId, { title: newSubTitle.trim(), position });
      const sub = res.subChapter || res;
      setChapters(prev => prev.map(c =>
        c.id === chapterId ? { ...c, subChapters: [...(c.subChapters || []), sub] } : c
      ));
      setActiveChapter(chapter);
      setActiveSubChapter(sub);
      setNewSubTitle('');
      setAddingSubFor(null);
      toast.success('Sous-chapitre créé !');
    } catch (e) { toast.error(e.message); }
  };

  const toggleExpand = (chId) => setExpandedIds(p => ({ ...p, [chId]: !p[chId] }));

  const selectChapter = (ch) => {
    setActiveChapter(ch);
    setActiveSubChapter(null);
    setExpandedIds(p => ({ ...p, [ch.id]: true }));
  };

  const selectSubChapter = (ch, sub) => {
    setActiveChapter(ch);
    setActiveSubChapter(sub);
  };

  // ── Stats toolbar ─────────────────────────────────────────────────────────
  const words = editor?.storage.characterCount?.words() ?? 0;
  const chars = editor?.storage.characterCount?.characters() ?? 0;
  const fmtSaved = savedAt ? savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
  const headingValue =
    editor?.isActive('heading', { level: 1 }) ? 'h1'
    : editor?.isActive('heading', { level: 2 }) ? 'h2'
    : editor?.isActive('heading', { level: 3 }) ? 'h3'
    : 'p';

  if (!book) return null;

  return (
    <div>
      {/* Fil d'Ariane */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        <button onClick={() => navigate("books")} style={{ color: "var(--text-secondary)" }}>Manuscrits</button>
        <Icon name="chevron-r" size={12} />
        <button onClick={() => navigate("book-detail")} style={{ color: "var(--text-secondary)" }}>{book.title}</button>
        <Icon name="chevron-r" size={12} />
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>Éditeur</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, height: "calc(100vh - 140px)" }}>

        {/* ════════════════ SIDEBAR ════════════════ */}
        <div className="card fade-up" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* En-tête sidebar */}
          <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="display" style={{ fontSize: 13.5, color: "var(--ink)" }}>Structure</h3>
            <button className="icon-btn" style={{ width: 26, height: 26 }} title="Nouveau chapitre"
              onClick={() => { setShowAddChapter(v => !v); setNewChapterTitle(''); }}>
              <Icon name="plus" size={13} />
            </button>
          </div>

          {/* Ajout chapitre */}
          {showAddChapter && (
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-soft)", animation: "fadeUp 0.18s var(--ease)" }}>
              <input className="input" placeholder="Titre du chapitre…" autoFocus
                value={newChapterTitle}
                onChange={e => setNewChapterTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addChapter(); if (e.key === 'Escape') setShowAddChapter(false); }}
                style={{ height: 32, fontSize: 12.5, marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-primary btn-sm btn-block" onClick={addChapter} disabled={addingChapter || !newChapterTitle.trim()}>
                  {addingChapter ? <Spinner size={12} /> : <><Icon name="plus" size={12} /> Créer</>}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddChapter(false)}><Icon name="x" size={12} /></button>
              </div>
            </div>
          )}

          {/* Arbre chapitres / sous-chapitres */}
          <div style={{ flex: 1, overflow: "auto", padding: "6px 4px" }}>
            {loadingChapters ? (
              [1,2,3].map(i => (
                <div key={i} style={{ height: 44, borderRadius: "var(--r-sm)", background: "var(--bg-soft)", marginBottom: 4, animation: "pulse 1.4s ease infinite" }} />
              ))
            ) : chapters.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--text-muted)" }}>
                <Icon name="book" size={20} />
                <p style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5 }}>Aucun chapitre.<br/>Créez-en un pour commencer.</p>
              </div>
            ) : chapters.map(ch => {
              const subs = ch.subChapters || [];
              const isActiveChapter = activeChapter?.id === ch.id && !activeSubChapter;
              const isExpanded = !!expandedIds[ch.id];
              const done = ch.isComplete || ch.completionStatus === 'COMPLETE';

              return (
                <div key={ch.id} style={{ marginBottom: 2 }}>
                  {/* ─ Ligne chapitre ─ */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "1px 4px" }}>
                    {/* Toggle expand */}
                    <button
                      onClick={() => toggleExpand(ch.id)}
                      style={{
                        width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 3, border: "none", background: "transparent", cursor: "pointer",
                        color: "var(--text-faint)", flexShrink: 0, padding: 0,
                        opacity: subs.length > 0 ? 1 : 0.2,
                      }}>
                      <div style={{ transform: isExpanded ? "none" : "rotate(-90deg)", transition: "transform 0.15s" }}>
                        <Icon name="chevron-d" size={11} />
                      </div>
                    </button>

                    {/* Bouton chapitre */}
                    <button
                      onClick={() => selectChapter(ch)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
                        borderRadius: "var(--r-sm)", textAlign: "left", border: "none",
                        background: isActiveChapter ? "var(--terracotta-bg)" : "transparent",
                        cursor: "pointer", transition: "background 0.12s",
                      }}
                      onMouseEnter={e => { if (!isActiveChapter) e.currentTarget.style.background = "var(--bg-soft)"; }}
                      onMouseLeave={e => { if (!isActiveChapter) e.currentTarget.style.background = "transparent"; }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: done ? "var(--moss-bg)" : isActiveChapter ? "var(--terracotta)" : "var(--bg-soft)",
                        color: done ? "var(--moss-deep)" : isActiveChapter ? "white" : "var(--text-muted)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 600,
                      }}>
                        {done ? <Icon name="check" size={9} /> : ch.position}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12.5, fontWeight: isActiveChapter ? 600 : 400,
                          color: isActiveChapter ? "var(--terracotta-deep)" : "var(--ink)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {ch.title}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {(ch.wordCount ?? 0) > 0 ? `${ch.wordCount.toLocaleString('fr-FR')} mots` : "Vide"}
                          {subs.length > 0 && ` · ${subs.length} sous-ch.`}
                        </div>
                      </div>
                    </button>

                    {/* + sous-chapitre */}
                    <button
                      title="Ajouter un sous-chapitre"
                      onClick={() => { setAddingSubFor(ch.id); setNewSubTitle(''); setExpandedIds(p => ({ ...p, [ch.id]: true })); }}
                      style={{
                        width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 3, border: "none", background: "transparent", cursor: "pointer",
                        color: "var(--text-faint)", flexShrink: 0, padding: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = "var(--terracotta)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "var(--text-faint)"; }}>
                      <Icon name="plus" size={11} />
                    </button>
                  </div>

                  {/* ─ Sous-chapitres ─ */}
                  {isExpanded && (
                    <div style={{ paddingLeft: 28 }}>
                      {subs.map(sub => {
                        const isActiveSub = activeSubChapter?.id === sub.id;
                        return (
                          <button key={sub.id}
                            onClick={() => selectSubChapter(ch, sub)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 8,
                              padding: "6px 8px", borderRadius: "var(--r-sm)", textAlign: "left",
                              border: "none", cursor: "pointer",
                              background: isActiveSub ? "var(--indigo-bg)" : "transparent",
                              transition: "background 0.12s", marginBottom: 1,
                            }}
                            onMouseEnter={e => { if (!isActiveSub) e.currentTarget.style.background = "var(--bg-soft)"; }}
                            onMouseLeave={e => { if (!isActiveSub) e.currentTarget.style.background = "transparent"; }}>
                            <div style={{
                              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                              background: isActiveSub ? "var(--indigo)" : "var(--border-medium)",
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 12, fontWeight: isActiveSub ? 600 : 400,
                                color: isActiveSub ? "var(--indigo)" : "var(--text-secondary)",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {sub.title}
                              </div>
                              {(sub.wordCount ?? 0) > 0 && (
                                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                  {sub.wordCount.toLocaleString('fr-FR')} mots
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {/* Ajout sous-chapitre inline */}
                      {addingSubFor === ch.id ? (
                        <div style={{ padding: "6px 4px", animation: "fadeUp 0.15s var(--ease)" }}>
                          <input className="input" placeholder="Titre du sous-chapitre…" autoFocus
                            value={newSubTitle}
                            onChange={e => setNewSubTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') addSubChapter(ch.id);
                              if (e.key === 'Escape') setAddingSubFor(null);
                            }}
                            style={{ height: 30, fontSize: 12, marginBottom: 5 }} />
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="btn btn-primary btn-sm btn-block"
                              onClick={() => addSubChapter(ch.id)}
                              disabled={!newSubTitle.trim()}>
                              <Icon name="plus" size={11} /> Créer
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setAddingSubFor(null)}>
                              <Icon name="x" size={11} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingSubFor(ch.id); setNewSubTitle(''); }}
                          style={{
                            width: "100%", padding: "5px 8px", fontSize: 11,
                            color: "var(--text-faint)", background: "transparent", border: "none",
                            cursor: "pointer", textAlign: "left", borderRadius: "var(--r-sm)",
                            display: "flex", alignItems: "center", gap: 5,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "var(--terracotta)"; e.currentTarget.style.background = "var(--bg-soft)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.background = "transparent"; }}>
                          <Icon name="plus" size={10} /> Ajouter un sous-chapitre
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progression */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-soft)" }}>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Progression livre</div>
            <div className="progress" style={{ height: 4 }}>
              <div className="progress-bar" style={{ width: `${book.progressPct ?? 0}%` }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span>{(book.wordCount ?? 0).toLocaleString('fr-FR')} mots</span>
              <span>{book.progressPct ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* ════════════════ ZONE D'ÉCRITURE ════════════════ */}
        <div className="card fade-up" data-stagger="1" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ── Toolbar ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 3, padding: "7px 14px",
            borderBottom: "1px solid var(--border-soft)", flexWrap: "wrap",
            background: "var(--bg-paper)", flexShrink: 0,
          }}>
            <TBtn title="Annuler (Ctrl+Z)" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>{IC.undo}</TBtn>
            <TBtn title="Rétablir (Ctrl+Y)" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>{IC.redo}</TBtn>
            <Sep />

            <select value={headingValue}
              onChange={e => {
                const v = e.target.value;
                if (v === 'p') editor?.chain().focus().setParagraph().run();
                else editor?.chain().focus().setHeading({ level: parseInt(v[1]) }).run();
              }}
              style={{ height: 30, padding: "0 8px", fontSize: 12, cursor: "pointer", border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)", background: "var(--bg-paper)", color: "var(--ink)", minWidth: 116, fontFamily: "var(--font-display)" }}>
              <option value="p">Paragraphe</option>
              <option value="h1">Titre 1</option>
              <option value="h2">Titre 2</option>
              <option value="h3">Titre 3</option>
            </select>
            <Sep />

            <TBtn title="Gras (Ctrl+B)" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}>{IC.bold}</TBtn>
            <TBtn title="Italique (Ctrl+I)" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}>{IC.italic}</TBtn>
            <TBtn title="Souligné (Ctrl+U)" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}>{IC.underline}</TBtn>
            <TBtn title="Barré" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}>{IC.strike}</TBtn>
            <TBtn title="Surligner" active={editor?.isActive('highlight')} onClick={() => editor?.chain().focus().toggleHighlight().run()}>{IC.highlight}</TBtn>
            <Sep />

            <TBtn title="Gauche" active={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain().focus().setTextAlign('left').run()}>{IC.alignLeft}</TBtn>
            <TBtn title="Centre" active={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()}>{IC.alignCenter}</TBtn>
            <TBtn title="Droite" active={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain().focus().setTextAlign('right').run()}>{IC.alignRight}</TBtn>
            <TBtn title="Justifier" active={editor?.isActive({ textAlign: 'justify' })} onClick={() => editor?.chain().focus().setTextAlign('justify').run()}>{IC.alignJustify}</TBtn>
            <Sep />

            <TBtn title="Liste à puces" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}>{IC.bulletList}</TBtn>
            <TBtn title="Liste numérotée" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>{IC.orderedList}</TBtn>
            <TBtn title="Citation" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>{IC.blockquote}</TBtn>
            <TBtn title="Code" active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>{IC.code}</TBtn>
            <TBtn title="Séparateur" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>{IC.hr}</TBtn>
            <Sep />

            <TBtn title="Assistant IA" active={showAI} onClick={() => setShowAI(v => !v)} wide>
              <Icon name="sparkle" size={13} /> IA
            </TBtn>

            {/* Stats + Save */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--ink)" }}>{words.toLocaleString('fr-FR')}</strong> mots
                <span style={{ marginLeft: 8, opacity: 0.55 }}>{chars.toLocaleString('fr-FR')} car.</span>
              </div>
              <div style={{ fontSize: 11, minWidth: 114, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, color: saving ? "var(--ochre)" : "var(--moss)" }}>
                {saving ? <><Spinner size={11} /> Sauvegarde…</> : fmtSaved ? `✓ ${fmtSaved}` : ""}
              </div>
              <button className="btn btn-primary btn-sm" onClick={manualSave} disabled={saving || !activeChapter}>
                {saving ? <Spinner size={13} /> : <><Icon name="check" size={13} /> Sauvegarder</>}
              </button>
            </div>
          </div>

          {/* ── En-tête section active ── */}
          <div style={{ padding: "16px 52px 12px", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
            {activeChapter ? (
              <>
                {/* Fil chapitres */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                  <span
                    onClick={() => selectChapter(activeChapter)}
                    style={{ cursor: activeSubChapter ? "pointer" : "default", color: activeSubChapter ? "var(--text-secondary)" : "var(--text-muted)" }}>
                    Chapitre {activeChapter.position} — {activeChapter.title}
                  </span>
                  {activeSubChapter && (
                    <>
                      <Icon name="chevron-r" size={10} />
                      <span style={{ color: "var(--indigo)", fontWeight: 500 }}>{activeSubChapter.title}</span>
                    </>
                  )}
                </div>

                {/* Titre principal */}
                <h2 className="display" style={{ fontSize: 22, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {activeSubChapter ? activeSubChapter.title : activeChapter.title}
                </h2>

                {/* Badge sous-chapitre */}
                {activeSubChapter && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, background: "var(--indigo-bg)", color: "var(--indigo)", padding: "2px 8px", borderRadius: "var(--r-sm)", fontWeight: 500 }}>
                      Sous-chapitre
                    </span>
                    <button
                      onClick={() => selectChapter(activeChapter)}
                      style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                      ← Revenir au chapitre
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 14, color: "var(--text-muted)", fontStyle: "italic" }}>
                {loadingChapters ? "Chargement…" : "Sélectionnez un chapitre ou sous-chapitre pour écrire."}
              </div>
            )}
          </div>

          {/* ── Zone Tiptap ── */}
          <div style={{ flex: 1, overflow: "auto", cursor: "text" }}
            onClick={() => editor?.commands.focus()}>
            <div style={{ padding: "16px 52px 80px", minHeight: "100%", fontFamily: "var(--font-display)", fontSize: 17, lineHeight: 1.85, color: "var(--ink)" }}>
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* ── Panneau IA ── */}
          {showAI && (
            <div style={{
              borderTop: "1px solid var(--border-soft)", padding: "12px 20px", flexShrink: 0,
              background: "linear-gradient(0deg, var(--bg-paper) 0%, var(--ochre-bg) 100%)",
              animation: "fadeUp 0.22s var(--ease) both",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--ochre)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <Icon name="sparkle" size={12} /> Assistant Biograf IA
                </div>
                <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setShowAI(false)}>
                  <Icon name="x" size={12} />
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 9 }}>
                {["Continuer le texte", "Améliorer le style", "Ajouter une transition", "Reformuler", "Résumer ce passage", "Corriger la ponctuation"].map(p => (
                  <button key={p} className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setAiPrompt(p)}>{p}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" placeholder="Demandez quelque chose à l'IA…"
                  value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setShowAI(false)}
                  style={{ flex: 1 }} />
                <button className="btn btn-accent btn-sm"><Icon name="send" size={13} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
