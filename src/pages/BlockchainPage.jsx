import { useState, useEffect, useCallback } from "react";
import { Icon } from "../components/Icon";
import { Modal, Spinner, EmptyState } from "../components/Shared";
import { useToast } from "../components/Toast";
import { blockchainApi, bookApi } from "../utils/api";

// ─── Config réseaux ────────────────────────────────────────────────────────
const NETWORKS = [
  { value: "BITCOIN_OTS", label: "Bitcoin OTS",  desc: "Gratuit · via OpenTimestamps · 6-24h" },
  { value: "POLYGON",     label: "Polygon",      desc: "Rapide · Très bas coût · ~5s" },
  { value: "ETHEREUM",    label: "Ethereum",     desc: "Premium · Haute sécurité · ~2min" },
  { value: "BSC",         label: "BSC",          desc: "Économique · ~10s" },
  { value: "TEZOS",       label: "Tezos",        desc: "Écologique · ~30s" },
];

// ─── Statut d'un ancrage ──────────────────────────────────────────────────
function anchorStatus(anchor) {
  if (anchor.errorMessage)  return { label: "Erreur",          color: "var(--terracotta)", bg: "var(--terracotta-bg)" };
  if (anchor.isConfirmed)   return { label: "Confirmé",        color: "var(--moss)",       bg: "var(--moss-bg)" };
  if (anchor.txHash)        return { label: "Soumis – en attente", color: "var(--ochre)", bg: "var(--ochre-bg)" };
  return                           { label: "En cours",        color: "var(--ochre)",      bg: "var(--ochre-bg)" };
}

function StatusChip({ anchor }) {
  const s = anchorStatus(anchor);
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
      color: s.color, background: s.bg, padding: "3px 8px", borderRadius: 999,
    }}>
      {s.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function truncateHash(hash, len = 18) {
  if (!hash || hash.length <= len * 2) return hash;
  return `${hash.slice(0, len)}…${hash.slice(-6)}`;
}

// ─── Skeleton card ─────────────────────────────────────────────────────────
function AnchorSkeleton() {
  return (
    <>
      {[1, 2].map(i => (
        <div key={i} className="card card-padded" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "var(--r-md)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 16, width: "55%", marginBottom: 8, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 12, width: "35%", borderRadius: 4 }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 56, borderRadius: "var(--r-md)", marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div className="skeleton" style={{ height: 30, width: 140, borderRadius: "var(--r-md)" }} />
            <div className="skeleton" style={{ height: 30, width: 150, borderRadius: "var(--r-md)" }} />
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function BlockchainPage() {
  const { toast } = useToast();

  const [anchors, setAnchors]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAnchor, setShowAnchor]   = useState(false);
  const [showVerify, setShowVerify]   = useState(false);
  const [verifyBookId, setVerifyBookId] = useState(null); // pré-sélection depuis une card

  // ── Charger les ancrages ────────────────────────────────────────────────
  const fetchAnchors = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await blockchainApi.listAnchors();
      setAnchors(res.data ?? []);
    } catch {
      toast.error("Impossible de charger les ancrages.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchAnchors(); }, []); // eslint-disable-line

  const confirmed   = anchors.filter(a => a.isConfirmed).length;
  const networkStar = anchors.length > 0 ? anchors[0].network : "BITCOIN_OTS";

  const handleAnchorCreated = (anchor) => {
    setAnchors(prev => [anchor, ...prev]);
    setShowAnchor(false);
    toast.success("Ancrage lancé — confirmation sous peu.");
  };

  const openVerify = (bookId = null) => {
    setVerifyBookId(bookId);
    setShowVerify(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Protection</div>
          <h1 className="page-title">Ancrage <em>blockchain</em></h1>
          <p className="page-subtitle">Preuve cryptographique d'antériorité de vos manuscrits.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => openVerify()}>
            <Icon name="check" size={14} /> Vérifier un livre
          </button>
          <button className="btn btn-accent btn-lg" onClick={() => setShowAnchor(true)}>
            <Icon name="shield" size={15} /> Ancrer un manuscrit
          </button>
        </div>
      </div>

      {/* Hero éducatif */}
      <div className="card card-padded fade-up" data-stagger="1" style={{
        background: "linear-gradient(135deg, var(--moss-bg) 0%, var(--bg-paper) 100%)",
        borderColor: "var(--moss-bg)", marginBottom: 28,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--moss)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="shield" size={36} />
          </div>
          <div>
            <h2 className="display" style={{ fontSize: 22, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Protégez votre œuvre pour l'éternité.
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 6, maxWidth: 680 }}>
              L'ancrage blockchain enregistre une empreinte cryptographique unique de votre manuscrit sur un registre public et inaltérable. Preuve d'existence horodatée, vérifiable par tous, que personne ne peut contester.
            </p>
            <div style={{ display: "flex", gap: 24, marginTop: 14, flexWrap: "wrap" }}>
              {[
                "Aucune donnée privée publiée",
                "Vérifiable par n'importe qui",
                "Inaltérable et permanent",
              ].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)" }}>
                  <Icon name="check" size={13} color="var(--moss)" /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3 fade-up" data-stagger="2" style={{ marginBottom: 28 }}>
        {[
          { label: "Livres ancrés",   value: loading ? "—" : anchors.length,   icon: "shield",  color: "moss" },
          { label: "Confirmations",   value: loading ? "—" : confirmed,          icon: "check",   color: "moss" },
          { label: "Réseau principal",value: loading ? "—" : (NETWORKS.find(n => n.value === networkStar)?.label ?? "—"), icon: "link", color: "indigo" },
        ].map((s, i) => (
          <div key={i} className="stat" style={{ animation: `fadeUp 0.4s ${i * 0.05}s var(--ease) both` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="stat-label">{s.label}</span>
              <Icon name={s.icon} size={14} color="var(--text-muted)" />
            </div>
            <div className="stat-value" style={{ marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Liste des ancrages */}
      <h2 className="display fade-up" data-stagger="3" style={{ fontSize: 20, color: "var(--ink)", marginBottom: 16 }}>
        Mes ancrages
      </h2>

      {loading ? (
        <AnchorSkeleton />
      ) : anchors.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon"><Icon name="shield" size={24} /></div>
          <div className="display" style={{ fontSize: 17 }}>Aucun manuscrit ancré</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Protégez votre premier manuscrit sur la blockchain.</p>
          <button className="btn btn-accent" onClick={() => setShowAnchor(true)}>
            <Icon name="shield" size={14} /> Ancrer un manuscrit
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {anchors.map((anchor, i) => (
            <AnchorCard
              key={anchor.id}
              anchor={anchor}
              index={i}
              onVerify={() => {
                const firstBook = anchor.books?.[0];
                if (firstBook) openVerify(firstBook.id);
              }}
              onRefresh={fetchAnchors}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnchorModal
        open={showAnchor}
        onClose={() => setShowAnchor(false)}
        onCreated={handleAnchorCreated}
        existingBookIds={anchors.flatMap(a => (a.books ?? []).map(b => b.id))}
      />
      <VerifyModal
        open={showVerify}
        onClose={() => setShowVerify(false)}
        anchors={anchors}
        initialBookId={verifyBookId}
      />
    </div>
  );
}

// ─── Carte ancrage ─────────────────────────────────────────────────────────
function AnchorCard({ anchor, index, onVerify, onRefresh }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState({});

  const s      = anchorStatus(anchor);
  const books  = anchor.books ?? [];
  const title  = books.map(b => b.title).join(" + ") || "Ancrage";
  const networkLabel = NETWORKS.find(n => n.value === anchor.network)?.label ?? anchor.network;

  const handleExplorer = () => {
    if (anchor.explorerUrl) window.open(anchor.explorerUrl, "_blank", "noopener");
  };

  const handleDetach = async (bookId) => {
    if (busy[`det_${bookId}`]) return;
    setBusy(p => ({ ...p, [`det_${bookId}`]: true }));
    try {
      await blockchainApi.detachBook(anchor.id, bookId);
      toast.success("Livre détaché de l'ancrage.");
      onRefresh();
    } catch (err) {
      toast.error(err.message ?? "Impossible de détacher ce livre.");
    } finally {
      setBusy(p => ({ ...p, [`det_${bookId}`]: false }));
    }
  };

  return (
    <div className="card card-padded fade-up" data-stagger={Math.min(index + 1, 6)}>
      {/* En-tête card */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "var(--r-md)", flexShrink: 0,
          background: anchor.isConfirmed ? "var(--moss-bg)" : "var(--ochre-bg)",
          color: anchor.isConfirmed ? "var(--moss)" : "var(--ochre)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="shield" size={22} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <h3 className="display" style={{ fontSize: 16, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
              {title}
            </h3>
            <StatusChip anchor={anchor} />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>Réseau : <strong>{networkLabel}</strong></span>
            {anchor.anchoredAt && <span>· Soumis le {formatDate(anchor.anchoredAt)}</span>}
            {anchor.confirmedAt && <span>· Confirmé le {formatDate(anchor.confirmedAt)}</span>}
            {anchor.bitcoinHeight && <span>· Bloc Bitcoin #{anchor.bitcoinHeight}</span>}
          </div>
        </div>
      </div>

      {/* Hashes */}
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px",
        padding: "12px 16px", background: "var(--bg-soft)", borderRadius: "var(--r-md)",
        fontSize: 12, fontFamily: "var(--font-mono)", marginBottom: 14,
      }}>
        <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>Hash contenu :</span>
        <span style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", title: anchor.contentHash }}>
          {truncateHash(anchor.contentHash)}
        </span>

        {anchor.txHash && anchor.txHash !== "pending-ots" && (<>
          <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>Transaction :</span>
          <span style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>
            {truncateHash(anchor.txHash)}
          </span>
        </>)}

        {anchor.txHash === "pending-ots" && (<>
          <span style={{ color: "var(--text-muted)" }}>Preuve OTS :</span>
          <span style={{ color: "var(--ochre)" }}>En attente de confirmation Bitcoin (6-24h)</span>
        </>)}

        {anchor.errorMessage && (<>
          <span style={{ color: "var(--text-muted)" }}>Erreur :</span>
          <span style={{ color: "var(--terracotta)" }}>{anchor.errorMessage}</span>
        </>)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {anchor.explorerUrl && (
          <button className="btn btn-secondary btn-sm" onClick={handleExplorer}>
            <Icon name="link" size={13} /> Voir sur l'explorateur
          </button>
        )}
        {books.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={onVerify}>
            <Icon name="check" size={13} /> Vérifier l'intégrité
          </button>
        )}
        {!anchor.isConfirmed && books.map(b => (
          <button
            key={b.id}
            className="btn btn-secondary btn-sm"
            onClick={() => handleDetach(b.id)}
            disabled={busy[`det_${b.id}`]}
            style={{ color: "var(--terracotta)" }}
          >
            {busy[`det_${b.id}`] ? <Spinner size={12} /> : <Icon name="x" size={13} />}
            Détacher {b.title}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Modal : Ancrer un manuscrit ───────────────────────────────────────────
function AnchorModal({ open, onClose, onCreated, existingBookIds }) {
  const { toast } = useToast();

  const [books, setBooks]       = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedId, setSelectedId]     = useState("");
  const [network, setNetwork]           = useState("BITCOIN_OTS");
  const [busy, setBusy]                 = useState(false);
  const [confirmed, setConfirmed]       = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedId("");
    setNetwork("BITCOIN_OTS");
    setConfirmed(false);
    (async () => {
      setLoadingBooks(true);
      try {
        const res = await bookApi.list();
        const all = res.data ?? res.books ?? (Array.isArray(res) ? res : []);
        // Exclure les livres déjà ancrés
        setBooks(all.filter(b => !b.blockchainAnchorId && !existingBookIds.includes(b.id)));
      } catch {
        toast.error("Impossible de charger la liste des livres.");
      } finally {
        setLoadingBooks(false);
      }
    })();
  }, [open]); // eslint-disable-line

  const handleSubmit = async () => {
    if (!selectedId || busy) return;
    setBusy(true);
    try {
      const res = await blockchainApi.createAnchor({ bookIds: [selectedId], network });
      const anchor = res.anchor ?? res;
      onCreated(anchor);
    } catch (err) {
      toast.error(err.message ?? "Impossible de lancer l'ancrage.");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = selectedId && confirmed && !busy;

  return (
    <Modal open={open} onClose={onClose} title="Ancrer un manuscrit" subtitle="Cette action est permanente et irréversible">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Sélection du livre */}
        <div className="field-group">
          <label className="field-label">Livre à protéger</label>
          {loadingBooks ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, fontSize: 13, color: "var(--text-muted)" }}>
              <Spinner size={14} /> Chargement des livres…
            </div>
          ) : books.length === 0 ? (
            <div style={{ padding: 12, fontSize: 13, color: "var(--text-muted)", background: "var(--bg-soft)", borderRadius: "var(--r-md)" }}>
              Tous vos livres sont déjà ancrés, ou vous n'avez pas encore de manuscrit.
            </div>
          ) : (
            <select className="select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              <option value="">Sélectionner un manuscrit…</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Sélection du réseau */}
        <div className="field-group">
          <label className="field-label">Réseau blockchain</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {NETWORKS.map(n => (
              <button
                key={n.value}
                onClick={() => setNetwork(n.value)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", textAlign: "left",
                  border: `2px solid ${network === n.value ? "var(--terracotta)" : "var(--border-soft)"}`,
                  borderRadius: "var(--r-md)",
                  background: network === n.value ? "var(--terracotta-bg)" : "var(--bg-paper)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    {n.label}
                    {n.value === "BITCOIN_OTS" && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: "var(--moss)", fontWeight: 500 }}>Recommandé</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{n.desc}</div>
                </div>
                {network === n.value && <Icon name="check" size={14} color="var(--terracotta)" />}
              </button>
            ))}
          </div>
        </div>

        {/* Avertissement */}
        <div style={{ padding: 14, background: "var(--ochre-bg)", borderRadius: "var(--r-md)", fontSize: 12.5, color: "var(--ochre)", display: "flex", gap: 8 }}>
          <Icon name="info" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Une fois ancré, le lien entre votre livre et la blockchain est <strong>permanent</strong>.
            Votre contenu n'est jamais envoyé — seule l'empreinte cryptographique (SHA-256) est enregistrée.
          </span>
        </div>

        {/* Confirmation explicite */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          Je comprends que cette action est irréversible et je souhaite ancrer ce manuscrit.
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-accent btn-block" onClick={handleSubmit} disabled={!canSubmit}>
            {busy
              ? <><Spinner size={14} /> Ancrage en cours…</>
              : <><Icon name="shield" size={14} /> Ancrer maintenant</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal : Vérifier l'intégrité ─────────────────────────────────────────
function VerifyModal({ open, onClose, anchors, initialBookId }) {
  const { toast } = useToast();

  // Construire la liste des livres depuis les ancrages
  const anchoredBooks = anchors.flatMap(a =>
    (a.books ?? []).map(b => ({ ...b, anchorId: a.id }))
  );

  const [bookId, setBookId]   = useState("");
  const [step, setStep]       = useState("select"); // select | loading | result
  const [result, setResult]   = useState(null);

  useEffect(() => {
    if (open) {
      setStep("select");
      setResult(null);
      setBookId(initialBookId ?? (anchoredBooks[0]?.id ?? ""));
    }
  }, [open, initialBookId]); // eslint-disable-line

  const handleVerify = async () => {
    if (!bookId) return;
    setStep("loading");
    try {
      const res = await blockchainApi.verifyIntegrity(bookId);
      setResult(res);
      setStep("result");
    } catch (err) {
      toast.error(err.message ?? "Erreur lors de la vérification.");
      setStep("select");
    }
  };

  const reset = () => { setStep("select"); setResult(null); onClose(); };

  return (
    <Modal open={open} onClose={reset} title="Vérifier l'intégrité" subtitle="Recalcule le hash et compare avec la blockchain">
      {step === "select" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field-group">
            <label className="field-label">Manuscrit à vérifier</label>
            {anchoredBooks.length === 0 ? (
              <div style={{ padding: 12, fontSize: 13, color: "var(--text-muted)", background: "var(--bg-soft)", borderRadius: "var(--r-md)" }}>
                Aucun livre ancré. Ancrez d'abord un manuscrit.
              </div>
            ) : (
              <select className="select" value={bookId} onChange={e => setBookId(e.target.value)}>
                <option value="">Sélectionner…</option>
                {anchoredBooks.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={reset}>Annuler</button>
            <button className="btn btn-primary btn-block" onClick={handleVerify} disabled={!bookId}>
              <Icon name="check" size={14} /> Lancer la vérification
            </button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="fade-up" style={{ textAlign: "center", padding: "40px 0" }}>
          <Spinner size={36} color="var(--terracotta)" />
          <div className="display" style={{ fontSize: 17, marginTop: 16 }}>Vérification en cours…</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
            Recalcul SHA-256 et comparaison avec la blockchain.
          </p>
        </div>
      )}

      {step === "result" && result && (
        <div className="fade-up">
          {!result.isAnchored ? (
            /* Pas d'ancrage */
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", background: "var(--ochre-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="info" size={28} color="var(--ochre)" />
              </div>
              <h3 className="display" style={{ fontSize: 20 }}>Livre non ancré</h3>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 6 }}>
                Ce livre n'a pas encore d'ancrage blockchain.
              </p>
            </div>
          ) : result.isIntact ? (
            /* Intégrité confirmée */
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", background: "var(--moss)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={32} color="white" />
              </div>
              <h3 className="display" style={{ fontSize: 22, marginBottom: 8 }}>Intégrité confirmée</h3>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 20 }}>
                Le contenu de <strong>{result.title}</strong> est intact depuis l'ancrage.
              </p>
              <div style={{ padding: "12px 16px", background: "var(--moss-bg)", borderRadius: "var(--r-md)", fontSize: 12, fontFamily: "var(--font-mono)", textAlign: "left", color: "var(--moss-deep)" }}>
                <div>✓ Hash local = hash blockchain</div>
                {result.isConfirmed && <div>✓ Transaction confirmée on-chain</div>}
                {result.bitcoinBlock && <div>✓ Bloc Bitcoin #{result.bitcoinBlock}</div>}
                {result.anchoredAt && <div>✓ Ancré le {formatDate(result.anchoredAt)}</div>}
              </div>
            </div>
          ) : (
            /* Contenu modifié */
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", background: "var(--terracotta)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="info" size={32} color="white" />
              </div>
              <h3 className="display" style={{ fontSize: 22, marginBottom: 8 }}>Contenu modifié</h3>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 20 }}>
                Le contenu de <strong>{result.title}</strong> a été modifié depuis l'ancrage.
              </p>
              <div style={{ padding: "12px 16px", background: "var(--terracotta-bg)", borderRadius: "var(--r-md)", fontSize: 12, fontFamily: "var(--font-mono)", textAlign: "left", color: "var(--terracotta-deep)" }}>
                <div style={{ marginBottom: 6 }}>Hash ancré&nbsp;&nbsp;&nbsp;: {truncateHash(result.originalHash, 20)}</div>
                <div>Hash actuel : {truncateHash(result.currentHash, 20)}</div>
              </div>
            </div>
          )}

          {result.explorerUrl && (
            <button
              className="btn btn-secondary btn-block"
              style={{ marginTop: 16 }}
              onClick={() => window.open(result.explorerUrl, "_blank", "noopener")}
            >
              <Icon name="link" size={13} /> Voir sur l'explorateur
            </button>
          )}
          <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={reset}>
            Fermer
          </button>
        </div>
      )}
    </Modal>
  );
}
