import { useState, useEffect, useCallback } from "react";
import { Icon } from "../components/Icon";
import { Modal, Spinner, StatusBadge } from "../components/Shared";
import { BookCover } from "../components/BookCover";
import { useToast } from "../components/Toast";
import { orderApi, bookApi } from "../utils/api";

// ─── Constantes ───────────────────────────────────────────────────────────────
const PRICE_PER_PAGE = { A4: 25, A5: 18, POCKET: 15, SQUARE: 22 };
const HARDCOVER_SURCHARGE = 150000; // centimes
const FORMAT_LABELS  = { A4: "A4", A5: "A5", POCKET: "Poche", SQUARE: "Carré" };
const FORMAT_DESC    = { A4: "21×29,7 cm", A5: "14,8×21 cm", POCKET: "10,5×14,8 cm", SQUARE: "21×21 cm" };
const COVER_LABELS   = { PAPERBACK: "Brochée", HARDCOVER: "Rigide" };
const GATEWAY_LABELS = { MOBILE_MONEY: "Mobile Money", FLUTTERWAVE: "Flutterwave", STRIPE: "Stripe" };

const STATUS_STEPS = ["PENDING","CONFIRMED","PRINTING","SHIPPED","DELIVERED"];
const STATUS_ICON  = { PENDING:"clock", CONFIRMED:"check", PRINTING:"edit", SHIPPED:"package", DELIVERED:"check", CANCELLED:"trash", REFUNDED:"credit" };
const STATUS_COLOR = { PENDING:"var(--ochre)", CONFIRMED:"var(--indigo)", PRINTING:"var(--ochre)", SHIPPED:"var(--moss)", DELIVERED:"var(--moss)", CANCELLED:"var(--terracotta)", REFUNDED:"var(--text-secondary)" };

const fmtXOF = (cents) => `${Math.round(cents / 100).toLocaleString('fr-FR')} XOF`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ─── Page principale ──────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("ALL");
  const [selected, setSelected]   = useState(null);
  const [showNew, setShowNew]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.list();
      setOrders(res.data || res.orders || (Array.isArray(res) ? res : []));
    } catch {
      toast.error("Impossible de charger les commandes.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = orders.filter(o => filter === "ALL" || o.status === filter);

  // Stats
  const totalCopies = orders.reduce((a, o) => a + (o.copies ?? 0), 0);
  const totalSpent  = orders.filter(o => o.paidAt).reduce((a, o) => a + (o.totalCents ?? 0), 0);
  const inProgress  = orders.filter(o => ["CONFIRMED","PRINTING","SHIPPED"].includes(o.status)).length;

  const onCancelled = (orderId) => setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
  const onCreated   = (order)   => { setOrders(prev => [order, ...prev]); setSelected(order); };

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Impression</div>
          <h1 className="page-title">Mes <em>commandes</em></h1>
          <p className="page-subtitle">Imprimez vos manuscrits en livres physiques de qualité.</p>
        </div>
        <button className="btn btn-accent btn-lg" onClick={() => setShowNew(true)}>
          <Icon name="plus" size={15} /> Commander un livre
        </button>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────────── */}
      <div className="grid-4 fade-up" data-stagger="1" style={{ marginBottom: 28 }}>
        {[
          { label: "Commandes totales", value: loading ? "—" : orders.length,                    icon: "package",  color: "var(--indigo)",    bg: "var(--indigo-bg)" },
          { label: "Livres imprimés",   value: loading ? "—" : totalCopies,                      icon: "book",     color: "var(--moss)",      bg: "var(--moss-bg)" },
          { label: "Total dépensé",     value: loading ? "—" : fmtXOF(totalSpent),               icon: "credit",   color: "var(--terracotta)", bg: "var(--terracotta-bg)" },
          { label: "En cours",          value: loading ? "—" : inProgress,                        icon: "truck",    color: "var(--ochre)",     bg: "var(--ochre-bg)" },
        ].map((s, i) => (
          <div key={i} className="stat fade-up" data-stagger={i + 1}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={14} color={s.color} />
              </div>
            </div>
            <div className="stat-value" style={{ marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ─── Filtres ─────────────────────────────────────────────────── */}
      <div className="fade-up" data-stagger="2"
        style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-soft)", borderRadius: "var(--r-md)", marginBottom: 20, width: "fit-content", flexWrap: "wrap" }}>
        {[
          ["ALL",       "Toutes",      orders.length],
          ["PENDING",   "En attente",  orders.filter(o => o.status === "PENDING").length],
          ["CONFIRMED", "Confirmées",  orders.filter(o => o.status === "CONFIRMED").length],
          ["PRINTING",  "Impression",  orders.filter(o => o.status === "PRINTING").length],
          ["SHIPPED",   "Expédiées",   orders.filter(o => o.status === "SHIPPED").length],
          ["DELIVERED", "Livrées",     orders.filter(o => o.status === "DELIVERED").length],
          ["CANCELLED", "Annulées",    orders.filter(o => o.status === "CANCELLED").length],
        ].map(([k, l, c]) => (
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

      {/* ─── Tableau ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card" style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spinner size={22} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty fade-up">
          <div className="empty-icon"><Icon name="package" size={28} /></div>
          <div className="display" style={{ fontSize: 18, color: "var(--ink)" }}>
            {filter === "ALL" ? "Aucune commande" : "Aucune commande dans cette catégorie"}
          </div>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
            {filter === "ALL" ? "Commandez votre premier livre imprimé." : ""}
          </p>
          {filter === "ALL" && (
            <button className="btn btn-accent btn-sm" onClick={() => setShowNew(true)}>
              <Icon name="plus" size={13} /> Commander un livre
            </button>
          )}
        </div>
      ) : (
        <div className="card fade-up" data-stagger="3" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Commande</th>
                <th style={{ width: 130 }}>Statut</th>
                <th style={{ width: 130 }}>Format · Couverture</th>
                <th style={{ width: 80, textAlign: "center" }}>Copies</th>
                <th style={{ width: 150, textAlign: "right" }}>Total</th>
                <th style={{ width: 110 }}>Date</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id}
                  onClick={() => setSelected(o)}
                  style={{ cursor: "pointer", animation: `fadeUp 0.3s ${i * 0.03}s var(--ease) both` }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="book" size={16} color="var(--text-secondary)" />
                      </div>
                      <div>
                        <div className="display" style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>
                          {o.book?.title ?? o.bookTitle ?? "—"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                          #{o.id?.slice(-8)} · {o.pageCount ?? '—'} pages
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                    {FORMAT_LABELS[o.printFormat] ?? o.printFormat} · {COVER_LABELS[o.coverType] ?? o.coverType}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 600, color: "var(--ink)" }}>{o.copies}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--terracotta)" }}>
                    {fmtXOF(o.totalCents ?? 0)}
                  </td>
                  <td style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                    {fmtDate(o.createdAt)}
                  </td>
                  <td><Icon name="chevron-r" size={14} color="var(--text-muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Détail ──────────────────────────────────────────────────── */}
      {selected && (
        <OrderDetailModal
          orderId={selected.id}
          onClose={() => setSelected(null)}
          onCancelled={() => { onCancelled(selected.id); setSelected(null); }}
          toast={toast}
        />
      )}

      {/* ─── Nouvelle commande ────────────────────────────────────────── */}
      {showNew && (
        <NewOrderModal
          onClose={() => setShowNew(false)}
          onCreated={onCreated}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─── Détail d'une commande ────────────────────────────────────────────────────
function OrderDetailModal({ orderId, onClose, onCancelled, toast }) {
  const [order, setOrder]     = useState(null);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling]   = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payRef, setPayRef]   = useState("");
  const [gateway, setGateway] = useState("MOBILE_MONEY");

  useEffect(() => {
    Promise.all([
      orderApi.getById(orderId),
      orderApi.getEvents(orderId).catch(() => ({ data: [], events: [] })),
    ]).then(([o, e]) => {
      setOrder(o.order ?? o);
      setEvents(e.data || e.events || (Array.isArray(e) ? e : []));
    }).catch(() => toast.error("Impossible de charger la commande."))
      .finally(() => setLoading(false));
  }, [orderId]); // eslint-disable-line

  const cancel = async () => {
    setCancelling(true);
    try {
      await orderApi.cancel(orderId, { reason: "Annulé par l'utilisateur" });
      toast.success("Commande annulée.");
      onCancelled();
    } catch (e) {
      toast.error(e.message || "Impossible d'annuler.");
      setCancelling(false);
    }
  };

  const confirmPayment = async () => {
    if (!payRef.trim()) { toast.error("Entrez la référence de la transaction."); return; }
    setConfirming(true);
    try {
      const res = await orderApi.confirmPayment(orderId, { paymentGateway: gateway, paymentReference: payRef.trim() });
      setOrder(res.order ?? res);
      toast.success("Paiement confirmé — commande en cours de traitement.");
      setShowPayForm(false);
    } catch (e) {
      toast.error(e.message || "Erreur lors de la confirmation.");
    } finally {
      setConfirming(false);
    }
  };

  const canCancel  = order && ["PENDING","CONFIRMED"].includes(order.status);
  const canConfirm = order && order.status === "PENDING";
  const stepIndex  = STATUS_STEPS.indexOf(order?.status);

  return (
    <Modal open onClose={onClose} title="Détail de la commande" size="lg">
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={22} /></div>
      ) : !order ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 32 }}>Commande introuvable.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ─ Résumé ─ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ padding: 16, background: "var(--bg-soft)", borderRadius: "var(--r-md)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Livre</div>
              <div className="display" style={{ fontSize: 16, color: "var(--ink)", marginBottom: 4 }}>
                {order.book?.title ?? order.bookTitle ?? "—"}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                {FORMAT_LABELS[order.printFormat]} · {COVER_LABELS[order.coverType]} · {order.pageCount} pages
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 12, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>Copies :</span>
                <strong style={{ color: "var(--ink)" }}>{order.copies}</strong>
              </div>
            </div>
            <div style={{ padding: 16, background: "var(--bg-soft)", borderRadius: "var(--r-md)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Prix</div>
              <div className="display" style={{ fontSize: 24, color: "var(--terracotta)", marginBottom: 4 }}>
                {fmtXOF(order.totalCents ?? 0)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {fmtXOF(order.unitPriceCents ?? 0)} / exemplaire
              </div>
              <div style={{ marginTop: 8 }}><StatusBadge status={order.status} /></div>
            </div>
          </div>

          {/* ─ Timeline statut ─ */}
          {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Progression</div>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {STATUS_STEPS.map((s, idx) => {
                  const done    = idx <= stepIndex;
                  const current = idx === stepIndex;
                  return (
                    <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      {idx > 0 && (
                        <div style={{ position: "absolute", top: 14, right: "50%", left: "-50%", height: 2, background: idx <= stepIndex ? "var(--moss)" : "var(--border-soft)", transition: "background 0.3s" }} />
                      )}
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? (current ? "var(--moss)" : "var(--moss-bg)") : "var(--bg-soft)", border: `2px solid ${done ? "var(--moss)" : "var(--border-soft)"}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, transition: "all 0.3s" }}>
                        <Icon name={done ? "check" : "clock"} size={12} color={done ? "var(--moss)" : "var(--text-muted)"} />
                      </div>
                      <div style={{ fontSize: 10.5, color: done ? "var(--moss-deep)" : "var(--text-muted)", marginTop: 6, fontWeight: current ? 600 : 400, textAlign: "center" }}>
                        {s === "PENDING" ? "En attente" : s === "CONFIRMED" ? "Confirmée" : s === "PRINTING" ? "Impression" : s === "SHIPPED" ? "Expédiée" : "Livrée"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─ Adresse ─ */}
          {order.shippingAddress && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Adresse de livraison</div>
              <div style={{ padding: 14, background: "var(--bg-soft)", borderRadius: "var(--r-md)", fontSize: 13.5, color: "var(--ink)", lineHeight: 1.7 }}>
                <strong>{order.shippingAddress.fullName}</strong><br />
                {order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br />
                {order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ''} — {order.shippingAddress.countryCode}<br />
                <span style={{ color: "var(--text-muted)" }}>{order.shippingAddress.phone}</span>
              </div>
              {order.trackingCode && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--moss-bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--moss-deep)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="package" size={14} /> Code de suivi : <strong>{order.trackingCode}</strong>
                </div>
              )}
            </div>
          )}

          {/* ─ Historique événements ─ */}
          {events.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Historique</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {events.map((ev, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderBottom: i < events.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={STATUS_ICON[ev.status] ?? "clock"} size={12} color={STATUS_COLOR[ev.status] ?? "var(--text-muted)"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{ev.status}</div>
                      {ev.note && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>{ev.note}</div>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", flexShrink: 0 }}>{fmtDate(ev.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─ Confirmation paiement ─ */}
          {canConfirm && showPayForm && (
            <div style={{ padding: 16, background: "var(--ochre-bg)", borderRadius: "var(--r-md)", border: "1px solid rgba(201,151,74,0.2)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Confirmer le paiement</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field-group">
                  <label className="field-label">Passerelle</label>
                  <select className="select" value={gateway} onChange={e => setGateway(e.target.value)}>
                    {Object.entries(GATEWAY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Référence transaction</label>
                  <input className="input" placeholder="TXN-2024-00123" value={payRef} onChange={e => setPayRef(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPayForm(false)}>Annuler</button>
                <button className="btn btn-accent" onClick={confirmPayment} disabled={confirming || !payRef.trim()}>
                  {confirming ? <><Spinner size={13} /> Confirmation…</> : <><Icon name="lock" size={13} /> Valider</>}
                </button>
              </div>
            </div>
          )}

          {/* ─ Actions ─ */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            {canConfirm && !showPayForm && (
              <button className="btn btn-accent" onClick={() => setShowPayForm(true)}>
                <Icon name="credit" size={13} /> Confirmer le paiement
              </button>
            )}
            {canCancel && (
              <button className="btn btn-secondary" onClick={cancel} disabled={cancelling}
                style={{ color: "var(--terracotta)", borderColor: "var(--terracotta)" }}>
                {cancelling ? <><Spinner size={13} /> Annulation…</> : <><Icon name="trash" size={13} /> Annuler la commande</>}
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: "auto" }}>Fermer</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Nouvelle commande (wizard 3 étapes) ─────────────────────────────────────
function NewOrderModal({ onClose, onCreated, toast }) {
  const [step, setStep]     = useState(0);
  const [books, setBooks]   = useState([]);
  const [simLoading, setSimLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [simResult, setSimResult] = useState(null);

  const [form, setForm] = useState({
    bookId: "", printFormat: "A5", coverType: "PAPERBACK", copies: 1,
    fullName: "", addressLine1: "", addressLine2: "", city: "", region: "",
    countryCode: "CI", postalCode: "", phone: "",
    gateway: "MOBILE_MONEY", paymentReference: "",
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    bookApi.list()
      .then(res => {
        const list = res.data || res.books || (Array.isArray(res) ? res : []);
        setBooks(list);
        if (list.length > 0) setForm(p => ({ ...p, bookId: list[0].id }));
      })
      .catch(() => {});
  }, []);

  // Simulation prix
  useEffect(() => {
    if (!form.bookId || !form.printFormat || !form.coverType || form.copies < 1) return;
    const t = setTimeout(async () => {
      setSimLoading(true);
      try {
        const res = await orderApi.simulatePrice({
          bookId: form.bookId,
          printFormat: form.printFormat,
          coverType: form.coverType,
          copies: form.copies,
        });
        setSimResult(res);
      } catch { setSimResult(null); }
      finally { setSimLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.bookId, form.printFormat, form.coverType, form.copies]);

  const book = books.find(b => b.id === form.bookId);

  // Calcul local (fallback avant la réponse API)
  const localUnit  = (book?.pageCount || 1) * PRICE_PER_PAGE[form.printFormat] + (form.coverType === "HARDCOVER" ? HARDCOVER_SURCHARGE : 0);
  const localTotal = localUnit * form.copies;

  const displayTotal = simResult?.breakdown?.total ?? `${Math.round(localTotal / 100).toLocaleString('fr-FR')} XOF`;

  // Étape 2 : validation adresse
  const addrValid = form.fullName.trim() && form.addressLine1.trim() && form.city.trim() && form.countryCode && form.phone.trim();

  // Étape 3 : soumettre
  const submit = async () => {
    setSubmitting(true);
    try {
      // 1) Créer la commande
      const payload = {
        bookId: form.bookId,
        printFormat: form.printFormat,
        coverType: form.coverType,
        copies: Number(form.copies),
        shippingAddress: {
          fullName:     form.fullName,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          city:         form.city,
          region:       form.region || undefined,
          countryCode:  form.countryCode,
          postalCode:   form.postalCode || undefined,
          phone:        form.phone,
        },
      };
      const createRes = await orderApi.create(payload);
      const order = createRes.order ?? createRes;

      // 2) Confirmer le paiement si référence fournie
      if (form.paymentReference.trim()) {
        try {
          await orderApi.confirmPayment(order.id, {
            paymentGateway:   form.gateway,
            paymentReference: form.paymentReference.trim(),
          });
          toast.success("Commande créée et paiement confirmé !");
        } catch {
          toast.success("Commande créée. Confirmez le paiement depuis le détail.");
        }
      } else {
        toast.success("Commande créée — en attente de paiement.");
      }

      setCreatedOrder(order);
      onCreated(order);
      onClose();
    } catch (e) {
      toast.error(e.message || "Impossible de créer la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Commander un livre imprimé" subtitle={`Étape ${step + 1} sur 3`} size="lg">
      {/* Barre de progression */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
        {["Configuration","Adresse","Paiement"].map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, cursor: i < step ? "pointer" : "default" }}
            onClick={() => { if (i < step) setStep(i); }}>
            <div style={{ height: 3, borderRadius: 2, background: i <= step ? "var(--terracotta)" : "var(--bg-soft)", transition: "background 0.3s" }} />
            <span style={{ fontSize: 11, color: i <= step ? "var(--terracotta)" : "var(--text-muted)", fontWeight: i === step ? 600 : 400 }}>{s}</span>
          </div>
        ))}
      </div>

      {/* ── Étape 1 : Configuration ── */}
      {step === 0 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="field-group">
            <label className="field-label">Livre à imprimer</label>
            <select className="select" value={form.bookId} onChange={set("bookId")}>
              {books.length === 0
                ? <option>Chargement…</option>
                : books.map(b => <option key={b.id} value={b.id}>{b.title} — {b.pageCount ?? '?'} pages</option>)
              }
            </select>
          </div>

          <div>
            <div className="field-label" style={{ marginBottom: 10 }}>Format d'impression</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {Object.entries(PRICE_PER_PAGE).map(([k, p]) => (
                <button key={k} onClick={() => setForm(f => ({ ...f, printFormat: k }))}
                  style={{
                    padding: "12px 8px", textAlign: "center", cursor: "pointer", transition: "all 0.15s",
                    border: `1.5px solid ${form.printFormat === k ? "var(--terracotta)" : "var(--border-soft)"}`,
                    borderRadius: "var(--r-md)",
                    background: form.printFormat === k ? "var(--terracotta-bg)" : "var(--bg-paper)",
                  }}>
                  <div className="display" style={{ fontSize: 17, color: form.printFormat === k ? "var(--terracotta)" : "var(--ink)" }}>{FORMAT_LABELS[k]}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>{FORMAT_DESC[k]}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{p} XOF/page</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="field-label" style={{ marginBottom: 10 }}>Type de couverture</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["PAPERBACK","Brochée","Souple et économique","Inclus"],["HARDCOVER","Rigide","Cartonnée premium","+1 500 XOF"]].map(([k, l, d, e]) => (
                <button key={k} onClick={() => setForm(f => ({ ...f, coverType: k }))}
                  style={{
                    padding: "14px 16px", textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                    border: `1.5px solid ${form.coverType === k ? "var(--terracotta)" : "var(--border-soft)"}`,
                    borderRadius: "var(--r-md)",
                    background: form.coverType === k ? "var(--terracotta-bg)" : "var(--bg-paper)",
                  }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{l}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{d}</div>
                  <div style={{ fontSize: 12, color: "var(--terracotta)", marginTop: 6, fontWeight: 600 }}>{e}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Nombre d'exemplaires</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="btn btn-secondary" style={{ width: 36, padding: 0, fontSize: 20, lineHeight: 1 }}
                onClick={() => setForm(f => ({ ...f, copies: Math.max(1, f.copies - 1) }))}>−</button>
              <div style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)", padding: "8px 0", background: "var(--bg-soft)", borderRadius: "var(--r-md)" }}>
                {form.copies}
              </div>
              <button className="btn btn-secondary" style={{ width: 36, padding: 0, fontSize: 20, lineHeight: 1 }}
                onClick={() => setForm(f => ({ ...f, copies: Math.min(500, f.copies + 1) }))}>+</button>
            </div>
          </div>

          {/* Estimation */}
          <div style={{ padding: 18, background: "linear-gradient(135deg, var(--moss-bg), var(--bg-paper))", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--moss)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Estimation totale</span>
              {simLoading
                ? <Spinner size={16} />
                : <span className="display" style={{ fontSize: 28, color: "var(--moss-deep)" }}>{displayTotal}</span>
              }
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              {book?.pageCount ?? '?'} pages × {PRICE_PER_PAGE[form.printFormat]} XOF × {form.copies} ex.
              {form.coverType === "HARDCOVER" && " + 1 500 XOF (rigide)"}
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-block" onClick={() => setStep(1)} disabled={!form.bookId}>
            Continuer vers l'adresse <Icon name="arrow-r" size={14} />
          </button>
        </div>
      )}

      {/* ── Étape 2 : Adresse ── */}
      {step === 1 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Nom complet *</label>
              <input className="input" placeholder="Kaboré Moussa" value={form.fullName} onChange={set("fullName")} />
            </div>
            <div className="field-group">
              <label className="field-label">Téléphone *</label>
              <input className="input" placeholder="+225 07 07 00 00 00" value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Adresse *</label>
            <input className="input" placeholder="Cocody, Rue des Jardins" value={form.addressLine1} onChange={set("addressLine1")} />
          </div>
          <div className="field-group">
            <label className="field-label">Complément d'adresse</label>
            <input className="input" placeholder="Appartement, étage…" value={form.addressLine2} onChange={set("addressLine2")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Ville *</label>
              <input className="input" placeholder="Abidjan" value={form.city} onChange={set("city")} />
            </div>
            <div className="field-group">
              <label className="field-label">Région</label>
              <input className="input" placeholder="District Abidjan" value={form.region} onChange={set("region")} />
            </div>
            <div className="field-group">
              <label className="field-label">Pays *</label>
              <select className="select" value={form.countryCode} onChange={set("countryCode")}>
                {[["CI","🇨🇮 Côte d'Ivoire"],["SN","🇸🇳 Sénégal"],["ML","🇲🇱 Mali"],["BF","🇧🇫 Burkina Faso"],["GN","🇬🇳 Guinée"],["TG","🇹🇬 Togo"],["BJ","🇧🇯 Bénin"],["FR","🇫🇷 France"]].map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setStep(0)}><Icon name="arrow-l" size={13} /> Retour</button>
            <button className="btn btn-primary btn-block" onClick={() => setStep(2)} disabled={!addrValid}>
              Continuer vers le paiement <Icon name="arrow-r" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Étape 3 : Paiement ── */}
      {step === 2 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Récap */}
          <div style={{ padding: 16, background: "var(--bg-soft)", borderRadius: "var(--r-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="display" style={{ fontSize: 15, color: "var(--ink)" }}>{book?.title ?? "—"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {FORMAT_LABELS[form.printFormat]} · {COVER_LABELS[form.coverType]} · {form.copies} exemplaire{form.copies > 1 ? "s" : ""}
              </div>
            </div>
            <div className="display" style={{ fontSize: 24, color: "var(--terracotta)" }}>{displayTotal}</div>
          </div>

          {/* Méthode */}
          <div className="field-label">Méthode de paiement</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["MOBILE_MONEY", "Mobile Money", "MTN · Orange · Moov · Wave"],
              ["FLUTTERWAVE",  "Flutterwave",  "Carte bancaire Afrique"],
              ["STRIPE",       "Stripe",        "Visa · Mastercard"],
            ].map(([k, l, d]) => (
              <label key={k} onClick={() => setForm(f => ({ ...f, gateway: k }))}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer",
                  border: `1.5px solid ${form.gateway === k ? "var(--terracotta)" : "var(--border-soft)"}`,
                  borderRadius: "var(--r-md)",
                  background: form.gateway === k ? "var(--terracotta-bg)" : "var(--bg-paper)",
                  transition: "all 0.15s",
                }}>
                <input type="radio" name="gw" readOnly checked={form.gateway === k} style={{ accentColor: "var(--terracotta)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{l}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{d}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="field-group">
            <label className="field-label">Référence de transaction <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel — à compléter après paiement)</span></label>
            <input className="input" placeholder="TXN-2024-00123456" value={form.paymentReference} onChange={set("paymentReference")} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={submitting}>
              <Icon name="arrow-l" size={13} /> Retour
            </button>
            <button className="btn btn-accent btn-block" onClick={submit} disabled={submitting}>
              {submitting ? <><Spinner size={14} /> Traitement…</> : <><Icon name="lock" size={13} /> Confirmer la commande</>}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
            <Icon name="lock" size={11} /> Paiement sécurisé · Données chiffrées
          </div>
        </div>
      )}
    </Modal>
  );
}
